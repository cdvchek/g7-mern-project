// routes/accounts.js
const express = require('express');
const router = express.Router();

const requireAuth = require('../../middleware/requireAuth');
const { Account, Transaction } = require('../../models');
const { syncTransactionsForItem, refreshAccountsForItem } = require('../../util/plaidSync');

// PATCH /api/accounts/:accountId
// Update app-level fields (tracking/hidden/name)
router.put('/:accountId', requireAuth, async (req, res) => {
    const { accountId } = req.params;
    const { item_id, tracking } = req.body || {};

    await refreshAccountsForItem(item_id);

    const acc = await Account.findOne({ _id: accountId, user_id: req.userId });
    if (!acc) return res.status(404).json({ error: 'account_not_found' });

    const wasTracking = !!acc.tracking;

    if (typeof tracking === 'boolean') {
        if (tracking && !wasTracking) acc.tracked_on = new Date();
        acc.tracking = tracking;
    }

    await acc.save();

    const deleted = await Transaction.findOneAndDelete({ account_id: accountId, from_account_tracking: true, allocated: false });

    if (!deleted) {
        const balance = Number.isFinite(acc.balance_current) ? acc.balance_current : 0;
        const amount = (tracking) ? balance : -balance;
        await Transaction.create({
            user_id: req.userId,
            account_id: acc._id,
            from_account_tracking: true,
            amount_cents: Math.floor(amount * 100),
            posted_at: new Date(),
            plaid_transaction_id: null,
            name: null,
            merchant_name: null,
            category: []
        });
    }

    if (tracking && !wasTracking) {
        try {
            syncTransactionsForItem(acc.plaid_item_id, { includePending: false })
                .catch(err => console.error('txn sync error:', err));
        } catch (e) {
            console.error('enqueue txn sync error:', e);
        }
    }

    return res.json({ ok: true, account: acc.toSafeJSON() });
});

module.exports = router;
