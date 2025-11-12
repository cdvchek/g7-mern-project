const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const requireAuth = require('../../middleware/requireAuth');
const { Account, Transaction } = require('../../models');
const { refreshAccountsForItem } = require('../../util/plaidSync');

router.put('/:accountId', requireAuth, async (req, res) => {
    const { accountId } = req.params;
    const { item_id, tracking } = req.body || {};

    if (item_id) {
        try { await refreshAccountsForItem(item_id); } catch (e) {
            console.warn('refreshAccountsForItem failed:', e?.message || e);
        }
    }

    const session = await mongoose.startSession();
    let payload = null;

    try {
        await session.withTransaction(async () => {
            const acc = await Account.findOne({ _id: accountId, user_id: req.userId })
                .session(session)
                .exec();

            if (!acc) {
                const err = new Error('account_not_found');
                err.status = 404;
                throw err;
            }

            const wasTracking = !!acc.tracking;
            const hasTrackingParam = typeof tracking === 'boolean';

            if (hasTrackingParam) {
                if (tracking && !wasTracking) acc.tracked_on = new Date();
                acc.tracking = tracking;
            }

            await acc.save({ session });

            if (hasTrackingParam && tracking !== wasTracking) {
                const balance = Math.trunc(Number.isFinite(acc.balance_current) ? acc.balance_current : 0);
                const allocation = Math.trunc(Number.isFinite(acc.allocation_current) ? acc.allocation_current : 0);

                const amount = tracking ? balance : -allocation;

                await Transaction.create(
                    [
                        {
                            user_id: req.userId,
                            account_id: acc._id,
                            from_account_tracking: true,
                            amount,
                            posted_at: new Date(),
                            plaid_transaction_id: null,
                            name: 'Account tracking',
                            merchant_name: null,
                            category: [],
                        },
                    ],
                    { session }
                );
            }

            payload = {
                ok: true, account: acc.toSafeJSON ? acc.toSafeJSON() : {
                    id: acc._id,
                    name: acc.name,
                    tracking: acc.tracking,
                    balance_current: acc.balance_current,
                    allocation_current: acc.allocation_current,
                }
            };
        }, {});

        return res.json(payload || { ok: true });
    } catch (error) {
        const status = error?.status || 500;
        const code = error?.message || 'txn_failed';
        console.error('ACCOUNT TRACKING:', error);
        return res.status(status).json({ error: code });
    } finally {
        session.endSession();
    }
});

module.exports = router;
