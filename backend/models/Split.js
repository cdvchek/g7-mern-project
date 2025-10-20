/*
user_id: ObjectId,
transaction_id: ObjectId, // FK => transaction
envelope_id: ObjectId, // FK => envelope
amount: int // cents
note: string
*/

// models/Split.js

const { Schema, model } = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./User');
const Transaction = require ('./Transaction')
const Envelope = require ('./Envelope')


const splitSchema = new Schema(
  {
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },

    transaction_id: {
        type: Schema.Types.ObjectId,
        ref: 'Transaction',
        require: true,
    },

    envelope_id: {
        type: Schema.Types.ObjectId,
        ref: 'Envelope',
        require: true,
    },

    amount: {
        type: Schema.Types.Int32,
    },

    note: {
        type: String,
    },

  },

  { timestamps: true } // Automatically adds createdAt and updatedAt
);

splitSchema.methods.toSafeJSON = function () {
    return {
      id: this._id,
      createdAt: this.createdAt,
      amount: this.amount,
      note: this.note,

    };
  };
  
  module.exports = model('Split', splitSchema);