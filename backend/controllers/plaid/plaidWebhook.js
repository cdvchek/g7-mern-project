const express = require('express');
const router = express.Router();
const { syncTransactionsForItem } = require('../../util/plaidSync');

router.post('/', express.json(), async (req, res) => {
    const body = req.body;
    const { webhook_type, webhook_code, item_id } = body;

    try {
        if (webhook_type === 'TRANSACTIONS') {
            switch (webhook_code) {
                case 'INITIAL_UPDATE':
                case 'DEFAULT_UPDATE':
                    await syncTransactionsForItem(item_id, { includePending: false });
                    break;
                case 'TRANSACTIONS_REMOVED':
                    await syncTransactionsForItem(item_id);
                    break;
                default:
                    console.log('Unhandled transactions webhook:', webhook_code);
            }
        } else if (webhook_type === 'ITEM' && webhook_code === 'ERROR') {
            console.warn('Plaid item error:', body);
        }

        res.sendStatus(200);
    } catch (e) {
        console.error('Webhook error:', e);
        res.sendStatus(500);
    }
});

module.exports = router;
