// models/RefreshToken.js
const { Schema, model } = require('mongoose');

const refreshTokenSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        jti: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        revoked: {
            type: Boolean,
            default: false,
        },
        // optional: track what device/app type issued it
        userAgent: {
            type: String,
            default: '',
        },
    },
    { timestamps: true }
);

module.exports = model('RefreshToken', refreshTokenSchema);
