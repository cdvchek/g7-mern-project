// Routes the envelope get requests
const router = require('express').Router();
const requireAuth = require('../../middleware/requireAuth');
const { Envelope } = require('../../models');
const mongoose = require('mongoose');

// Delete an envelope by ID
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;

        // Validate the id is a valid mongoose ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: "invalid_envelope_id" });
        }

        // Fetch the envelope
        const envelope = await Envelope.findOne({
            _id: id,
            user_id: req.userId,
        });

        if (!envelope) {
            return res.status(404).json({ error: "envelope_not_found" });
        }

        // Ensure the envelope is empty before deletion
        const balance = Number.isFinite(envelope.amount) ? envelope.amount : 0;
        if (balance !== 0) {
            return res.status(400).json({
                error: "envelope_not_empty",
                message: "You must move or allocate all funds before deleting this envelope.",
                current_balance_cents: balance,
            });
        }

        // Safe to delete
        await envelope.deleteOne();
        return res.json(envelope.toSafeJSON ? envelope.toSafeJSON() : envelope);

    } catch (error) {
        console.error("Error deleting envelope:", error);
        return res.status(500).json({ error: "internal_error_could_not_delete" });
    }
});

// End of file don't write after
module.exports = router;
