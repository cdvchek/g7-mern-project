// routes/accounts.js
const express = require('express');
const router = express.Router();

const requireAuth = require('../../middleware/requireAuth');
const { Account } = require('../../models');

// PATCH /api/accounts/:accountId
// Update app-level fields (tracking/hidden/name)
router.put('/:accountId', requireAuth, async (req, res) => {
    const { accountId } = req.params;
    const { tracking, hidden, name } = req.body || {};

    const acc = await Account.findOne({ _id: accountId, user_id: req.userId });
    if (!acc) return res.status(404).json({ error: 'account_not_found' });

    if (typeof tracking === 'boolean') acc.tracking = tracking;
    if (typeof hidden === 'boolean') acc.hidden = hidden;
    if (typeof name === 'string' && name.trim()) acc.name = name.trim();

    await acc.save();
    return res.json({ ok: true, account: acc.toSafeJSON() });
});

module.exports = router;
