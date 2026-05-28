const express = require('express');
const router = express.Router();

const Credit = require('../models/Credit');
const Deposit = require('../models/Deposit');
const Stock = require('../models/Stock');
const SupplierCredit = require('../models/SupplierCredit');


// GLOBALLY DEFINED ALLOWED CREDIT ITEMS
const ALLOWED_CREDIT_ITEMS = [
  'Cement iiN',
  'Cement iiiN',
  'Iron Bars 10mm',
  'Iron Bars 12mm',
  'Iron Bars 16mm',
  'Iron Sheets'
];



// CREDIT DASHBOARD

router.get('/credit', async (req, res) => {
  try {
    const customers = await Credit.find();
    const deposits = await Deposit.find().populate('customer');
    const credits = await SupplierCredit.find();

    const totalDebt = credits.reduce((a, b) => a + (b.balance || 0), 0);

    res.render('credit', {
      customers,
      deposits,
      credits,
      totalDebt
    });
  } catch (err) {
    console.log(err);
    res.status(500).send('Error loading credit dashboard');
  }
});



// ADD CUSTOMER

router.post('/add-credit-customer', async (req, res) => {
  try {
    await Credit.create({
      ...req.body,
      balance: 0
    });
    res.redirect('/credit');
  } catch (err) {
    console.log(err);
    res.send('Error creating customer');
  }
});



// OPEN DEPOSIT PAGE

router.get('/deposit/:id', async (req, res) => {
  try {
    const customer = await Credit.findById(req.params.id);
    
    // FILTER: Only fetch stocks that match our allowed building materials list
    const stocks = await Stock.find({
      productname: { $in: ALLOWED_CREDIT_ITEMS }
    });

    const pendingDeposits = await Deposit.find({
      customer: customer._id,
      balance: { $gt: 0 }
    });

    res.render('deposit', {
      customer,
      stocks,         // Now contains ONLY the 6 allowed credit items
      pendingDeposits
    });
  } catch (err) {
    console.log(err);
    res.status(500).send('Error loading deposit page');
  }
});



// ADD CREDIT SALE / PAYMENT

router.post('/add-deposit/:id', async (req, res) => {
  const customer = await Credit.findById(req.params.id);

  // PAY EXISTING DEBT
  if (req.body.depositId) {
    const oldDeposit = await Deposit.findById(req.body.depositId);
    const payAmount = Number(req.body.amount);

    oldDeposit.amount += payAmount;
    oldDeposit.balance -= payAmount;

    if (oldDeposit.balance <= 0) {
      oldDeposit.balance = 0;
      oldDeposit.status = 'CLEAR';
    }

    await oldDeposit.save();
    customer.balance -= payAmount;
    if (customer.balance < 0) customer.balance = 0;
    await customer.save();

    return res.redirect('/credit-receipt/' + oldDeposit._id);
  }

  // NEW CREDIT SALE
  const selectedItem = req.body.item;

  // EXTRA PROTECTION: Verify the submitted item is from the allowed list
  if (!ALLOWED_CREDIT_ITEMS.includes(selectedItem)) {
    return res.status(400).send('Error: Selected item is not allowed for credit sales.');
  }

  const stock = await Stock.findOne({
    productname: selectedItem
  });

  if (!stock) {
    return res.send('Stock item not found');
  }

  const quantity = Number(req.body.quantity);
  const unitPrice = Number(stock.sellingPrice);

  if (stock.quantity < quantity) {
    return res.send('Not enough stock');
  }

  const transportFee = Number(req.body.transportFee || 0);
  const totalPrice = (quantity * unitPrice) + transportFee;
  const amount = Number(req.body.amount || 0);
  const balance = totalPrice - amount;

  // Reduce stock inventory count
  stock.quantity -= quantity;
  await stock.save();

  const receiptNumber = 'RCPT-' + Date.now();

  const deposit = await Deposit.create({
    customer: customer._id,
    item: stock.productname,
    quantity,
    unitPrice,
    totalPrice,
    transportFee,
    amount,
    balance,
    paymentMethod: req.body.paymentMethod,
    receiptNumber,
    status: balance <= 0 ? 'CLEAR' : 'PENDING'
  });

  customer.balance += balance;
  await customer.save();

  res.redirect('/credit-receipt/' + deposit._id);
});



// CREDIT RECEIPT

router.get('/credit-receipt/:id', async (req, res) => {
  try {
    const deposit = await Deposit.findById(req.params.id).populate('customer');
    if (!deposit) {
      return res.send('Receipt not found');
    }
    res.render('credit-receipt', { deposit });
  } catch (err) {
    console.log(err);
    res.status(500).send('Error loading receipt');
  }
});



// CUSTOMER HISTORY

router.get('/customer-history/:id', async (req, res) => {
  try {
    const customer = await Credit.findById(req.params.id);
    const deposits = await Deposit.find({ customer: customer._id }).sort({ createdAt: -1 });

    const groupedItems = deposits.map(dep => ({
      id: dep._id,
      item: dep.item,
      quantity: dep.quantity,
      totalPrice: dep.totalPrice,
      totalPaid: dep.amount,
      remainingBalance: dep.balance,
      status: dep.status,
      createdAt: dep.createdAt
    }));

    res.render('customer-history', {
      customer,
      groupedItems
    });
  } catch (err) {
    console.log(err);
    res.status(500).send('Error loading customer history');
  }
});



// EDIT CREDIT PAGE

router.get('/edit-credit/:id', async (req, res) => {
  try {
    const deposit = await Deposit.findById(req.params.id);
    
    // FILTER: Ensure the edit dropdown only shows credit items too
    const stocks = await Stock.find({
      productname: { $in: ALLOWED_CREDIT_ITEMS }
    });

    if (!deposit) return res.send('Not found');

    res.render('edit-credit', {
      deposit,
      stocks 
    });
  } catch (err) {
    console.log(err);
    res.status(500).send('Error loading edit page');
  }
});



// UPDATE CREDIT

router.post('/edit-credit/:id', async (req, res) => {
  const selectedItem = req.body.item;

  if (!ALLOWED_CREDIT_ITEMS.includes(selectedItem)) {
    return res.status(400).send('Error: This item cannot be placed on credit.');
  }

  const deposit = await Deposit.findById(req.params.id);
  const customer = await Credit.findById(deposit.customer);
  const stock = await Stock.findOne({ productname: selectedItem });

  const quantity = Number(req.body.quantity);
  const unitPrice = stock.sellingPrice;
  const totalPrice = quantity * unitPrice;
  const amount = Number(req.body.amount);
  const newBalance = totalPrice - amount;

  customer.balance -= deposit.balance;
  customer.balance += newBalance;
  if (customer.balance < 0) customer.balance = 0;
  await customer.save();

  deposit.item = selectedItem;
  deposit.quantity = quantity;
  deposit.unitPrice = unitPrice;
  deposit.totalPrice = totalPrice;
  deposit.amount = amount;
  deposit.balance = newBalance;
  deposit.paymentMethod = req.body.paymentMethod;
  deposit.status = newBalance <= 0 ? 'CLEAR' : 'PENDING';

  await deposit.save();

  res.redirect('/credit-receipt/' + deposit._id);
});



// DELETE CREDIT

router.post('/delete-credit/:id', async (req, res) => {
  try {
    const deposit = await Deposit.findById(req.params.id);
    if (!deposit) return res.redirect('/credit');

    const customer = await Credit.findById(deposit.customer);
    if (customer) {
      customer.balance -= deposit.balance;
      if (customer.balance < 0) customer.balance = 0;
      await customer.save();
    }

    await Deposit.findByIdAndDelete(req.params.id);
    res.redirect('/credit');
  } catch (err) {
    console.log(err);
    res.status(500).send('Error deleting credit entry');
  }
});



// SUPPLIER CREDIT

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



// PAY SUPPLIER

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



// DELETE SUPPLIER CREDIT

router.get('/delete-supplier-credit/:id', async (req, res) => {
  await SupplierCredit.findByIdAndDelete(req.params.id);
  res.redirect('/credit');
});



// DELETE CUSTOMER ACCOUNT

router.post('/delete-customer/:id', async (req, res) => {
  try {
    // 1. Delete the customer account profile
    await Credit.findByIdAndDelete(req.params.id);
    
    // 2. Clean up associated deposits so they don't break dashboard loops
    await Deposit.deleteMany({ customer: req.params.id });

    res.redirect('/credit');
  } catch (err) {
    console.log(err);
    res.status(500).send('Error removing customer profile');
  }
});

module.exports = router;