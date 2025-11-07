const router = require('express').Router();
const requireAuth = require('../../middleware/requireAuth');
const { Transfer, Envelope } = require('../../models');
const mongoose = require('mongoose');

router.use(requireAuth);

router.post('/', async(req, res) => {
    try{
        const { from_envelope_id, to_envelope_id, amount, notes } = req.body || {};
        const user_id = req.session.userId;

        // Validating required fields
        if(!from_envelope_id || !to_envelope_id || !amount){
            return res.status(400).json({error: 'From envelope, to envelope, and amount are required.'});
        }

        // Validating amount is positive integer
        if (!Number.isInteger(amount) || amount <= 0){
            return res.status(400).json({error: 'Amount must be a positive integer.'});
        }

        // prevent transferring to same envelope
        if (from_envelope_id === to_envelope_id){
            return res.status(400).json({error: 'Cannont transfer to the same envelope.'});
        }

        // Validating ObjectIds
        if(!mongoose.Types.ObjectId.isValid(from_envelope_id) || !mongoose.Types.ObjectId.isValid(to_envelope_id)){
            return res.status(400).json({error: 'Invalid envelope ID.'});
        } 

        // Start a session for transaction
        const session = await mongoose.startSession();
        session.startTransaction();

        try{
            // get both envelopes with locking to prevent race conditions
            const fromEnvelope = await Envelope.findOne({
                _id: from_envelope_id,
                user_id: user_id
            }).session(session);

            const toEnvelope = await Envelope.findOne({
                _id: to_envelope_id,
                user_id: user_id
            }).session(session);

            // Check if envelopes exists and belong to user
            if (!fromEnvelope){
                await session.abortTransaction();
                return res.status(404).json({error: 'Source envelope not found.'});
            }

            if(!toEnvelope){
                await session.abortTransaction();
                return res.status(404).json({error: 'Destination envelope not found.'});
            }

            // Check if source envelope has sufficent funds
            if(fromEnvelope.amount < amount){
                await session.abortTransaction();
                return res.status(400).json({ error: 'Insufficient funds in source envelope.'});
            }

            // Update envelope amounts
            fromEnvelope.amount = fromEnvelope.amount - amount;
            toEnvelope.amount = toEnvelope.amount + amount;

            await fromEnvelope.save({session});
            await toEnvelope.save({session});

            // Creating the transfer record (using the exact field names from the model)
            const transfer = await Transfer.create([{
                user_id: user_id,
                from_envelope_id: from_envelope_id,
                to_envelope_id: to_envelope_id,
                amount: amount,
                occured_at: new Date(),
                notes: notes || ''
            }],{session});

            // Commit the transaction transfer
            await session.commitTransaction();

            return res.status(201).json({
                transfer: transfer[0].toSafeJSON(),
                from_envelope: fromEnvelope.toSafeJSON(),
                to_envelope: toEnvelope.toSafeJSON(),
                message: 'Transfer completed successfully.'
            })
        }
        catch(error){
            // If anything fails, abort the transaction
            await session.abortTransaction();
            throw error;
        }
        finally{
            session.endSession();
        }
    }
    catch (err){
        console.error('[create-transfer]',err);
        return res.status(500).json({error: 'Server error during transfer.'});
    }

});

module.exports = router;