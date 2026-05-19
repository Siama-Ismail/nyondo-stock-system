const mongoose = require('mongoose');

const depositSchema = new mongoose.Schema({

  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Credit',
    required: true
  },

  item: {
    type: String,
    required: true
  },

  quantity: {
    type: Number,
    required: true
  },

  unitPrice: {
    type: Number,
    required: true
  },

  totalPrice: {
    type: Number,
    required: true
  },

  transportFee: {
    type: Number,
    default: 0
  },

  amount: {
    type: Number,
    required: true
  },

  balance: {
    type: Number,
    required: true
  },

  status: {
    type: String,
    enum: ['PENDING', 'CLEAR'],
    default: 'PENDING'
  },

  paymentMethod: {
    type: String,
    enum: ['Cash', 'Mobile Money', 'Bank'],
    required: true
  },

  receiptNumber: {
    type: String,
    required: true
  }

}, { timestamps: true });

module.exports = mongoose.model('Deposit', depositSchema);