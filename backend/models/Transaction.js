// models/Transaction.js
const { Schema, model } = require('mongoose');

const transactionSchema = new Schema(
    {
        user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        account_id: { type: Schema.Types.ObjectId, ref: 'Account', required: true, index: true },

        // true if auto-created by account tracking toggle
        from_account_tracking: { type: Boolean, required: true },

        // Cents (integer). Use Number for safety against Int32 overflow on large values.
        amount: { type: Number, required: true }, // total absolute change in cents (can be negative)

        // NEW: how many cents have been allocated so far (>= 0)
        allocated: { type: Number, default: 0 }, // cents

        posted_at: { type: Date, required: true, index: true },

        plaid_transaction_id: { type: String, unique: false, default: undefined },

        name: { type: String, default: '' },
        merchant_name: { type: String, default: '' },
        category: { type: [String], default: [] },
    },
    { timestamps: true }
);

// Oldest-unallocated/sorts
transactionSchema.index({ user_id: 1, account_id: 1, posted_at: 1 });

transactionSchema.methods.toSafeJSON = function () {
    const total = Number(this.amount || 0);
    const done = Math.max(0, Number(this.allocated || 0));
    const absTotal = Math.abs(total);
    const absDone = Math.min(absTotal, Math.abs(done));
    const remaining = Math.max(0, absTotal - absDone);

    return {
        id: this._id,
        user_id: this.user_id,
        account_id: this.account_id,
        from_account_tracking: !!this.from_account_tracking,

        amount_cents: total,          // signed cents
        allocated_cents: absDone,     // always >= 0
        remaining_cents: remaining,   // always >= 0

        is_fully_allocated: remaining === 0,

        posted_at: this.posted_at,
        name: this.name,
        merchant_name: this.merchant_name,
        category: this.category,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
    };
};

module.exports = model('Transaction', transactionSchema);
