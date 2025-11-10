// routes/banks.js
const express = require('express');
const router = express.Router();

const requireAuth = require('../../middleware/requireAuth'); // attaches req.userId
const { BankConnection, Account } = require('../../models');

// GET /api/banks
// List this user's bank connections
router.get('/', requireAuth, async (req, res) => {
    const conns = await BankConnection.find({ userId: req.userId, removed: { $ne: true } })
        .sort({ createdAt: -1 })
        .lean();

    return res.json({
        data: conns.map(c => ({
            id: String(c._id),
            item_id: c.item_id,
            institution: c.institution,
            status: c.status,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
        })),
    });
});

// GET /api/banks/:itemId/accounts
// List accounts for a specific connection (by Plaid item_id)
router.get('/:itemId/accounts', requireAuth, async (req, res) => {
    const { itemId } = req.params;

    const conn = await BankConnection.findOne({
        userId: req.userId,
        item_id: itemId,
        removed: { $ne: true },
    }).lean();

    if (!conn) return res.status(404).json({ error: 'bank_connection_not_found' });

    const accounts = await Account.find({ user_id: req.userId, plaid_item_id: itemId })
        .sort({ name: 1 })
        .lean();

    return res.json({
        data: accounts.map(a => ({
            id: String(a._id),
            plaid_account_id: a.plaid_account_id,
            name: a.name,
            official_name: a.official_name,
            mask: a.mask,
            type: a.type,
            subtype: a.subtype,
            balances: a.balances,
            tracking: !!a.tracking,
            hidden: !!a.hidden,
            createdAt: a.createdAt,
            updatedAt: a.updatedAt,
        })),
    });
});

module.exports = router;
