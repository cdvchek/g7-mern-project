// routes/plaid.js
const express = require('express');
const router = express.Router();

const { plaid } = require('../../connection/plaid');
const { encrypt } = require('../../util/crypto');
const { BankConnection } = require('../../models');
const { refreshAccountsForItem } = require('../../util/plaidSync');
const requireAuth = require('../../middleware/requireAuth');

// 1) Create Link token for frontend
router.post('/create-link-token', requireAuth, async (req, res) => {
    try {
        const r = await plaid.linkTokenCreate({
            user: { client_user_id: String(req.userId) },
            client_name: 'BucketBudget (Sandbox)',
            products: (process.env.PLAID_PRODUCTS || 'transactions').split(','),
            country_codes: (process.env.PLAID_COUNTRY_CODES || 'US').split(','),
            language: 'en',
        });
        return res.json({ link_token: r.data.link_token });
    } catch (e) {
        console.error('[plaid] link-token error:', e?.response?.data || e);
        return res.status(500).json({ error: 'link_token_failed' });
    }
});

// 2) Exchange public_token -> access_token, store connection, then upsert accounts
router.post('/exchange-public-token', requireAuth, async (req, res) => {
    try {
        const { public_token, institution } = req.body || {};
        if (!public_token) {
            return res.status(400).json({ error: 'missing_public_token' });
        }

        // Exchange for long-lived access token + item id
        const r = await plaid.itemPublicTokenExchange({ public_token });
        const { access_token, item_id } = r.data;

        // Normalize institution payload for your model shape
        const inst =
            typeof institution === 'string'
                ? { name: institution, institution_id: '' }
                : {
                    name: institution?.name || '',
                    institution_id: institution?.institution_id || '',
                };

        // Encrypt and upsert the connection
        const enc = encrypt(access_token);
        await BankConnection.findOneAndUpdate(
            { item_id },
            {
                userId: req.userId,
                item_id,
                accessToken: enc,
                institution: inst,
                removed: false,
                'status.lastAttemptAt': new Date(),
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        // Immediately pull & upsert accounts so the UI can show them
        const upserts = await refreshAccountsForItem(item_id);

        return res.json({
            ok: true,
            item_id,
            accounts: upserts.map((a) => ({
                id: a._id,
                plaid_account_id: a.plaid_account_id,
                name: a.name,
                type: a.type,
                subtype: a.subtype,
            })),
        });
    } catch (e) {
        console.error('[plaid] exchange error:', e?.response?.data || e);
        return res.status(500).json({ error: 'exchange_failed' });
    }
});

module.exports = router;
