const mongoose = require('mongoose');

const stockLedgerSchema = new mongoose.Schema({

  productname: {
    type: String,
    required: true,
    unique: true
  },

  lifetimeQuantity: {
    type: Number,
    default: 0
  },

  unitcost: {
    type: Number,
    default: 0
  },

  sellingPrice: {
    type: Number,
    default: 0
  },

  suppliername: {
    type: String,
    default: ''
  },

  supplierphone: {
    type: String,
    default: ''
  },

  factoryname: {
    type: String,
    default: ''
  },

  totalValue: {
    type: Number,
    default: 0
  }

}, {

  timestamps: true

});

module.exports = mongoose.model(
  'StockLedger',
  stockLedgerSchema
);