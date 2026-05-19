const mongoose = require('mongoose');

const salesSchema = new mongoose.Schema({
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
    required: true
  },
  deliveryDistance: {
    type: Number,
    required: true
  },
  items: [{
    product: { type: String, required: true },
    quantity: { type: Number, required: true },
    sellingPrice: { type: Number, required: true },
    itemTotal: { type: Number, required: true }
  }],
  subTotal: {
    type: Number,
    required: true,
    default: 0
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