// models/BankConnection.js
const { Schema, model, models } = require('mongoose');

const EncryptedStringSchema = new Schema(
    {
        ct: { type: String, required: true }, // ciphertext
        iv: { type: String, required: true },
        tag: { type: String, required: true },
        v: { type: Number, default: 1 },      // version for future rotations
    },
    { _id: false }
);

const bankConnectionSchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', index: true, required: true },

        // Plaid identifiers
        item_id: { type: String, required: true, unique: true }, // stable per connection

        // Encrypted Plaid access token (NEVER return to client)
        accessToken: { type: EncryptedStringSchema, required: true },

        // Institution info (from Link metadata or Plaid institutions API)
        institution: {
            name: { type: String, default: '' },
            institution_id: { type: String, default: '' },
            logo: { type: String, default: '' },     // optional (base64 or URL if you fetch it)
            url: { type: String, default: '' },      // optional
            primary_color: { type: String, default: '' }, // optional hex
        },

        // Sync / diagnostics
        status: {
            lastGoodSyncAt: { type: Date },
            lastAttemptAt: { type: Date },
            lastError: {
                code: String,
                type: String,
                message: String,
                at: Date,
            },
            billed_products: [{ type: String }],     // from /item/get or /item/application/list
            available_products: [{ type: String }],
        },

        // If you implement webhooks (highly recommended), persist cursors/state
        webhook: {
            // e.g., transactions cursor, account change cursor, etc.
            tx_cursor: { type: String, default: '' },
            meta: { type: Schema.Types.Mixed, default: {} },
        },

        // Soft delete if user disconnects bank
        removed: { type: Boolean, default: false },
    },
    { timestamps: true }
);

// Useful compound index for multi-tenant queries
bankConnectionSchema.index({ userId: 1, item_id: 1 }, { unique: true });

// Hide sensitive fields by default
bankConnectionSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: (_, ret) => {
        delete ret.accessToken;
        return ret;
    },
});

// Helpful safe view
bankConnectionSchema.methods.toSafeJSON = function () {
    const { _id, userId, item_id, institution, status, removed, createdAt, updatedAt } = this;
    return { id: _id, userId, item_id, institution, status, removed, createdAt, updatedAt };
};

module.exports = models.BankConnection || model('BankConnection', bankConnectionSchema);
