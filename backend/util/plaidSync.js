// util/plaidSync.js
const { plaid } = require('../connection/plaid');
const { BankConnection, Account } = require('../models');
const { decrypt } = require('./crypto');

/**
 * Fetch accounts from Plaid for a given item_id and upsert them in Mongo.
 * - Does NOT overwrite app flags (tracking/hidden).
 * - Updates cached balances and basic identity fields.
 * - Stamps BankConnection.status with lastGoodSyncAt / lastAttemptAt / lastError.
 *
 * @param {string} item_id - Plaid item_id for the bank connection
 * @returns {Promise<Array<Object>>} upserted Account docs (lean plain objects)
 * @throws if the BankConnection is missing or Plaid call fails
 */
async function refreshAccountsForItem(item_id) {
    if (!item_id) throw new Error('missing_item_id');

    // Find the bank connection and decrypt the access token
    const conn = await BankConnection.findOne({ item_id, removed: { $ne: true } });
    if (!conn) throw new Error('bank_connection_not_found');

    // Mark attempt
    await BankConnection.updateOne(
        { _id: conn._id },
        { $set: { 'status.lastAttemptAt': new Date() } }
    );

    let access_token;
    try {
        access_token = decrypt(conn.accessToken);
    } catch (e) {
        await BankConnection.updateOne(
            { _id: conn._id },
            { $set: { 'status.lastError': { message: `decrypt_failed: ${String(e)}`, at: new Date() } } }
        );
        throw e;
    }

    // Call Plaid for accounts
    let accounts = [];
    try {
        const r = await plaid.accountsGet({ access_token });
        accounts = r?.data?.accounts || [];
    } catch (e) {
        await BankConnection.updateOne(
            { _id: conn._id },
            { $set: { 'status.lastError': formatPlaidError(e) } }
        );
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

                    // Cached balances (don’t touch app flags)
                    balances: {
                        available: a?.balances?.available ?? null,
                        current: a?.balances?.current ?? null,
                        limit: a?.balances?.limit ?? null,
                        iso_currency_code: a?.balances?.iso_currency_code || 'USD',
                        unofficial_currency_code: a?.balances?.unofficial_currency_code || '',
                        lastUpdatedAt: new Date(),
                    },
                },
                {
                    upsert: true,
                    new: true,
                    setDefaultsOnInsert: true,
                }
            ).lean()
        )
    );

    // Mark success
    await BankConnection.updateOne(
        { _id: conn._id },
        { $set: { 'status.lastGoodSyncAt': new Date(), 'status.lastError': null } }
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

module.exports = {
    refreshAccountsForItem,
    refreshAllItemsForUser,
};
