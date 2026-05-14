const mongoose = require('mongoose');

const creditSchema = new mongoose.Schema({

  businessName: {
    type: String,
    required: true
  },

  nationalId: {
    type: String
  },

  phone: {
    type: String,
    required: true
  },

  approvedLimit: {
    type: Number,
    required: true
  },

  currentDebt: {
    type: Number,
    default: 0
  },

  paymentCycle: {
    type: String,
    enum: ['14', '30'],
    required: true
  },

  status: {
    type: String,
    enum: ['Active', 'Due Soon', 'Overdue'],
    default: 'Active'
  },

  createdAt: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model('Credit', creditSchema);