/*
id: ObjectId,
user_id: ObjectId,
from_envelope_id: ObjectId,
to_envelope_id: ObjectId,
amount: int,
occurred_at: ISODate,
notes: string
*/

// models/Transfer.js

const { Schema, model, SchemaType } = require('mongoose');
const User = require('./User');
const bcrypt = require('bcryptjs');
const Envelope = require('./Envelope');

const transferSchema = new Schema(
  {
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },

    from_envelope_id: {
        type: Schema.Types.ObjectId,
        ref: 'Envelope',
        required: true,
    },

    to_envelope_id: {
        type: Schema.Types.ObjectId,
        ref: 'Envelope',
        required: true,
    },

    amount: {
        type: Schema.Types.Int32,
        required: true,
    },

    occured_at: {
        type: Schema.Types.Date,
        default: null,
    },

    notes: {
        type: String,
        defualt: '',
    },

    },
    { timestamps: true } // Automatically adds createdAt and updatedAt
);

// Fixed/changed -- Kathlea
transferSchema.methods.toSafeJSON = function () {
    return {
        // new
        id: this.id,
        user_id: this.user_id,
        from_envelope_id: this.from_envelope_id,
        to_envelope_id: this.to_envelope_id,
        amount: this.amount,
        occured_at: this.occured_at,
        notes: this.notes,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
        /* old inside method
        id: this._id,
        name: this.name || '',
        createdAt: this.createdAt,*/
    };
};

module.exports = model('Transfer', transferSchema);