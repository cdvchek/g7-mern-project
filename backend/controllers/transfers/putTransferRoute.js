const router = require('express').Router();
const requireAuth = require('../../middleware/requireAuth');
const { Transfer } = require('../../models');
const mongoose = require('mongoose');

router.use(requireAuth);

router.put('/:id', async(req,res) => {
    try{
        const user_id = req.session.userId;
        const transferId = req.params.id;
        const {notes} = req.body || {};

        // Validating transfer ID
        if(!mongoose.Types.ObjectId.isValid(transferId)){
            return res.status(400).json({error: 'Invalid transfer ID.'});
        }

        // Only allow notes to be updated (prevent changing amounts/envelopes)
        const updates = {};
        if(notes !== undefined){
            updates.notes = String(notes).trim();
        }

        // If no valid fields to update
        if(Object.keys(updates).length === 0){
            return res.status(400).json({error: 'No valid fields to update.'});
        }

        // Find and update transfer
        const transfer = await Transfer.findOneAndUpdate(
            {
                _id: transferId,
                user_id: user_id // Ensures transfer belongs to user
            },
            {
                $set: updates
            },
            {
                new: true, // Return updated document
                runValidators: true
            }
        ).populate('from_envelope_id', 'name amount')
        .populate('to_envelope_id', 'name amount');

        // check if transfer exist
        if(!transfer){
            return res.status(404).json({error: 'Transfer not Found.'});

        }

        return res.json({
            transfer: transfer.toSafeJSON(),
            message: 'Transfer updated successfully.'
        });

    }
    catch(err){
        console.error('[update-transfer]',err);
        return res.status(500).json({error: 'Server error while updating transfer.'});
    }
});

module.exports = router;