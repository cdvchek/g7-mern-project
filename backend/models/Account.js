const { Schema, model, models } = require('mongoose');

const accountSchema = new Schema(
    {
        user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

        // Tie back to Plaid
        plaid_item_id: { type: String, required: true, index: true },
        plaid_account_id: { type: String, required: true, unique: true },

        // Display / identity
        name: { type: String, trim: true, default: '', required: true },
        official_name: { type: String, trim: true, default: '' },
        mask: { type: String, trim: true, default: '' },

        // Classification
        type: { type: String, trim: true, default: '' },
        subtype: { type: String, trim: true, default: '' },

        // Balances
        balance_current: {
            type: Number,
            default: null,
        },

        tracking: { type: Boolean, default: false },
        tracked_on: { type: Date, default: null },
    },
    { timestamps: true }
);

// Common queries
accountSchema.index({ user_id: 1, plaid_item_id: 1 });
accountSchema.index({ user_id: 1, tracking: 1 });

accountSchema.methods.toSafeJSON = function () {
    return {
        id: this._id,
        user_id: this.user_id,
        plaid_item_id: this.plaid_item_id,
        plaid_account_id: this.plaid_account_id,
        name: this.name,
        official_name: this.official_name,
        mask: this.mask,
        type: this.type,
        subtype: this.subtype,
        balance_current: this.balance_current,
        tracking: this.tracking,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
    };
};

module.exports = model('Account', accountSchema);
