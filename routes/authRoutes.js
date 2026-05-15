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
  res.render('signup');
});


// POST signup form
router.post('/signup', async (req, res) => {
  console.log(req.body);

  try {
    const { fullname, email, phonenumber, nin, role,password } = req.body;

    let existingUser = await Registration.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.render('signup', { error: 'Email is already registered' });
    };
  

    const newUser = new Registration({
        fullname,
        email: email.toLowerCase(),
        phonenumber,
        nin: nin.toUpperCase(),
        role,
        password
      });
      // (err, user) => {
      //   if (err) {
      //     console.error("Registration failed:", err);
      //     return res.render('signup', { error: err.message });
      //   }
        // console.log("✅ User registered:", user);
        await Registration.register(newUser,password);
        console.log('User registered successfully')
        res.redirect('/login');  // <-- this will now work

  }catch (error) {
    console.error(error);
    res.render('signup')
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

    // LOGIN USER
    req.logIn(user, (err) => {

      if (err) {
        console.log(err);
        return next(err);
      }

      // ROLE BASED REDIRECTS
      if (user.role === 'admin') {

        return res.redirect('/admin');

      }

      else if (user.role === 'store_manager') {

        return res.redirect('/stock');

      }

      else if (user.role === 'sales_attendant') {

        return res.redirect('/sales');

      }

      else {

        return res.redirect('/dashboard');

      }

    });

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
