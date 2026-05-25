const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({

  supplierName: {
    type: String,
    required: true,
    trim: true
  },

  contactPerson: {
    type: String,
    required: true,
    trim: true
  },

  phoneNumber: {
    type: String,
    required: true,
    trim: true
  },

  emailAddress: {
    type: String,
    default: '',
    trim: true
  },

  supplierAddress: {
    type: String,
    default: '',
    trim: true
  },

  // 🔥 IMPORTANT FIX
  productsSupplied: [{
    type: String,
    trim: true
  }],

  logo: {
    type: String,
    default: ''
  }

}, { timestamps: true });

module.exports = mongoose.model('Supplier', supplierSchema);