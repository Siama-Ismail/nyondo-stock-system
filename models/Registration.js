const mongoose = require('mongoose');

const passportLocalMongoose =
  require('passport-local-mongoose').default ||
  require('passport-local-mongoose');

const registrationSchema = new mongoose.Schema({

  fullname: {
    type: String,
    required: true,
    trim: true
  },

  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },

  phonenumber: {
    type: String,
    trim: true
  },

  nin: {
    type: String,
    trim: true,
    uppercase: true
  },

  role: {
    type: String,
    default: 'Staff'
  }

}, {
  timestamps: true
});


// Login with email
registrationSchema.plugin(passportLocalMongoose, {
  usernameField: 'email'
});

module.exports = mongoose.model('Registration', registrationSchema);