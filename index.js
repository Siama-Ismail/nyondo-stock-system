// 1.Dependensies
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









require('dotenv').config();
const connectDb = require('./config/db')

// 2. instanciations
const app = express();
const port = 3000



//3. configurations
connectDb();



// set templating engine to pug
app.set('view engine','pug');
app.set('views', path.join(__dirname, 'views'))


// 4. Middleware
app.use(express.static(path.join(__dirname,'public')));
app.use(express.urlencoded({ extended: false }));
app.use(expressSession({
  secret:"secret",
  resave:false,
  saveUninitialized:false,
}));

// Initialize Passport BEFORE routes
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Use passport-local-mongoose helpers
passport.use(Registration.createStrategy());
passport.serializeUser(Registration.serializeUser());
passport.deserializeUser(Registration.deserializeUser());

// routes (after passport is ready)

app.use('/', require('./routes/stockRoutes'))
app.use('/', require('./routes/authRoutes'))
app.use('/', require('./routes/salesRoutes'))
app.use('/', require('./routes/adminRoutes'));
app.use('/', require('./routes/supplierRoutes'));
app.use('/', require('./routes/creditRoutes'));
app.use('/', require('./routes/reportsRoutes'));


app.use((req,res)=>{
  res.status(404).send('Oops! Route not found.')
});

// 6 Bootstrapping Server

// This should be the last line of code in this file
app.listen(port, () => console.log(`listening on port  ${port}`)); // new