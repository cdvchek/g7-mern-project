const { plaid } = require('../connection/plaid');
const { BankConnection, Account, Transaction } = require('../models');
const { decrypt } = require('./crypto');

const toCents = (v) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return null;
    const cents = Math.round(n * 100);
    return cents === 0 ? 0 : cents;
};

async function refreshAccountsForItem(item_id) {
    if (!item_id) throw new Error('missing_item_id');

    // Find the bank connection and decrypt the access token
    const conn = await BankConnection.findOne({ item_id, removed: { $ne: true } });
    if (!conn) throw new Error('bank_connection_not_found');

    let access_token;
    try {
        access_token = decrypt(conn.accessToken);
    } catch (e) {
        throw e;
    }

    // Call Plaid for accounts
    let accounts = [];
    try {
        const plaidRes = await plaid.accountsGet({ access_token });
        accounts = plaidRes?.data?.accounts || [];
    } catch (e) {
        throw e;
    }

    // Upsert each account keyed by plaid_account_id (Plaid's account_id)
    const upserts = await Promise.all(
        accounts.map((a) =>
            Account.findOneAndUpdate(
                { plaid_account_id: a.account_id },
                {
                    // Identity / keys
                    user_id: conn.userId,
                    plaid_item_id: item_id,
                    plaid_account_id: a.account_id,

                    // Names/mask
                    name: a.name || a.official_name || 'Account',
                    official_name: a.official_name || '',
                    mask: a.mask || '',

                    // Classification
                    type: a.type || '',
                    subtype: a.subtype || '',

                    balance_current: toCents(a?.balances?.current),
                },
                {
                    upsert: true,
                    new: true,
                    setDefaultsOnInsert: true,
                }
            ).lean()
        )
    );

    return upserts;
}


/**
 * Convenience: refresh all connections for a given user (optional utility).
 * Useful for a "Refresh All" button or a nightly job.
 *
 * @param {string} userId - Mongo ObjectId string
 * @returns {Promise<Record<string, Array<Object>>>} map of item_id -> upserted accounts
 */
async function refreshAllItemsForUser(userId) {
    const result = {};
    const items = await BankConnection.find({ userId, removed: { $ne: true } }, { item_id: 1 }).lean();
    for (const i of items) {
        try {
            result[i.item_id] = await refreshAccountsForItem(i.item_id);
        } catch (e) {
            // keep going; record the failure on the connection inside refresh
            result[i.item_id] = { error: String(e) };
        }
    }
    return result;
}


function pickPostedAt(t) {
    // Prefer posted date; fallback to authorized date; fallback to "today"
    const iso = t.date || t.authorized_date || new Date().toISOString().slice(0, 10);
    // normalize to noon UTC to avoid TZ re-interpretation on clients
    return new Date(`${iso}T12:00:00Z`);
}

function toTxnDoc({ t, userId, accountId }) {
    return {
        user_id: userId,
        account_id: accountId,
        kind: 'REAL',
        // Plaid: outflows positive, inflows negative → flip to our convention: inflow positive
        amount_cents: Math.round(-t.amount * 100),
        allocated: false,
        posted_at: pickPostedAt(t),

        plaid_transaction_id: t.transaction_id,
        name: t.name || '',
        merchant_name: t.merchant_name || '',
        category: Array.isArray(t.category) ? t.category : [],
    };
}

/**
 * Sync transactions for a Plaid item into our DB.
 * Only stores txns for accounts that are tracked AND with posted_at >= tracked_on.
 * @param {string} item_id - Plaid item_id for the bank connection
 * @param {{ daysRequested?: number, includePending?: boolean }} opts
 */
async function syncTransactionsForItem(item_id, { daysRequested = 90, includePending = true } = {}) {
    if (!item_id) throw new Error('missing_item_id');

    const conn = await BankConnection.findOne({ item_id });
    if (!conn) throw new Error('bank_connection_not_found');

    const access_token = decrypt(conn.accessToken);

    // Build mapping Plaid account_id -> local account (we need tracking + tracked_on)
    const accounts = await Account.find({ user_id: conn.userId, plaid_item_id: item_id }).lean();
    const byPlaidId = new Map(accounts.map(a => [a.plaid_account_id, a]));

    // Only consider tracked accounts
    const trackedPlaidIds = new Set(accounts.filter(a => a.tracking).map(a => a.plaid_account_id));

    let cursor = conn.next_txn_cursor || null;
    let hasMore = true;

    // Stats (optional return)
    let addedCount = 0;
    let modifiedCount = 0;
    let removedCount = 0;
    let skippedUntracked = 0;
    let skippedBeforeTrackedOn = 0;
    let skippedPending = 0;

    while (hasMore) {
        const payload = cursor
            ? { access_token, cursor }
            : { access_token, options: { days_requested: daysRequested } };

        const resp = await plaid.transactionsSync(payload);
        const { added = [], modified = [], removed = [], next_cursor, has_more } = resp.data || {};

        // ADDED
        for (const t of added) {
            // filter to tracked accounts
            if (!trackedPlaidIds.has(t.account_id)) {
                skippedUntracked++;
                continue;
            }
            const acct = byPlaidId.get(t.account_id);
            if (!acct) {
                skippedUntracked++;
                continue;
            }

            // pending filter (optional)
            if (!includePending && t.pending) {
                skippedPending++;
                continue;
            }

            // cutoff: only on/after tracked_on
            const posted = pickPostedAt(t);
            if (acct.tracked_on && posted < new Date(acct.tracked_on)) {
                skippedBeforeTrackedOn++;
                continue;
            }

            const doc = toTxnDoc({ t, userId: conn.userId, accountId: acct._id });

            // upsert by plaid_transaction_id (unique+sparse)
            await Transaction.updateOne(
                { user_id: conn.userId, plaid_transaction_id: t.transaction_id },
                {
                    $setOnInsert: doc,
                    // keep these fresh if Plaid later modifies
                    $set: {
                        amount_cents: doc.amount_cents,
                        posted_at: doc.posted_at,
                        name: doc.name,
                        merchant_name: doc.merchant_name,
                        category: doc.category,
                    },
                },
                { upsert: true }
            );
            addedCount++;
        }

        // MODIFIED (e.g., pending→posted, amount/date/category updates)
        for (const t of modified) {
            const patch = {
                amount_cents: Math.round(-t.amount * 100),
                posted_at: pickPostedAt(t),
                name: t.name || '',
                merchant_name: t.merchant_name || '',
                category: Array.isArray(t.category) ? t.category : [],
            };

            await Transaction.updateOne(
                { user_id: conn.userId, plaid_transaction_id: t.transaction_id },
                { $set: patch }
            );
            modifiedCount++;
        }

        // REMOVED (Plaid retractions)
        if (removed.length) {
            const ids = removed.map(r => r.transaction_id);
            // safer default: only remove if not allocated yet
            const res = await Transaction.deleteMany({
                user_id: conn.userId,
                plaid_transaction_id: { $in: ids },
                allocated: false,
                kind: 'REAL',
            });
            removedCount += res.deletedCount || 0;
        }

        cursor = next_cursor;
        hasMore = !!has_more;
    }

    if (cursor !== conn.next_txn_cursor) {
        conn.next_txn_cursor = cursor;
        await conn.save();
    }

    return {
        ok: true,
        item_id,
        addedCount,
        modifiedCount,
        removedCount,
        skippedUntracked,
        skippedBeforeTrackedOn,
        skippedPending,
    };
}

/**
 * Normalize Plaid error details for storage on BankConnection.status.lastError
 */
function formatPlaidError(e) {
    const now = new Date();
    const data = e?.response?.data;
    if (data && (data.error_code || data.error_type || data.error_message)) {
        return {
            code: data.error_code || undefined,
            type: data.error_type || undefined,
            message: data.error_message || String(e),
            at: now,
        };
    }
    return { message: String(e), at: now };
}

async function syncAllForUser(userId, {
    daysRequested = 90,
    includePending = true,
    refreshOnly = false,     // when true: refresh accounts but skip txn sync
    concurrency = 3,
} = {}) {
    const items = await BankConnection
        .find({ userId, removed: { $ne: true } }, { item_id: 1 })
        .lean();

    const limit = pLimit(concurrency);
    const results = {};

    await Promise.all(items.map(i => limit(async () => {
        const itemId = i.item_id;
        results[itemId] = { item_id: itemId };

        try {
            const accounts = await refreshAccountsForItem(itemId);
            results[itemId].accounts = accounts;
            // Optionally stamp lastAccountsRefreshAt:
            // await BankConnection.updateOne({ item_id: itemId }, { $set: { 'status.lastAccountsRefreshAt': new Date() } });
        } catch (e) {
            const err = formatPlaidError(e);
            results[itemId].error_refresh = err;
            // Optionally persist:
            // await BankConnection.updateOne({ item_id: itemId }, { $set: { 'status.lastError': err } });
            // If refresh fails, you can still try txn sync (or bail). Here we bail:
            if (refreshOnly) return;
            // else continue to txn sync attempt if you prefer; many teams bail.
            return;
        }

        if (refreshOnly) return;

        try {
            const syncRes = await syncTransactionsForItem(itemId, { daysRequested, includePending });
            results[itemId].transactions = syncRes;
            // Optionally stamp lastTxnSyncAt:
            // await BankConnection.updateOne({ item_id: itemId }, { $set: { 'status.lastTxnSyncAt': new Date() } });
        } catch (e) {
            const err = formatPlaidError(e);
            results[itemId].error_sync = err;
            // Optionally persist:
            // await BankConnection.updateOne({ item_id: itemId }, { $set: { 'status.lastError': err } });
        }
    })));

    return results;
}

module.exports = {
    refreshAccountsForItem,
    refreshAllItemsForUser,
    syncTransactionsForItem,
    syncAllForUser
};
