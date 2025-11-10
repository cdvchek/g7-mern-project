// routes/banks.js
const express = require('express');
const router = express.Router();

const requireAuth = require('../../middleware/requireAuth'); // attaches req.userId
const { BankConnection, Account } = require('../../models');

router.delete('/:itemId', requireAuth, async (req, res) => {
    const { itemId } = req.params;

    const conn = await BankConnection.findOne({ userId: req.userId, item_id: itemId });
    if (!conn) return res.status(404).json({ error: 'bank_connection_not_found' });

    let deletedAccounts = 0;
    let deletedConnections = 0;

    try {
        const accResult = await Account.deleteMany({
            user_id: req.userId,
            plaid_item_id: itemId,
        });
        deletedAccounts = accResult?.deletedCount ?? 0;

        const connResult = await BankConnection.deleteOne({ _id: conn._id });
        deletedConnections = connResult?.deletedCount ?? 0;

        return res.json({
            ok: true,
            deletedAccounts,
            deletedConnections,
            item_id: itemId,
        });
    } catch (err) {
        console.error('BANK HARD DELETE ERROR:', err);
        return res.status(500).json({ error: 'bank_delete_failed' });
    }
});

module.exports = router;
