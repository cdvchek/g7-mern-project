const router = require('express').Router();
const requireAuth = require('../../middleware/requireAuth');
const { Transfer, Envelope } = require('../../models');
const mongoose = require('mongoose');

router.use(requireAuth);

router.delete('/:id', async(req, res) => {
    try{
        const user_id = req.session.userId;
        const transferId = req.params.id;

        // Validating transfer ID
        if (!mongoose.Types.ObjectId.isValid(transferId)) {
            return res.status(400).json({ error: 'Invalid transfer ID.' });
        }

        // Start a session for transaction safety
        const session = await mongoose.startSession();
        session.startTransaction();

        try{
            // Find the transfer with envelope population
            const transfer = await Transfer.findOne({
                _id: transferId,
                user_id: user_id
            })
            .populate('from_envelope_id', 'name amount')
            .populate('to_envelope_id', 'name amount')
            .session(session);

            // Checking if transfer exist
            if(!transfer){
                await session.abortTransaction();
                return res.status(404).json({error: 'Transfer not Found.'});
            }

            // Reverse the transfer amounts on envelopes
            const fromEnvelope = await Envelope.findOne({
                _id: transfer.from_envelope_id._id,
                user_id: user_id
            }).session(session);

            const toEnvelope = await Envelope.findOne({
                _id: transfer.to_envelope_id._id,
                user_id: user_id
            }).session(session);

            // Updating the envelope amounts (reverse to transfer)
            fromEnvelope.amount = fromEnvelope.amount + transfer.amount;
            toEnvelope.amount = toEnvelope.amount - transfer.amount;

            // Save envelope updates
            await fromEnvelope.save({session});
            await toEnvelope.save({session});

            // Delete the transfer record
            await Transfer.deleteOne({_id: transferId}).session(session);

            // Commit the transaction
            await session.commitTransaction();

            return res.json({
                message: 'Transfer deleted successfully. Funds have been returned to original envelopes.',
                reversed_amount: transfer.amount,
                from_envelope: fromEnvelope.toSafeJSON(),
                to_envelope: toEnvelope.toSafeJSON()
            });
        }
        catch(err){
            await session.abortTransaction();
            throw error;
        }
        finally{
            session.endSession();
        }
    }
    catch(err){
        console.error('[delete-transfer', err);
        return res.status(500).json({error: 'Server error while deleting transfer.'});
    }
});

module.exports = router;