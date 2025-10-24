// models/Transaction.js

const { Schema, model } = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./User');

const transactionSchema = new Schema(
  {
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },

    name: {
        type: String,
    },
    
    amount: {
        type: Schema.Types.Int32,
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

/* accountSchema.methods.toSafeJSON = function () {
    return {
      id: this._id,
      name: this.name || '',
      createdAt: this.createdAt,
    };
  }; */
  
  module.exports = model('Transaction', transactionSchema);