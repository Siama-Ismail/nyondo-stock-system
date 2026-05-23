const express = require('express');
const router = express.Router();

const Credit = require('../models/Credit');
const Deposit = require('../models/Deposit');
const Stock = require('../models/Stock');
const SupplierCredit = require('../models/SupplierCredit');

// =========================
// CREDIT DASHBOARD
// =========================
router.get('/credit', async (req, res) => {

  const customers = await Credit.find();
  const deposits = await Deposit.find().populate('customer');
  const credits = await SupplierCredit.find();

  const totalDebt = credits.reduce((a, b) => a + b.balance, 0);

  res.render('credit', {
    customers,
    deposits,
    credits,
    totalDebt
  });
});

// =========================
// ADD CUSTOMER
// =========================
router.post('/add-credit-customer', async (req, res) => {

  await Credit.create({
    ...req.body,
    balance: 0
  });

  res.redirect('/credit');
});

// =========================
// DEPOSIT / SALE ON CREDIT
// =========================
router.post('/add-deposit/:id', async (req, res) => {

  const customer = await Credit.findById(req.params.id);

  const stock = await Stock.findOne({ productname: req.body.item });

  const qty = Number(req.body.quantity);
  const price = stock.sellingPrice;

  const total = qty * price;

  let balance = total - Number(req.body.amount || 0);

  const deposit = new Deposit({
    customer: customer._id,
    item: stock.productname,
    quantity: qty,
    amount: req.body.amount,
    balance,
    status: balance <= 0 ? 'CLEAR' : 'PENDING'
  });

  await deposit.save();

  customer.balance += balance;
  await customer.save();

  res.redirect('/credit-receipt/' + deposit._id);
});

// =========================
// SUPPLIER CREDIT
// =========================
router.post('/add-supplier-credit', async (req, res) => {

  const qty = Number(req.body.quantity);
  const price = Number(req.body.unitPrice);

  const amount = qty * price;
  const paid = Number(req.body.paid || 0);

  await SupplierCredit.create({
    ...req.body,
    quantity: qty,
    unitPrice: price,
    amount,
    paid,
    balance: amount - paid,
    status: (amount - paid) <= 0 ? 'PAID' : 'UNPAID'
  });

  res.redirect('/credit');
});

// =========================
// PAY SUPPLIER
// =========================
router.post('/pay-supplier/:id', async (req, res) => {

  const credit = await SupplierCredit.findById(req.params.id);

  const pay = Number(req.body.paid);

  credit.paid += pay;
  credit.balance -= pay;

  if (credit.balance <= 0) {
    credit.balance = 0;
    credit.status = 'PAID';
  }

  await credit.save();

  res.redirect('/credit');
});

// =========================
// DELETE SUPPLIER CREDIT
// =========================
router.get('/delete-supplier-credit/:id', async (req, res) => {
  await SupplierCredit.findByIdAndDelete(req.params.id);
  res.redirect('/credit');
});

module.exports = router;