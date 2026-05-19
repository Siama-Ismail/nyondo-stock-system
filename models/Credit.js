const mongoose = require('mongoose');

const creditSchema = new mongoose.Schema({

  fullName: {
    type: String,
    required: true
  },

  nin: {
    type: String,
    required: true,
    unique: true
  },

  phone: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true
  },

  address: {
    type: String,
    required: true
  },

  distance: {
    type: Number,
    required: true
  },

  occupation: {
    type: String,
    required: true
  },

  employer: {
    type: String,
    required: true
  },

  nextOfKin: {
    type: String,
    required: true
  },

  balance: {
    type: Number,
    default: 0
  }

}, { timestamps: true });

module.exports = mongoose.model('Credit', creditSchema);