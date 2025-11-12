const router = require('express').Router();
const requireAuth = require('../../middleware/requireAuth');
const { Transaction, Envelope } = require('../../models');
const mongoose = require('mongoose');

router.put('/:id', requireAuth, async (req, res) => {
    try {
        const user_id = req.userId;
        const transactionId = req.params.id;

        // Validate transaction ID
        if (!mongoose.Types.ObjectId.isValid(transactionId)) {
            return res.status(400).json({ error: 'Invalid transaction ID.' });
        }

        // Allowed update fields
        const allowed = ['account_id', 'amount_cents', 'allocated', 'posted_at', 'name', 'merchant_name', 'category'];
        const updates = {};
        for (const key of allowed) {
            if (Object.prototype.hasOwnProperty.call(req.body, key)) {
                updates[key] = req.body[key];
            }
        }

        if (updates.account_id && !mongoose.Types.ObjectId.isValid(updates.account_id)) {
            return res.status(400).json({ error: 'Invalid account_id.' });
        }

        if (updates.posted_at) {
            const d = new Date(updates.posted_at);
            if (isNaN(d.getTime())) return res.status(400).json({ error: 'Invalid posted_at date.' });
            updates.posted_at = d;
        }

        if (typeof updates.amount_cents !== 'undefined') updates.amount_cents = Number(updates.amount_cents);
        if (typeof updates.allocated !== 'undefined') updates.allocated = Number(updates.allocated);
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

// PUT /allocate/:id
router.put('/allocate/:id', requireAuth, async (req, res) => {
    const session = await mongoose.startSession();
    try {
        const user_id = req.userId;
        const transactionId = req.params.id;
        const { splits } = req.body;

        // ---- Basic validations
        if (!mongoose.Types.ObjectId.isValid(transactionId)) {
            return res.status(400).json({ error: 'Invalid transaction ID.' });
        }
        if (!Array.isArray(splits) || splits.length === 0) {
            return res.status(400).json({ error: 'splits must be a non-empty array.' });
        }

        for (let i = 0; i < splits.length; i++) {
            const split = splits[i];
            if (!split || !split.envelope_id || !mongoose.Types.ObjectId.isValid(split.envelope_id)) {
                return res.status(400).json({ error: 'Invalid envelope ID in splits.' });
            }
            if (
                typeof split.amount_cents !== 'number' ||
                !Number.isInteger(split.amount_cents) ||
                split.amount_cents <= 0
            ) {
                return res.status(400).json({
                    error: 'Each split.amount_cents must be a positive integer (cents).'
                });
            }
        }

        // ---- Load the target transaction
        const tx = await Transaction.findOne({ _id: transactionId, user_id });
        if (!tx) {
            return res.status(404).json({ error: 'Transaction not found.' });
        }
        if (tx.allocated) {
            return res.status(409).json({ error: 'Transaction is already allocated.' });
        }

        // ---- Enforce "oldest unallocated"
        const oldestUnalloc = await Transaction.findOne({ user_id, allocated: false })
            .sort({ posted_at: 1, createdAt: 1, _id: 1 })
            .select('_id');

        if (!oldestUnalloc || String(oldestUnalloc._id) !== String(tx._id)) {
            return res.status(409).json({
                error: 'Only the oldest unallocated transaction can be allocated.',
                oldest_unallocated_id: oldestUnalloc?._id
            });
        }

        // ---- Validate split totals
        const totalSplitCents = splits.reduce((s, r) => s + r.amount_cents, 0);
        const neededCents = Math.abs(tx.amount_cents);
        if (totalSplitCents !== neededCents) {
            return res.status(400).json({
                error: 'Splits must sum exactly to the absolute value of the transaction amount.',
                needed_cents: neededCents,
                provided_cents: totalSplitCents
            });
        }

        // ---- Verify envelopes exist & belong to user
        const envelopeIds = splits.map((s) => s.envelope_id);
        const envelopes = await Envelope.find({ _id: { $in: envelopeIds }, user_id }).lean();
        if (envelopes.length !== envelopeIds.length) {
            return res.status(404).json({ error: 'One or more envelopes not found for this user.' });
        }

        // Quick lookup
        const envMap = new Map(envelopes.map((e) => [String(e._id), e]));

        // ---- For spending (negative), prevent going below zero (optional strictness)
        if (tx.amount_cents < 0) {
            for (const s of splits) {
                const e = envMap.get(String(s.envelope_id));
                const current = e?.amount ?? 0; // Int32 cents
                const next = current - s.amount_cents;
                if (next < 0) {
                    return res.status(400).json({
                        error: `Envelope "${e.name}" would go negative.`,
                        envelope_id: e._id,
                        current_balance_cents: current,
                        attempted_debit_cents: s.amount_cents
                    });
                }
            }
        }

        // ---- Atomic apply
        await session.withTransaction(async () => {
            // Build $inc ops against Envelope.amount (Int32 cents)
            const incOps = splits.map((s) => ({
                updateOne: {
                    filter: { _id: s.envelope_id, user_id },
                    update: {
                        $inc: {
                            amount: tx.amount_cents > 0 ? +s.amount_cents : -s.amount_cents
                        }
                    }
                }
            }));

            if (incOps.length) {
                await Envelope.bulkWrite(incOps, { session });
            }

            // Mark transaction allocated (+ optionally persist allocations)
            const setUpdate = {
                allocated: true,
                updatedAt: new Date()
                // allocations: splits, // <- add to schema if you want an audit trail
            };

            const updatedTx = await Transaction.findOneAndUpdate(
                { _id: transactionId, user_id },
                { $set: setUpdate },
                { new: true, runValidators: true, session }
            );

            // Return updated envelopes (normalized)
            const freshEnvs = await Envelope.find(
                { _id: { $in: envelopeIds }, user_id },
                null,
                { session }
            );

            res.status(200).json({
                ok: true,
                transaction: updatedTx,
                envelopes: freshEnvs.map((e) => e.toSafeJSON())
            });
        });
    } catch (error) {
        console.error('Allocation error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Internal server error during allocation.' });
        }
    } finally {
        session.endSession();
    }
});


module.exports = router;