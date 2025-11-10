const router = require('express').Router();
const requireAuth = require('../../middleware/requireAuth');
const { Transaction } = require('../../models');
const mongoose = require('mongoose');

router.use(requireAuth);

router.get('/', async (req, res) => {
    try {
        // Get query parameters
        const { account_id, kind, allocated, posted_before, posted_after, merchant_name, category } = req.query;

        // Build filter object
        const filter = { user_id: req.userId };

        if (account_id) {
            if (!mongoose.Types.ObjectId.isValid(account_id)) return res.status(400).json({ error: 'Invalid account_id' });
            filter.account_id = account_id;
        }

        if (kind) filter.kind = kind;

        if (typeof allocated !== 'undefined') {
            filter.allocated = allocated === 'true' || allocated === '1' || allocated === true;
        }

        if (merchant_name) {
            filter.merchant_name = { $regex: merchant_name, $options: 'i' };
        }

        if (category) {
            // match transactions where category array contains the provided category
            filter.category = category;
        }

        if (posted_before || posted_after) {
            filter.posted_at = {};
            if (posted_before) {
                const d = new Date(posted_before);
                if (isNaN(d.getTime())) return res.status(400).json({ error: 'Invalid posted_before date' });
                filter.posted_at.$lte = d;
            }
            if (posted_after) {
                const d = new Date(posted_after);
                if (isNaN(d.getTime())) return res.status(400).json({ error: 'Invalid posted_after date' });
                filter.posted_at.$gte = d;
            }
        }

        // Fetch transactions
        const transactions = await Transaction.find(filter).populate('account_id', 'name');

        return res.status(200).json({ transactions: transactions.map(t => t.toSafeJSON()) });
    } catch (error) {
        console.error('Error fetching transactions:', error);
        return res.status(500).json({ error: 'Failed to fetch transactions', details: process.env.NODE_ENV === 'development' ? error.message : undefined });
    }
});

// Get single transaction by ID
router.get('/:id', async (req, res) => {
    try {
        const transaction = await Transaction.findOne({
            _id: req.params.id,
            user_id: req.userId
        }).populate('account_id', 'name');

        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        return res.status(200).json({
            transaction: transaction.toSafeJSON()
        });
    } catch (error) {
        console.error('Error fetching transaction:', error);
        return res.status(500).json({ 
            error: 'Failed to fetch transaction',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;