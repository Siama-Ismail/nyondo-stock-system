const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({

  supplierName: {
    type: String,
    required: true
  },

  status: {
    type: String,
    enum: ['active', 'inactive', 'pending'],
    default: 'active'
  },

  contactPerson: {
    type: String,
    required: true
  },

  phoneNumber: {
    type: String,
    required: true
  },

  emailAddress: {
    type: String
  },

  supplierAddress: {
    type: String
  },

  productsSupplied: {
    type: String
  },

  logo: {
    type: String,
    default: ''
  }

}, { timestamps: true });

module.exports = mongoose.model('Supplier', supplierSchema);