const router = require('express').Router();
const requireAuth = require('../../middleware/requireAuth');
const { Transaction } = require('../../models');

// POST /api/transactions/reset-balancing-txs
router.post('/reset-balancing-txs', requireAuth, async (req, res) => {
    try {
        const user_id = req.userId;

        // Find and delete ALL transactions that came from account tracking
        const result = await Transaction.deleteMany({
            user_id: user_id,
            from_account_tracking: true
        });

        return res.json({ 
            ok: true, 
            message: `Reset successful. ${result.deletedCount} old balancing transactions removed.`
        });

    } catch (err) {
        console.error('[reset-txs]', err);
        return res.status(500).json({ error: 'Server error while resetting transactions.' });
    }
});

module.exports = router;