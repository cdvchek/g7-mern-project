const router = require('express').Router();
const requireAuth = require('../../middleware/requireAuth');
const { Transaction, Envelope, Account } = require('../../models');
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

// PUT /api/transactions/allocate/:id
router.put('/allocate/:id', requireAuth, async (req, res) => {
    const session = await mongoose.startSession();
    try {
        const user_id = req.userId;
        const transactionId = req.params.id;
        const { splits } = req.body || {};

        // ---- Basic validations
        if (!mongoose.Types.ObjectId.isValid(transactionId)) {
            return res.status(400).json({ error: 'invalid_transaction_id' });
        }
        if (!Array.isArray(splits) || splits.length === 0) {
            return res.status(400).json({ error: 'splits_must_be_non_empty_array' });
        }
        for (const s of splits) {
            if (!s || !s.envelope_id || !mongoose.Types.ObjectId.isValid(s.envelope_id)) {
                return res.status(400).json({ error: 'invalid_envelope_id_in_splits' });
            }
            if (typeof s.amount_cents !== 'number' || !Number.isInteger(s.amount_cents) || s.amount_cents <= 0) {
                return res.status(400).json({ error: 'split_amount_cents_must_be_positive_integer' });
            }
        }

        // ---- Load transaction
        const tx = await Transaction.findOne({ _id: transactionId, user_id });
        if (!tx) return res.status(404).json({ error: 'transaction_not_found' });

        const absTotal = Math.abs(Number(tx.amount || 0));
        const already = Math.max(0, Number(tx.allocated || 0));
        const remaining = Math.max(0, absTotal - already);
        if (remaining === 0) {
            return res.status(409).json({ error: 'transaction_already_fully_allocated' });
        }

        // ---- Oldest-first (oldest where allocated < |amount|)
        const oldestNeedingAgg = await Transaction.aggregate([
            { $match: { user_id: new mongoose.Types.ObjectId(user_id) } },
            { $addFields: { absAmount: { $abs: "$amount" } } },
            { $match: { $expr: { $lt: ["$allocated", "$absAmount"] } } },
            { $sort: { posted_at: 1, createdAt: 1, _id: 1 } },
            { $limit: 1 }
        ]);
        const oldestNeeding = oldestNeedingAgg[0];
        if (!oldestNeeding || String(oldestNeeding._id) !== String(tx._id)) {
            return res.status(409).json({
                error: 'must_allocate_oldest_first',
                oldest_unallocated_id: oldestNeeding ? oldestNeeding._id : null
            });
        }

        // ---- Allow PARTIAL: total must be > 0 and <= remaining
        const totalSplitCents = splits.reduce((s, r) => s + r.amount_cents, 0);
        if (totalSplitCents <= 0 || totalSplitCents > remaining) {
            return res.status(400).json({
                error: 'splits_must_be_positive_and_not_exceed_remaining',
                remaining_cents: remaining,
                provided_cents: totalSplitCents
            });
        }

        // ---- Verify envelopes belong to user
        const envelopeIds = splits.map(s => new mongoose.Types.ObjectId(s.envelope_id));
        const envs = await Envelope.find({ _id: { $in: envelopeIds }, user_id }).lean();
        if (envs.length !== envelopeIds.length) {
            return res.status(404).json({ error: 'one_or_more_envelopes_not_found' });
        }
        const envMap = new Map(envs.map(e => [String(e._id), e]));

        // ---- Optional strictness: prevent negatives on spend
        if (tx.amount < 0) {
            for (const s of splits) {
                const e = envMap.get(String(s.envelope_id));
                const current = Number.isFinite(e?.amount) ? Number(e.amount) : 0;
                if (current - s.amount_cents < 0) {
                    return res.status(400).json({
                        error: 'envelope_would_go_negative',
                        envelope_id: e?._id,
                        envelope_name: e?.name || 'Envelope',
                        current_balance_cents: current,
                        debit_cents: s.amount_cents
                    });
                }
            }
        }

        // ---- Atomic apply
        await session.withTransaction(async () => {
            // 1) Envelope movements (income -> +, spend -> -)
            if (splits.length) {
                const bulkOps = splits.map(s => ({
                    updateOne: {
                        filter: { _id: s.envelope_id, user_id },
                        update: {
                            $inc: { amount: tx.amount > 0 ? +s.amount_cents : -s.amount_cents }
                        }
                    }
                }));
                await Envelope.bulkWrite(bulkOps, { session });
            }

            // 2) Increment transaction.allocated by this partial amount
            const updatedTx = await Transaction.findOneAndUpdate(
                { _id: tx._id, user_id },
                { $inc: { allocated: totalSplitCents }, $set: { updatedAt: new Date() } },
                { new: true, session }
            );

            // 3) Maintain Account.allocation_current (cents)
            await Account.updateOne(
                { _id: updatedTx.account_id, user_id },
                {
                    $inc: {
                        allocation_current: updatedTx.amount < 0 ? -totalSplitCents : +totalSplitCents
                    }
                },
                { session }
            ).exec();

            // 4) If an UNTRACKING txn (from_account_tracking && amount < 0) is now fully allocated,
            //    purge ALL transactions for this account and zero allocation_current.
            const nowAbsTotal = Math.abs(Number(updatedTx.amount || 0));
            const nowAllocated = Math.max(0, Number(updatedTx.allocated || 0));
            const nowRemaining = Math.max(0, nowAbsTotal - nowAllocated);

            if (updatedTx.from_account_tracking === true && updatedTx.amount < 0 && nowRemaining === 0) {
                await Transaction.deleteMany(
                    { user_id, account_id: updatedTx.account_id },
                    { session }
                );
                await Account.updateOne(
                    { _id: updatedTx.account_id, user_id },
                    { $set: { allocation_current: 0 } },
                    { session }
                ).exec();
            }

            // Respond (tx may be null if purged)
            const txOut = await Transaction.findOne({ _id: transactionId, user_id }, null, { session });
            const freshEnvs = await Envelope.find({ _id: { $in: envelopeIds }, user_id }, null, { session });

            res.status(200).json({
                ok: true,
                transaction: txOut ? (txOut.toSafeJSON ? txOut.toSafeJSON() : txOut) : null,
                envelopes: freshEnvs.map(e => (e.toSafeJSON ? e.toSafeJSON() : e)),
            });
        });
    } catch (err) {
        console.error('ALLOCATE_TXN_ERROR:', err);
        if (!res.headersSent) res.status(500).json({ error: 'internal_error' });
    } finally {
        session.endSession();
    }
});


module.exports = router;