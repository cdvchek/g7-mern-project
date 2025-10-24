// Routes the envelope get requests
const router = require('express').Router();
const requireAuth = require('../../middleware/requireAuth');
const { Envelope } = require('../../models');

router.use(requireAuth);

// Get all envelopes for the logged-in user
router.get('/', async (req, res) => {
    try {
        // Tries to grab the id of the user that's logged in
        const userId = req.session.userId;
        const envelopes = await Envelope.find({ user_id: userId }).sort({ order: 1, createdAt: 1 });
        const safeEnvelopes = envelopes.map(envelope => envelope.toSafeJSON());
        return res.json(safeEnvelopes);

    // If there is an error getting the envelope it will be caught and returned with error 500
    } catch (error) {
        console.error("Error fetching envelopes:", error);
        return res.status(500).json({ error: 'Internal error could not grab envelopes' });
    }
});

// Get a specific envelope by ID
router.get('/:id', async (req, res) => {
    try {
        // Tries to grab the id of the user that's logged in
        const userId = req.session.userId;
        const envelopeId = req.params.id;

        // Validate envelopeId is a valid ObjectId
        const mongoose = require('mongoose');
        // If mongoose type is not valid return error 400
        if (!mongoose.Types.ObjectId.isValid(envelopeId)) {
            return res.status(400).json({ error: 'Invalid envelope ID' });
        }

        // Find the envelope belonging to the user
        const envelope = await Envelope.findOne({ _id: envelopeId, user_id: userId });
        // if there is no envelope found return error 404
        if (!envelope) {
            return res.status(404).json({ error: 'Envelope not found' });
        }

        // Return the safe JSON representation of the envelope
        return res.json(envelope.toSafeJSON());
    // If there is an error getting the envelope it will be caught and returned with error 500
    } catch (error) {
        console.error("Error getting envelope:", error);
        return res.status(500).json({ error: 'Internal error could not grab envelope' });
    }
}); 

/// End of file dont write after
module.exports = router;