// routes/banks.js
const express = require('express');
const router = express.Router();

const requireAuth = require('../../middleware/requireAuth');
const { BankConnection } = require('../../models');
const { refreshAccountsForItem } = require('../../util/plaidSync');

// POST /api/banks/:itemId/refresh-accounts
// Pull latest accounts from Plaid and upsert
router.post('/:itemId', requireAuth, async (req, res) => {
    const { itemId } = req.params;

    const conn = await BankConnection.findOne({
        userId: req.userId,
        item_id: itemId,
        removed: { $ne: true },
    }).lean();

    if (!conn) return res.status(404).json({ error: 'bank_connection_not_found' });

    try {
        const upserts = await refreshAccountsForItem(itemId);
        return res.json({
            ok: true,
            item_id: itemId,
            accounts: upserts.map(a => ({
                id: String(a._id),
                plaid_account_id: a.plaid_account_id,
                name: a.name,
            })),
        });
    } catch (e) {
        await BankConnection.updateOne(
            { item_id: itemId },
            { $set: { 'status.lastError': { message: String(e), at: new Date() }, 'status.lastAttemptAt': new Date() } }
        );
        return res.status(500).json({ error: 'refresh_failed' });
    }
});

module.exports = router;
