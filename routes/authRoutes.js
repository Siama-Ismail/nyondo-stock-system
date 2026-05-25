const express = require("express");
const router = express.Router();
const Registration = require('../models/Registration');
const passport = require('passport');


// dashboard routes
// Dashboard routes
router.get('/dashboard',(req,res)=>{
    res.render('dashboard')
})



// GET signup form
router.get('/signup', (req, res) => {

  res.render('signup', {
    error: null
  });

});

router.post('/signup', async (req, res) => {

  try {

    const {
      fullname,
      email,
      phonenumber,
      nin,
      role,
      password
    } = req.body;


    // =========================
    // UGANDA PHONE VALIDATION
    // =========================
    function isValidUgandanNumber(number) {
      if (!number) return false;
      number = number.toString().replace(/[\s-]/g, '');
      return /^(?:\+256|0)7[0-9]{8}$/.test(number);
    }

    function normalizeUgandanNumber(number) {
      number = number.toString().replace(/[\s-]/g, '');
      return number.startsWith('0')
        ? '+256' + number.substring(1)
        : number;
    }


    // =========================
    // UGANDA NIN VALIDATION
    // =========================
    function isValidUgandaNIN(ninValue) {
      if (!ninValue) return false;
      ninValue = ninValue.toString().replace(/\s+/g, '').toUpperCase();
      return /^(CM|CF|RM|RF)[A-Z0-9]{10,14}$/.test(ninValue);
    }

    function normalizeNIN(ninValue) {
      return ninValue.toString().replace(/\s+/g, '').toUpperCase();
    }


    // =========================
    // VALIDATE PHONE
    // =========================
    if (!isValidUgandanNumber(phonenumber)) {
      return res.render('signup', {
        error: 'Enter a valid Ugandan phone number (+2567XXXXXXXX or 07XXXXXXXX)'
      });
    }

    const cleanPhone = normalizeUgandanNumber(phonenumber);


    // =========================
    // VALIDATE NIN
    // =========================
    if (!isValidUgandaNIN(nin)) {
      return res.render('signup', {
        error: 'Enter a valid NIN (Example: CMXXXXXXXXXXXXXX)'
      });
    }

    const cleanNIN = normalizeNIN(nin);


    // =========================
    // CHECK IF USER EXISTS
    // =========================
    const existingUser = await Registration.findOne({
      email: email.toLowerCase()
    });

    if (existingUser) {
      return res.render('signup', {
        error: 'Email is already registered'
      });
    }


    // =========================
    // CREATE USER
    // =========================
    const newUser = new Registration({

      fullname,

      email: email.toLowerCase(),

      phonenumber: cleanPhone,

      nin: cleanNIN,

      role: role || 'Staff'

    });


    // REGISTER USER + HASH PASSWORD
    await Registration.register(newUser, password);

    console.log('✅ User registered successfully');

    res.redirect('/admin');

  }

  catch (error) {

    console.error(error);

    res.render('signup', {
      error: error.message
    });

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


// logout routes
// LOGOUT
router.get('/logout', (req, res) => {

  req.logout(function(err) {

    if (err) {
      console.log(err);
      return res.redirect('/dashboard');
    }

    res.render('logout');

  });

});



module.exports = router;
