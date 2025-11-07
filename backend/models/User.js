// models/User.js
const { Schema, model } = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new Schema(
    {
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            unique: true,
            index: true,
        },
        emailVerified: {
            type: Boolean,
            required: true,
            default: false,
        },
        emailVerifyTokenHash: {
            type: String,
            select: false,
            index: true
        },
        emailVerifyTokenExp: {
            type: Date,
            select: false
        },
        passwordHash: {
            type: String,
            required: true,
            select: false,
        },
        passwordResetTokenHash: {
            type: String,
            select: false,
            index: true
        },
        passwordResetTokenExp: {
            type: Date,
            select: false
        },
        name: {
            type: String,
            trim: true,
            default: '',
        },
        timezone: {
            type: String,
            default: 'America/New_York', // example: 'America/New_York', 'Europe/London'
        },
        currency: {
            type: String,
            default: 'USD', // Could be 'EUR', 'GBP', 'JPY', etc.
        },
    },
    { timestamps: true } // Automatically adds createdAt and updatedAt
);

userSchema.pre('save', async function (next) {
    if (!this.isModified('passwordHash')) return next();

    try {
        const salt = await bcrypt.genSalt(12);
        this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
        next();
    } catch (err) {
        next(err);
    }
});

// Method to control what gets sent back to the frontend
userSchema.methods.toSafeJSON = function () {
    return {
        id: this._id,
        email: this.email,
        name: this.name || '',
        createdAt: this.createdAt,
    };
};

module.exports = model('User', userSchema);
