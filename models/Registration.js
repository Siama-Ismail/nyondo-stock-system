const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose').default || require('passport-local-mongoose');
const registrationSchema = new mongoose.Schema({
  fullname: {
    type: String,
    trim: true
    
  },
  email: {
    type: String,
    trim: true,
    required: true,
    unique: true
   
  },
 phonenumber: {
    type: String
   
  },
  nin: {
    type: String,
    trim:true
  },

  role: {
    type: String
  },

 
});

// Telling passport to use email instead of username
registrationSchema.plugin(passportLocalMongoose, {
  usernameField: 'email'
});


module.exports = mongoose.model('Registration', registrationSchema);