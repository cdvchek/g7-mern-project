const router = require('express').Router();
const requireAuth = require('../../middleware/requireAuth');
const { Transaction } = require('../../models');
const mongoose = require('mongoose');

router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const user_id = req.userId;
        const transactionId = req.params.id;

        // Validate transaction ID
        if (!mongoose.Types.ObjectId.isValid(transactionId)) {
            return res.status(400).json({ error: 'Invalid transaction ID.' });
        }

        // Find and delete transaction
        const transaction = await Transaction.findOneAndDelete({
            _id: transactionId,
            user_id: user_id
        });

        // Check if transaction exists
        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found.' });
        }

        return res.json({
            message: 'Transaction deleted successfully.',
            transaction: transaction.toSafeJSON()
        });
    } catch (err) {
        console.error('[delete-transaction]', err);
        return res.status(500).json({ error: 'Server error while deleting transaction.' });
    }
});

module.exports = router;