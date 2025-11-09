// models/Envelope.js

const { Schema, model } = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./User');

const envelopeSchema = new Schema(
    {
        user_id: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        name: {
            type: String,
            required: true,
        },

        color: {
            type: String,
            required: true,
        },

        amount: {
            type: Schema.Types.Int32,
            required: true,
        },

        description: {
            type: String,
            default: '',
            trim: true,
        },

        monthly_target: {
            type: Schema.Types.Int32,
        },

        order: {
            type: Schema.Types.Int32,
        },

    },

    { timestamps: true } // Automatically adds createdAt and updatedAt
);

envelopeSchema.methods.toSafeJSON = function () {
    return {
        id: this._id,
        name: this.name || '',
        createdAt: this.createdAt,
        amount: this.amount,
        monthly_target: this.monthly_target,
        color: this.color || '',
        description: this.description || '',
        order: this.order,
    };
};

module.exports = model('Envelope', envelopeSchema);
