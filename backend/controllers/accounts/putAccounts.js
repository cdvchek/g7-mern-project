// routes/accounts.js
const express = require('express');
const router = express.Router();

const requireAuth = require('../../middleware/requireAuth');
const { Account, Transaction } = require('../../models');

// PATCH /api/accounts/:accountId
// Update app-level fields (tracking/hidden/name)
router.put('/:accountId', requireAuth, async (req, res) => {
    const { accountId } = req.params;
    const { tracking } = req.body || {};

    const acc = await Account.findOne({ _id: accountId, user_id: req.userId });
    if (!acc) return res.status(404).json({ error: 'account_not_found' });

    if (typeof tracking === 'boolean') acc.tracking = tracking;

    await acc.save();

    const deleted = await Transaction.findOneAndDelete({ account_id: accountId, from_account_tracking: true, allocated: false });

    if (!deleted) {
        const amount = (tracking) ? acc.balance_current : -acc.balance_current;
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

    return res.json({ ok: true, account: acc.toSafeJSON() });
});

module.exports = router;
