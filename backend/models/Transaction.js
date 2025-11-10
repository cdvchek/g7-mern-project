// models/Transaction.js
const { Schema, model } = require('mongoose');

const transactionSchema = new Schema(
    {
        user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        account_id: { type: Schema.Types.ObjectId, ref: 'Account', required: true, index: true },

        from_account_tracking: {
            type: Boolean,
            required: true,
        },

        amount_cents: { type: Schema.Types.Int32, required: true },

        allocated: {
            type: Boolean,
            default: false,
        },

        posted_at: { type: Date, required: true, index: true },

        plaid_transaction_id: { type: String, index: { unique: true, sparse: true } },
        name: { type: String, default: '' },
        merchant_name: { type: String, default: '' },
        category: { type: [String], default: [] },
    },
    { timestamps: true }
);

// ---------- Indexes you’ll actually use ----------

transactionSchema.index({ user_id: 1, account_id: 1, posted_at: 1 });

// ---------- Useful helpers ----------

// Quick safe JSON (omit noise if you want)
transactionSchema.methods.toSafeJSON = function () {
    return {
        id: this._id,
        user_id: this.user_id,
        account_id: this.account_id,
        from_account_tracking: this.from_account_tracking,
        amount_cents: this.amount_cents,
        allocated: this.allocated,
        posted_at: this.posted_at,
        name: this.name,
        merchant_name: this.merchant_name,
        category: this.category,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
    };
};

module.exports = model('Transaction', transactionSchema);
