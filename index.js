// 1. Dependencies
const express = require('express');
const expressSession = require('express-session');
const path = require('path');
const mongoose = require('mongoose');
const passport = require('passport');
const flash = require('connect-flash');
const Registration = require('./models/Registration');
const Stock = require('./models/Stock');
const Supplier = require('./models/Supplier');
const SupplierCredit = require('./models/SupplierCredit');
const Transport = require('./models/Transport');

require('dotenv').config();
const connectDb = require('./config/db');

// 2. Instantiations
const app = express();
const port = 3000;

// 3. Configurations
connectDb();

// Set templating engine to pug
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// 4. Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));

// FIX: Cookie is now properly nested inside the session configuration object
app.use(expressSession({
  secret: "secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 2 // Two hours life for a login session
  }
}));

// Initialize Passport BEFORE routes
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

// Use passport-local-mongoose helpers
passport.use(Registration.createStrategy());
passport.serializeUser(Registration.serializeUser());
passport.deserializeUser(Registration.deserializeUser());

// 5. Routes (after passport is ready)
app.use('/', require('./routes/stockRoutes'));
app.use('/', require('./routes/authRoutes'));
app.use('/', require('./routes/salesRoutes'));
app.use('/', require('./routes/adminRoutes'));
app.use('/', require('./routes/supplierRoutes'));
app.use('/', require('./routes/creditRoutes'));
app.use('/', require('./routes/reportsRoutes'));
app.use('/', require('./routes/transportRoutes'));

// 404 Catch-all Route
app.use((req, res) => {
  res.status(404).send('Oops! Route not found.');
});

// 6. Bootstrapping Server
app.listen(port, () => console.log(`Listening on port ${port}`));