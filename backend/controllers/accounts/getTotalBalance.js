const router = require('express').Router();
const requireAuth = require('../../middleware/requireAuth');
const { Account } = require('../../models');

// This route will be mounted at: GET /api/accounts/total
router.get('/total', requireAuth, async (req, res) => {
    try {
        // Use an aggregation pipeline to find and sum the balances
        const result = await Account.aggregate([
            {
                // 1. Find all accounts for this user that are "tracking: true"
                $match: {
                    user_id: req.userId,
                    tracking: true
                }
            },
            {
                // 2. Project a new field 'balance_cents'
                // We must multiply the 'balance_current' (which is dollars) by 100
                $project: {
                    balance_cents: {
                        $multiply: [
                            // 1. $ifNull: Use 0 if balance_current is missing or null
                            // 2. $toDouble: Convert the field (e.g., "100.50") to a number (100.50)
                            { $toDouble: { $ifNull: ["$balance_current", 0] } },
                            100
                        ]
                    }
                }
            },
            {
                // 3. Group them into a single doc and sum their 'balance_cents'
                $group: {
                    _id: null,
                    total: { $sum: "$balance_cents" }
                }
            }
        ]);

        // 4. Round the final result to avoid any floating point artifacts
        const totalBalanceCents = Math.round(result[0]?.total || 0);

        console.log(totalBalanceCents);

        return res.json({ total_balance_cents: totalBalanceCents });

    } catch (e) {
        console.error('Error fetching total balance:', e);
        return res.status(500).json({ error: 'Failed to fetch balance' });
    }
});

module.exports = router;