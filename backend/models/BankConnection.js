const { Schema, model } = require('mongoose');

const bankConnectionSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            index: true,
            required: true
        },
        item_id: {
            type: String,
            unique: true,
            required: true
        },
        accessToken: {
            ct: String,
            iv: String,
            tag: String,
            v: Number
        },
        institution: {
            name: String,
            institution_id: String
        }
    },
    { timestamps: true }
);

module.exports = model('BankConnection', bankConnectionSchema);