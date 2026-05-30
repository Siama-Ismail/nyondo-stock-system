const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({

  productname: {
    type: String,
    required: true,
    trim: true
  },

  quantity: {
    type: Number,
    required: true
  },

  unitcost: {
    type: Number,
    required: true
  },

  totalpaid: {
    type: Number,
    required: true
  },

  sellingPrice: {
    type: Number,
    required: true
  },

  suppliername: {
    type: String,
    required: true,
    trim: true
  },

  supplierphone: {
    type: String,
    required: true,
    trim: true
  },

  factoryname: {
    type: String,
    required: true,
    trim: true
  },

  paymentstatus: {
    type: String,
    enum: ['Cash At Hand', 'Mobile Money', 'Bank'],
    required: true
  },

  dateReceived: {
    type: Date,
    default: Date.now
  },

  lastRestocked: {
    type: Date,
    default: Date.now
  }

}, { timestamps: true });

module.exports = mongoose.model('Stock', stockSchema);