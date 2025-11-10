// models/Transaction.js
const { Schema, model } = require('mongoose');

const transactionSchema = new Schema(
    {
        user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        account_id: { type: Schema.Types.ObjectId, ref: 'Account', required: true, index: true },

        kind: {
            type: String,
            enum: ['ACCOUNT_TRACK', 'ACCOUNT_UNTRACK', 'REAL'],
            required: true,
            index: true,
        },

        amount_cents: { type: Number, required: true },

        allocated: {
            type: Schema.Types.Boolean,
            default: false,
            index: true,
        },

        posted_at: { type: Date, required: true, index: true },

        // --- Plaid-mapped fields (REAL only; keep them sparse so indexes are compact) ---
        plaid_transaction_id: { type: String, index: { unique: true, sparse: true } },
        plaid_pending: { type: Boolean, default: false },
        plaid_account_id: { type: String, index: true, sparse: true },
        name: { type: String, default: '' },            // Plaid "name"
        merchant_name: { type: String, default: '' },   // Plaid "merchant_name"
        category: { type: [String], default: [] },      // Plaid categories
        original_description: { type: String, default: '' },

        // Optional UX helpers
        currency: { type: String, default: 'USD' },
        memo: { type: String, default: '' },

        // Soft flags (e.g., hidden after untracking purge logic) — likely unnecessary if you truly hard-delete
        hidden: { type: Boolean, default: false }, // keep if you want archival; otherwise omit
    },
    { timestamps: true }
);

// ---------- Indexes you’ll actually use ----------
transactionSchema.index({ user_id: 1, sequence: 1 }, { unique: true }); // enforce sequence uniqueness per user
transactionSchema.index({ user_id: 1, alloc_status: 1, sequence: 1 });
transactionSchema.index({ user_id: 1, account_id: 1, posted_at: 1 });

// ---------- Useful helpers ----------

// Quick safe JSON (omit noise if you want)
transactionSchema.methods.toSafeJSON = function () {
    const t = this;
    return {
        id: t._id,
        user_id: t.user_id,
        account_id: t.account_id,
        kind: t.kind,
        amount_cents: t.amount_cents,
        alloc_status: t.alloc_status,
        allocations: t.allocations,
        sequence: t.sequence,
        posted_at: t.posted_at,
        name: t.name,
        merchant_name: t.merchant_name,
        category: t.category,
        memo: t.memo,
        currency: t.currency,
        plaid_transaction_id: t.plaid_transaction_id,
        plaid_pending: t.plaid_pending,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
    };
};

module.exports = model('Transaction', transactionSchema);
