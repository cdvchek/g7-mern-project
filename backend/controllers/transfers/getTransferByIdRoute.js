const router = require('express').Router();
const requireAuth = require('../../middleware/requireAuth');
const { Transfer } = require('../../models');
const mongoose = require('mongoose');

router.get('/:id', requireAuth, async (req, res) => {
    try {
        const user_id = req.userId;
        const transferId = req.params.id;

        // Validating transfer ID
        if (!mongoose.Types.ObjectId.isValid(transferId)) {
            return res.status(400).json({ error: 'Invalid transfer ID' });
        }

        // Find transfer with envelope population
        const transfer = await Transfer.findOne({
            _id: transferId,
            user_id: user_id // Ensure transfer belongs to user
        })
            .populate('from_envelope_id', 'name amount')
            .populate('to_envelope_id', 'name amount');

        // Check if transfer exists
        if (!transfer) {
            return res.status(404).json({ error: 'Transfer not Found.' });
        }

        return res.json({
            transfer: transfer.toSafeJSON()
        });
    }
    catch (err) {
        console.error('[get-transfer-by-id]', err);
        return res.status(500).json({ error: 'Server error while fetching transfer.' });
    }
});

module.exports = router;