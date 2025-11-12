// routes/accounts.js
const express = require('express');
const router = express.Router();

const requireAuth = require('../../middleware/requireAuth');
const { Account, Transaction } = require('../../models');
const { syncTransactionsForItem, refreshAccountsForItem } = require('../../util/plaidSync');

// PATCH /api/accounts/:accountId
// Update app-level fields (tracking/hidden/name)
router.put('/:accountId', requireAuth, async (req, res) => {
    const { accountId } = req.params;
    const { item_id, tracking } = req.body || {};

    await refreshAccountsForItem(item_id);

    const acc = await Account.findOne({ _id: accountId, user_id: req.userId });
    if (!acc) return res.status(404).json({ error: 'account_not_found' });

    const wasTracking = !!acc.tracking;

    if (typeof tracking === 'boolean') {
        if (tracking && !wasTracking) acc.tracked_on = new Date();
        acc.tracking = tracking;
    }

    await acc.save();

    const balancingTxId = `balance_tx_${accountId}`;

    // Find the old balancing transaction (if it exists)
    const oldTx = await Transaction.findOne({ 
        account_id: accountId, 
        plaid_transaction_id: balancingTxId 
    });

    // Delete ALL old balancing transactions for this account
    await Transaction.deleteMany({ 
        account_id: accountId, 
        plaid_transaction_id: balancingTxId 
    });

    // Decide what new transaction to create
    if (tracking) {
        // --- Tracking on ---
        // Create a new transaction (Tx) for the full current balance
        const balance = parseFloat(acc.balance_current) || 0;
        if (balance !== 0) {
            await Transaction.create({
                user_id: req.userId,
                account_id: acc._id,
                from_account_tracking: true,
                amount_cents: Math.floor(balance * 100), // e.g., +100000
                posted_at: new Date(),
                allocated: 0,
                plaid_transaction_id: balancingTxId, 
                name: `Account: ${acc.name} (Balance Added)`,
                merchant_name: "BüDGIE App",
                category: ["Transfer"]
            });
        }
    } else {
        // --- Tracking off ---
        // Only create a "de-allocation" transaction if an old transaction
        // existed and had money allocated from it
        // const allocatedAmount = oldTx ? oldTx.allocated : 0;

        // if (allocatedAmount > 0) {
        //     await Transaction.create({
        //         user_id: req.userId,
        //         account_id: acc._id,
        //         from_account_tracking: true,
        //         // Create a negative Tx for ONLY the allocated amount
        //         amount_cents: -allocatedAmount, // e.g., -60000
        //         posted_at: new Date(),
        //         allocated: 0, // Starts unallocated
        //         plaid_transaction_id: balancingTxId, 
        //         name: `Account: ${acc.name} (Balance Removed)`,
        //         merchant_name: "BüDGIE App",
        //         category: ["Transfer"]
        //     });
        // }
        // If allocatedAmount is 0, no new transaction is created
        // the unallocated money just "disappears"

        if (oldTx) {
            // oldTx.amount_cents was the original balance (e.g., +100000)
            // oldTx.allocated was the amount sent to envelopes (e.g., 60000)
            const unallocatedAmount = oldTx.amount_cents - oldTx.allocated; // e.g., 40000

            // We create a new transaction that *perfectly* cancels the old one
            // The total amount is the *negative* of the original balance
            await Transaction.create({
                user_id: req.userId,
                account_id: acc._id,
                from_account_tracking: true,
                amount_cents: -oldTx.amount_cents, // e.g., -100000
                posted_at: new Date(),
                
                // We "pre-allocate" it with the negative unallocated amount
                allocated: -unallocatedAmount, // e.g., -40000
                
                plaid_transaction_id: balancingTxId, 
                name: `Account: ${acc.name} (Balance Removed)`,
                merchant_name: "BüDGIE App",
                category: ["Transfer"]
            });
        }
    }

    if (tracking && !wasTracking) {
        try {
            syncTransactionsForItem(acc.plaid_item_id, { includePending: false })
                .catch(err => console.error('txn sync error:', err));
        } catch (e) {
            console.error('enqueue txn sync error:', e);
        }
    }

    return res.json({ ok: true, account: acc.toSafeJSON() });
});

module.exports = router;
