// models/BankConnection.js
const { Schema, model, models } = require('mongoose');

const EncryptedStringSchema = new Schema(
    {
        ct: { type: String, required: true },
        iv: { type: String, required: true },
        tag: { type: String, required: true },
        v: { type: Number, default: 1 },
    },
    { _id: false }
);

const bankConnectionSchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', index: true, required: true },

        // Plaid identifiers
        item_id: { type: String, required: true, unique: true },

        // Encrypted Plaid access token (NEVER return to client)
        accessToken: { type: EncryptedStringSchema, required: true },

        // Institution info
        institution_name: {
            type: String,
            default: ''
        },

        institution_id: {
            type: String,
            default: ''
        },
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

module.exports = model('BankConnection', bankConnectionSchema);
