const router = require('express').Router();
const requireAuth = require('../../middleware/requireAuth');
const { Transaction } = require('../../models');
const mongoose = require('mongoose');


router.use(requireAuth);

const VALID_KINDS = ['ACCOUNT_TRACK', 'ACCOUNT_UNTRACK', 'REAL'];

router.post('/', async (req, res) => {
    try {
        const user_id = req.userId;
        const {
            account_id,
            kind,
            amount_cents,
            allocated = false,
            posted_at,
            name = '',
            merchant_name = '',
            category = []
        } = req.body || {};

        // Validate required fields
        if (!account_id || !kind || typeof amount_cents === 'undefined' || !posted_at) {
            return res.status(400).json({ error: 'account_id, kind, amount_cents and posted_at are required.' });
        }

        if (!mongoose.Types.ObjectId.isValid(account_id)) {
            return res.status(400).json({ error: 'Invalid account_id.' });
        }

        if (!VALID_KINDS.includes(kind)) {
            return res.status(400).json({ error: `Invalid kind. Must be one of: ${VALID_KINDS.join(', ')}` });
        }

        const postedDate = new Date(posted_at);
        if (isNaN(postedDate.getTime())) return res.status(400).json({ error: 'Invalid posted_at date.' });

        const tx = await Transaction.create({
            user_id,
            account_id,
            kind,
            amount_cents: Number(amount_cents),
            allocated: Boolean(allocated),
            posted_at: postedDate,
            name: String(name || ''),
            merchant_name: String(merchant_name || ''),
            category: Array.isArray(category) ? category : [category]
        });

        return res.status(201).json({ transaction: tx.toSafeJSON() });
    } catch (err) {
        console.error('[create-transaction]', err);
        return res.status(500).json({ error: 'Server error while creating transaction.' });
    }
});

module.exports = router;