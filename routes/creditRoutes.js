const express = require('express');
const router = express.Router();

const Credit = require('../models/Credit');


// ======================================
// SHOW CREDIT PAGE
// ======================================

router.get('/creditscheme', async (req, res) => {

  try {

    const credits = await Credit.find().sort({ createdAt: -1 });

    // TOTAL OUTSTANDING
    const totalOutstanding = credits.reduce((sum, item) => {
      return sum + (Number(item.currentDebt) || 0);
    }, 0);

    // OVERDUE BALANCE
    const overdueBalance = credits
      .filter(item => item.status === 'Overdue')
      .reduce((sum, item) => {
        return sum + (Number(item.currentDebt) || 0);
      }, 0);

    // ACTIVE CLIENTS
    const activeClients = credits.length;

    res.render('creditscheme', {
      credits,
      totalOutstanding,
      overdueBalance,
      activeClients
    });

  } catch (error) {

    console.log(error);

    res.render('creditscheme', {
      credits: [],
      totalOutstanding: 0,
      overdueBalance: 0,
      activeClients: 0,
      error: error.message
    });

  }

});


// ======================================
// ADD CREDIT CUSTOMER
// ======================================

router.post('/add-credit', async (req, res) => {

  try {

    const {
      businessName,
      nationalId,
      phone,
      approvedLimit,
      paymentCycle
    } = req.body;

    const newCredit = new Credit({

      businessName,
      nationalId,
      phone,

      approvedLimit: Number(approvedLimit),

      paymentCycle,

      currentDebt: 0,

      status: 'Active'

    });

    await newCredit.save();

    res.redirect('/creditscheme');

  } catch (error) {

    console.log(error);

    res.send(error.message);

  }

});


// ======================================
// UPDATE CREDIT STATUS
// ======================================

router.post('/update-credit/:id', async (req, res) => {

  try {

    const {
      currentDebt,
      status
    } = req.body;

    await Credit.findByIdAndUpdate(req.params.id, {

      currentDebt: Number(currentDebt),

      status

    });

    res.redirect('/creditscheme');

  } catch (error) {

    console.log(error);

    res.redirect('/creditscheme');

  }

});


// ======================================
// DELETE CREDIT ACCOUNT
// ======================================

router.get('/delete-credit/:id', async (req, res) => {

  try {

    await Credit.findByIdAndDelete(req.params.id);

    res.redirect('/creditscheme');

  } catch (error) {

    console.log(error);

    res.redirect('/creditscheme');

  }

});


module.exports = router;