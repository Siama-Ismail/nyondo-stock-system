const mongoose = require('mongoose');

const salesSchema = new mongoose.Schema({
  product: {
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
  customerName: {
    type: String,
    required: true
  },
  customerContact: {
    type: String,
    required: true
  },
  paymentMethod: {
    type: String,
    // enum:['Cash At Hand','Mobile Money','Credit'],
    required: true
  },
  deliveryDistance: {
    type: Number,
    required: true
  },

  transportFee: {
    type: Number,
    default: 0
  },

  total: {
    type: Number,
    default: 0
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Sales', salesSchema);