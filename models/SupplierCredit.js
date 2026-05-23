const mongoose = require('mongoose');

const supplierCreditSchema = new mongoose.Schema({

  supplierName: {
    type: String,
    required: true
  },

  supplierPhone: {
    type: String,
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

  amount: {
    type: Number,
    required: true
  },

  paid: {
    type: Number,
    default: 0
  },

  balance: {
    type: Number,
    required: true
  },

  status: {
    type: String,
    default: 'UNPAID'
  },

  createdAt: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model(
  'SupplierCredit',
  supplierCreditSchema
);
module.exports = mongoose.model('SupplierCredit', supplierCreditSchema);