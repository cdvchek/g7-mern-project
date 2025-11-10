const router = require('express').Router();
const requireAuth = require('../../middleware/requireAuth');
const { Transaction } = require('../../models');
const mongoose = require('mongoose');

const VALID_KINDS = ['ACCOUNT_TRACK', 'ACCOUNT_UNTRACK', 'REAL'];

router.put('/:id', requireAuth, async (req, res) => {
    try {
        const user_id = req.userId;
        const transactionId = req.params.id;

        // Validate transaction ID
        if (!mongoose.Types.ObjectId.isValid(transactionId)) {
            return res.status(400).json({ error: 'Invalid transaction ID.' });
        }

        // Allowed update fields
        const allowed = ['account_id', 'kind', 'amount_cents', 'allocated', 'posted_at', 'name', 'merchant_name', 'category'];
        const updates = {};
        for (const key of allowed) {
            if (Object.prototype.hasOwnProperty.call(req.body, key)) {
                updates[key] = req.body[key];
            }
        }

        if (updates.account_id && !mongoose.Types.ObjectId.isValid(updates.account_id)) {
            return res.status(400).json({ error: 'Invalid account_id.' });
        }

        if (updates.kind && !VALID_KINDS.includes(updates.kind)) {
            return res.status(400).json({ error: `Invalid kind. Must be one of: ${VALID_KINDS.join(', ')}` });
        }

        if (updates.posted_at) {
            const d = new Date(updates.posted_at);
            if (isNaN(d.getTime())) return res.status(400).json({ error: 'Invalid posted_at date.' });
            updates.posted_at = d;
        }

        if (typeof updates.amount_cents !== 'undefined') updates.amount_cents = Number(updates.amount_cents);
        if (typeof updates.allocated !== 'undefined') updates.allocated = Boolean(updates.allocated);
        if (updates.category && !Array.isArray(updates.category)) updates.category = [updates.category];

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: 'No valid fields to update.' });
        }

        const transaction = await Transaction.findOneAndUpdate(
            { _id: transactionId, user_id },
            { $set: updates },
            { new: true, runValidators: true }
        ).populate('account_id', 'name');

        if (!transaction) return res.status(404).json({ error: 'Transaction not found.' });

        return res.json({ transaction: transaction.toSafeJSON(), message: 'Transaction updated successfully.' });
    } catch (err) {
        console.error('[update-transaction]', err);
        return res.status(500).json({ error: 'Server error while updating transaction.' });
    }
});

module.exports = router;