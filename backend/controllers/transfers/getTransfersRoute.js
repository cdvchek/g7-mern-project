const router = require('express').Router();
const requireAuth = require('../../middleware/requireAuth');
const { Transfer } = require('../../models');
const mongoose = require('mongoose');

router.get('/', requireAuth, async (req, res) => {
    try {
        const user_id = req.userId;

        // Getting ALL transfers (no filtering)
        const transfers = await Transfer.find({ user_id })
            .populate('from_envelope_id', 'name amount')
            .populate('to_envelope_id', 'name amount')
            .sort({ createdAt: -1 }); // Most recent first

        return res.json({
            transfers: transfers.map(transfer => transfer.toSafeJSON()),
            count: transfers.length
        });
    }
    catch (err) {
        console.error('[get-transfers]', err);
        return res.status(500).json({ error: 'Server error while fetching transfers.' });
    }
});

module.exports = router;