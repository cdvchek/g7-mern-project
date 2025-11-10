// routes/accounts.js
const express = require('express');
const router = express.Router();

const requireAuth = require('../../middleware/requireAuth'); // attaches req.userId
const { Account } = require('../../models');

// GET /api/accounts/tracked
// Handy utility to list all tracked accounts
router.get('/tracked', requireAuth, async (req, res) => {
    const list = await Account.find({
        user_id: req.userId,
        tracking: true,
        hidden: { $ne: true },
    })
        .sort({ name: 1 })
        .lean();

    return res.json({
        data: list.map(a => ({
            id: String(a._id),
            plaid_account_id: a.plaid_account_id,
            name: a.name,
            balances: a.balances,
            type: a.type,
            subtype: a.subtype,
        })),
    });
});

module.exports = router;
