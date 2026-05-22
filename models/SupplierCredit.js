const mongoose = require('mongoose');

const supplierCreditSchema = new mongoose.Schema({

  supplierName: String,
  supplierPhone: String,

  item: String,
  amount: Number,

  paid: {
    type: Number,
    default: 0
  },

  balance: Number,

  status: {
    type: String,
    default: 'UNPAID'
  },

  createdAt: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model('SupplierCredit', supplierCreditSchema);