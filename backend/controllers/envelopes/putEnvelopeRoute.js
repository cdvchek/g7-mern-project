const router = require('express').Router();
const requireAuth = require('../../middleware/requireAuth');
const { Envelope } = require('../../models');

// PUT /envelopes/:id
router.put('/:id', requireAuth, async (req, res) => { // Added requireAuth for the specific route
    try {
        // Extract the envelope ID from the URL parameters
        const { id } = req.params;
        const { name, color, amount, order } = req.body;

        // Validate the id is a valid ObjectId
        if (!require('mongoose').Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid envelope ID' });
        }

        // Build an object that updates only the provided fields
        const updates = {};
        // Validates name is a non-empty string and a string
        if (name !== undefined) {
            if (typeof name !== 'string' || name.trim() === '') {
                return res.status(400).json({ error: 'Name is not a string and name is empty' });
            }
            // Update name after validation
            updates.name = name.trim();
        }

        // Validates color is a non-empty string and a string
        if (color !== undefined) {
            if (typeof color !== 'string' || color.trim() === '') {
                return res.status(400).json({ error: 'Color must be a non-empty string' });
            }
            // Update color after validation
            updates.color = color.trim();
        }

        // Validates amount is an integer and >= 0 
        if (amount !== undefined) {
            if (!Number.isInteger(amount) || amount < 0) {
                return res.status(400).json({ error: 'Amount is not receiving an integer and is less than 0' });
            }
            // Update amount after validation
            updates.amount = amount;
        }

        // Validates order is an integer and >= 0
        if (order !== undefined) {
            if (!Number.isInteger(order) || order < 0) {
                return res.status(400).json({ error: 'Order is not receiving an integer and is less than 0' });
            }
            // Update order after validation
            updates.order = order;
        }

        // Update the envelope
        const envelope = await Envelope.findOneAndUpdate(
            { _id: id, user_id: req.session.userId },
            { $set: updates },
            { new: true }
        );

        // If there is no envelope found we return 404
        if (!envelope) {
            return res.status(404).json({ error: 'Envelope not found' });
        }

        // Return the updated envelope
        return res.json(envelope.toSafeJSON());
    // If there is an error it will be caught and returned with error 500
    } catch (error) {
        console.error('Error envelope could not be updated:', error);
        return res.status(500).json({ error: 'Internal error' });
    }
});

// End of file dont write after
module.exports = router;