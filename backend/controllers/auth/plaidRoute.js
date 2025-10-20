const express = require('express');
const router = express.Router();
const { plaid } = require("../../connection/plaid");
const { encrypt } = require('../../util/crypto');
const BankConnection = require('../../models/BankConnection');
const requireAuth = require("../../middleware/requireAuth");

// 1) Link token for frontend
router.post('/create-link-token', requireAuth, async (req, res) => {
    try {
        const r = await plaid.linkTokenCreate({
            user: { client_user_id: String(req.session.userId) },
            client_name: 'BucketBudget (Sandbox)',
            products: (process.env.PLAID_PRODUCTS || 'transactions').split(','),
            country_codes: (process.env.PLAID_COUNTRY_CODES || 'US').split(','),
            language: 'en',
        });
        res.json({ link_token: r.data.link_token });
    } catch (e) {
        console.error('link-token error:', e?.response?.data || e);
        res.status(500).json({ error: 'link_token_failed' });
    }
});

// 2) Exchange public_token -> access_token and store
router.post('/exchange-public-token', requireAuth, async (req, res) => {
    try {
        const { public_token, institution } = req.body;
        const r = await plaid.itemPublicTokenExchange({ public_token });
        const { access_token, item_id } = r.data;
        const enc = encrypt(access_token);
        await BankConnection.findOneAndUpdate(
            { item_id },
            { userId: req.session.userId, item_id, accessToken: enc, institution },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        res.json({ ok: true, item_id });
    } catch (e) {
        console.error('exchange error:', e?.response?.data || e);
        res.status(500).json({ error: 'exchange_failed' });
    }
});

module.exports = router;
