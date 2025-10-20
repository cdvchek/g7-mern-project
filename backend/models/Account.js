// models/Account.js

const { Schema, model } = require('mongoose');
const User = require('./User');
const bcrypt = require('bcryptjs');

const accountSchema = new Schema(
  {
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },

    plaid_item_id: {
        type: Schema.Types.ObjectId,
        required: true,

        },

    plaid_account_id: {
        type: Schema.Types.ObjectId,
        required: true,

        },

    name: {
        type: String,
        trim: true,
        default: '',
        required: true,
    },

    // Plaid type 
    type: {
    type: String,
    enum: ['depository', 'credit'],
    

    },

    // Plaid type 
    subtype: {
        type: String,
        enum: ['checking', 'savings', 'credit card']

    },

    },
    { timestamps: true } // Automatically adds createdAt and updatedAt
);

accountSchema.methods.toSafeJSON = function () {
    return {
        id: this._id,
        name: this.name || '',
        createdAt: this.createdAt,
    };
};

module.exports = model('Account', accountSchema);