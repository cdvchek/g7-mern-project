const router = require('express').Router();
const requireAuth = require('../../middleware/requireAuth');
const { Transfer } = require('../../models');
const mongoose = require('mongoose');

router.use(requireAuth);

router.get('/', async(req, res) => {
    try{
        const user_id = req.session.userId;
        const { from, to} = req.query;

        //Build filter object - Requires at least one filter
        const filter = { user_id };

        // Validating that at least one filter is provided
        if(!from && !to){
            return res.status(400).json({error: 'At least one filter (from or to is required.'});
        }

        // Add envelope filters if provided
        if(from){
            if(!mongoose.Types.ObjectId.isValid(from)){
                return res.status(400).json({error: 'Invalid from envelope ID.'});
            }
            filter.from_envelope_id = from;
        }
        if (to) {
            if (!mongoose.Types.ObjectId.isValid(to)) {
                return res.status(400).json({ error: 'Invalid to envelope ID.' });
            }
            filter.to_envelope_id = to;
        }

        // Get filtered transfers
        const transfers = await Transfer.find(filter)
            .populate('from_envelope_id', 'name amount')
            .populate('to_envelope_id', 'name amount')
            .sort({createdAt: -1});

        return res.json({
            transfers: transfers.map(transfer => transfer.toSafeJSON()),
            count: Transfers.length,
            filters: {frome, to} // Return applied filters for clarity
        });
    }
    catch(err){
        console.error('[get-filtered-transfers]',err);
        return res.status(500).json({error: 'Server error while fetching filtered transfers.'});
    }
});

module.exports = router;