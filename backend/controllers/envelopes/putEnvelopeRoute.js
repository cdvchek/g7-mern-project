// Routes the envelope get requests
const router = require('express').Router();
const requireAuth = require('../../middleware/requireAuth');
const { Envelope } = require('../../models');

// Put updates to an envelope by ID
router.put('/:id', requireAuth, async (req, res) => { // Added requireAuth for the specific route
    try {

        // Extract the envelope ID from the URL parameters
        const { id } = req.params;
        const { name, color, amount, monthly_target, order, description } = req.body;

        // Validate the id is a valid ObjectId if not return error 400
        if (!require('mongoose').Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid envelope ID' });
        }

        // Build an object that updates only the provided fields
        const updates = {};
        // Validates name is a non-empty string and a string
        if (name !== undefined) {
            if (!name || name.trim() === '') {
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

        if (amount !== undefined) {
            const parsedAmount = Number(amount);
            if (!Number.isInteger(parsedAmount) || parsedAmount < 0) {
                return res.status(400).json({ error: "Amount must be a positive integer" });
            }
            updates.amount = parsedAmount;
        }

        if (description !== undefined) {
            if (typeof description !== 'string') {
                return res.status(400).json({ error: 'Description must be a string' });
            }
            updates.description = description.trim();
        }

        // Parse the integers to assure that we are recieving numbers

        // Validates monthly target is an integer and >= 0 
        if (monthly_target !== undefined) {
            const parsedMonthlyTarget = Number(monthly_target);
            if (!Number.isInteger(parsedMonthlyTarget) || parsedMonthlyTarget < 0) {
                return res.status(400).json({ error: 'Monthly target is not receiving an integer and is less than 0' });
            }
            // Update monthly target after validation
            updates.monthly_target = parsedMonthlyTarget;
        }

        // Amount in envelope cannot be directly updated; has to be done via transfers

        // Validates order is an integer and >= 0
        if (order !== undefined) {
            const parsedOrder = Number(order);
            if (!Number.isInteger(parsedOrder) || parsedOrder < 0) {
                return res.status(400).json({ error: 'Order is not receiving an integer and is less than 0' });
            }
            // Update order after validation
            updates.order = parsedOrder;
        }

        // Update the envelope
        const envelope = await Envelope.findOneAndUpdate(
            { _id: id, user_id: req.userId },
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
        return res.status(500).json({ error: 'Internal error could not be updated' });
    }
});

// End of file dont write after
module.exports = router;
