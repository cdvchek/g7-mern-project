// models/Account.js
const { Schema, model, models } = require('mongoose');

const accountSchema = new Schema(
    {
        user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

        // Tie back to Plaid
        plaid_item_id: { type: String, required: true, index: true },       // Plaid item_id (string)
        plaid_account_id: { type: String, required: true, unique: true },   // Plaid account_id (string, stable)

        // Display / identity
        name: { type: String, trim: true, default: '', required: true },    // e.g., "Checking"
        official_name: { type: String, trim: true, default: '' },           // bank's official label
        mask: { type: String, trim: true, default: '' },                    // last 2–4 digits

        // Classification (keep flexible; Plaid can add values)
        type: { type: String, trim: true, default: '' },     // 'depository' | 'credit' | 'loan' | 'investment' | 'brokerage' | ...
        subtype: { type: String, trim: true, default: '' },  // 'checking' | 'savings' | 'credit card' | ...

        // Balances (cached for snappy UI; refresh via Plaid when needed)
        balances: {
            available: { type: Number, default: null },
            current: { type: Number, default: null },
            limit: { type: Number, default: null },            // for credit cards
            iso_currency_code: { type: String, default: 'USD' },
            unofficial_currency_code: { type: String, default: '' },
            lastUpdatedAt: { type: Date },                     // when you last refreshed balances from Plaid
        },

        // App-level flags & metadata
        tracking: { type: Boolean, default: false },         // user toggle in UI
        hidden: { type: Boolean, default: false },           // optional "hide from UI"
    },
    { timestamps: true }
);

// Common queries
accountSchema.index({ user_id: 1, plaid_item_id: 1 });
accountSchema.index({ user_id: 1, tracking: 1 });

accountSchema.methods.toSafeJSON = function () {
    const {
        _id, user_id, plaid_item_id, plaid_account_id, name, official_name, mask,
        type, subtype, balances, tracking, hidden, createdAt, updatedAt
    } = this;

    return {
        id: _id,
        user_id,
        plaid_item_id,
        plaid_account_id,
        name,
        official_name,
        mask,
        type,
        subtype,
        balances,
        tracking,
        hidden,
        createdAt,
        updatedAt,
    };
};

module.exports = models.Account || model('Account', accountSchema);
