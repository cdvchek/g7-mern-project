// routes/banks.js
const express = require('express');
const router = express.Router();

const requireAuth = require('../../middleware/requireAuth'); // attaches req.userId
const { BankConnection, Account } = require('../../models');

// DELETE /api/banks/:itemId
// Soft-unlink a bank; hide its accounts (don’t hard delete)
router.delete('/:itemId', requireAuth, async (req, res) => {
    const { itemId } = req.params;

    const conn = await BankConnection.findOne({ userId: req.userId, item_id: itemId });
    if (!conn) return res.status(404).json({ error: 'bank_connection_not_found' });

    await BankConnection.updateOne({ _id: conn._id }, { $set: { removed: true } });
    await Account.updateMany(
        { user_id: req.userId, plaid_item_id: itemId },
        { $set: { hidden: true, tracking: false } }
    );

    return res.json({ ok: true });
});

module.exports = router;
