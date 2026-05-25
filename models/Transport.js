const mongoose = require('mongoose');

const transportSchema = new mongoose.Schema({

  deliveryNumber: {
    type: String,
    unique: true
  },

  customer: String,
  vehicle: String,
  driver: String,

  status: {
    type: String,
    enum: ['PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED'],
    default: 'PENDING'
  },

  eta: String,

  deliveryDate: Date,

}, { timestamps: true });

module.exports = mongoose.model('Transport', transportSchema);