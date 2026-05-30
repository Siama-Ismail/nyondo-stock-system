const express = require("express");
const router = express.Router();
const Registration = require('../models/Registration');
const passport = require('passport');

// Helper validators for signup
function isValidUgandanNumber(number) {
  if (!number) return false;
  number = number.toString().replace(/[\s-]/g, '');
  return /^(?:\+2567|07)\d{8}$/.test(number);
}

function normalizeUgandanNumber(number) {
  number = number.toString().replace(/[\s-]/g, '');
  if (number.startsWith('0')) {
    return '+256' + number.substring(1);
  }
  return number;
}

function isValidUgandaNIN(ninValue) {
  if (!ninValue) return false;
  ninValue = ninValue.toString().replace(/\s+/g, '').toUpperCase();
  return /^[A-Z0-9]{14}$/.test(ninValue);
}

function normalizeNIN(ninValue) {
  return ninValue.toString().replace(/\s+/g, '').toUpperCase();
}

function validateSignupInput(fields) {
  const { fullname, email, phonenumber, nin, role, password } = fields;
  const errors = {};

  if (!fullname || fullname.trim().length < 3) {
    errors.fullname = 'Enter a valid full name (min 3 characters).';
  }

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    errors.email = 'Enter a valid email address.';
  }

  if (!phonenumber || !isValidUgandanNumber(phonenumber)) {
    errors.phonenumber = 'Enter a valid Ugandan phone number (+2567XXXXXXXX or 07XXXXXXXX).';
  }

  if (!nin || !isValidUgandaNIN(nin)) {
    errors.nin = 'Enter a valid NIN (Example: CMXXXXXXXXXXXXXX).';
  }

  if (!role) {
    errors.role = 'Select a user role.';
  }

  if (!password || password.length < 8) {
    errors.password = 'Password must be at least 8 characters long.';
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

const renderSignupForm = async (res, fieldErrors = {}, values = {}) => {
  return res.render('signup', {
    fieldErrors,
    ...values
  });
};

// Dashboard routes
router.get('/dashboard',(req,res)=>{
    res.render('dashboard')
})


// GET signup form
router.get('/signup', (req, res) => {
  return renderSignupForm(res);
});

router.post('/signup', async (req, res) => {
  try {
    const { fullname, email, phonenumber, nin, role, password } = req.body;

    const validationErrors = validateSignupInput({ fullname, email, phonenumber, nin, role, password });
    if (validationErrors) {
      return renderSignupForm(res, validationErrors, { fullname, email, phonenumber, nin, role });
    }

    const cleanPhone = normalizeUgandanNumber(phonenumber);
    const cleanNIN = normalizeNIN(nin);

    // CHECK IF USER EXISTS
    const existingUser = await Registration.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return renderSignupForm(res, { email: 'Email is already registered' }, { fullname, email, phonenumber, nin, role });
    }

    // CREATE USER
    const newUser = new Registration({ fullname, email: email.toLowerCase(), phonenumber: cleanPhone, nin: cleanNIN, role: role || 'Staff' });

    // REGISTER USER + HASH PASSWORD
    await Registration.register(newUser, password);

    console.log('✅ User registered successfully');
    res.redirect('/admin');
  }
  catch (error) {
    console.error(error);
    return renderSignupForm(res, { _general: 'Failed to register user. ' + (error.message || '') }, req.body);
  }
});



// GET LOGIN PAGE
router.get('/login', (req, res) => {
  res.render('login');
});


// POST LOGIN
router.post('/login', (req, res, next) => {

  passport.authenticate('local', (err, user, info) => {

    if (err) {
      console.log(err);
      return next(err);
    }

    // USER NOT FOUND
    if (!user) {

      return res.render('login', {
        error: 'Invalid email or password'
      });

    }

    // ROLE BASED REDIRECTS

    const role = user.role.toLowerCase();

    if (role === 'admin') {

      return res.redirect('/admin');

    }

    else if (role === 'store_manager') {

      return res.redirect('/stock');

    }

    else if (role === 'sales_attendant') {

      return res.redirect('/sales');

    }

    else {

      return res.redirect('/dashboard');

    }

  })(req, res, next);

});

// ADMIN DASHBOARD
router.get('/admin-dashboard', (req, res) => {

  if (!req.isAuthenticated()) {
    return res.redirect('/login');
  }

  res.render('admindashboard');

});


// STORE MANAGER DASHBOARD
router.get('/store-dashboard', (req, res) => {

  if (!req.isAuthenticated()) {
    return res.redirect('/login');
  }

  res.render('stock');

});


// SALES MANAGER DASHBOARD
router.get('/sales-dashboard', (req, res) => {

  if (!req.isAuthenticated()) {
    return res.redirect('/login');
  }

  res.render('sales');

});


router.get('/logout', (req, res) => {

  req.session.destroy((err) => {

    if (err) {
      return res.redirect('/dashboard');
    }

    res.redirect('/dashboard');

  });

});



// NEW: SAFE REMOVE STAFF ACCOUNT ROUTE

router.post('/delete-staff/:id', async (req, res) => {
  try {
    // Uses your active model declaration setup (Registration)
    await Registration.findByIdAndDelete(req.params.id);
    res.redirect('/admin'); 
  } catch (error) {
    console.error("Staff removal failure:", error);
    res.status(500).send("Unable to remove staff profile record.");
  }
});


module.exports = router;