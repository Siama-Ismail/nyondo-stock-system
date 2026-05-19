const express = require('express');
const router = express.Router();

const Credit = require('../models/Credit');
const Deposit = require('../models/Deposit');
const Stock = require('../models/Stock');


// ======================================
// CREDIT DASHBOARD
// ======================================
router.get('/credit', async (req, res) => {

  try {

    const customers = await Credit.find()
      .sort({ createdAt: -1 });

    const deposits = await Deposit.find()
      .populate('customer')
      .sort({ createdAt: -1 });

    res.render('credit', {
      customers,
      deposits
    });

  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});


// ======================================
// ADD CUSTOMER
// ======================================
router.post('/add-credit-customer', async (req, res) => {

  try {

    const customer = new Credit({
      fullName: req.body.fullName,
      nin: req.body.nin,
      phone: req.body.phone,
      email: req.body.email,
      address: req.body.address,
      distance: req.body.distance,
      occupation: req.body.occupation,
      employer: req.body.employer,
      nextOfKin: req.body.nextOfKin,
      balance: 0
    });

    await customer.save();

    res.redirect('/credit');

  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});


// ======================================
// LOAD DEPOSIT PAGE
// ======================================
router.get('/deposit/:id', async (req, res) => {

  try {

    const customer = await Credit.findById(req.params.id);

    if (!customer) return res.status(404).send('Customer not found');

    const stocks = await Stock.find();

    const pendingDeposits = await Deposit.find({
      customer: customer._id,
      status: 'PENDING'
    });

    res.render('deposit', {
      customer,
      stocks,
      pendingDeposits
    });

  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});


// ======================================
// ADD DEPOSIT / PAYMENT
// ======================================
router.post('/add-deposit/:id', async (req, res) => {

  try {

    const customer = await Credit.findById(req.params.id);
    if (!customer) return res.status(404).send('Customer not found');

    let {
      item,
      quantity,
      amount,
      paymentMethod,
      depositId
    } = req.body;

    quantity = Number(quantity) || 0;
    amount = Number(amount) || 0;

    // =====================================================
    // PAY EXISTING ITEM (PARTIAL PAYMENT)
    // =====================================================
    if (depositId) {

      const deposit = await Deposit.findById(depositId);
      if (!deposit) return res.status(404).send('Invoice not found');

      if (amount > deposit.balance) amount = deposit.balance;

      deposit.amount += amount;
      deposit.balance -= amount;

      if (deposit.balance <= 0) {
        deposit.balance = 0;
        deposit.status = 'CLEAR';
      }

      await deposit.save();

      customer.balance -= amount;
      if (customer.balance < 0) customer.balance = 0;

      await customer.save();

      const receipt = new Deposit({
        customer: customer._id,
        item: 'PAYMENT - ' + deposit.item,
        quantity: 0,
        unitPrice: 0,
        totalPrice: 0,
        transportFee: 0,
        amount,
        balance: deposit.balance,
        paymentMethod,
        status: deposit.status,
        receiptNumber: 'PAY-' + Date.now()
      });

      await receipt.save();

      return res.redirect('/credit-receipt/' + receipt._id);
    }

    // =====================================================
    // NEW SALE
    // =====================================================
    const stock = await Stock.findOne({
      $or: [
        { productname: item },
        { productName: item }
      ]
    });

    if (!stock) return res.status(404).send('Stock not found');

    if (quantity > stock.quantity)
      return res.send('Not enough stock');

    const unitPrice = stock.sellingPrice;
    let total = quantity * unitPrice;

    let transport = 0;
    if (customer.distance <= 10 && total < 500000)
      transport = 30000;

    total += transport;

    let balance = total - amount;
    if (balance < 0) balance = 0;

    const status = balance <= 0 ? 'CLEAR' : 'PENDING';

    stock.quantity -= quantity;
    await stock.save();

    customer.balance += balance;
    await customer.save();

    const deposit = new Deposit({
      customer: customer._id,
      item: stock.productname || stock.productName,
      quantity,
      unitPrice,
      totalPrice: total,
      transportFee: transport,
      amount,
      balance,
      paymentMethod,
      status,
      receiptNumber: 'INV-' + Date.now()
    });

    await deposit.save();

    res.redirect('/credit-receipt/' + deposit._id);

  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});


// ======================================
// RECEIPT
// ======================================
router.get('/credit-receipt/:id', async (req, res) => {

  try {

    const deposit = await Deposit.findById(req.params.id)
      .populate('customer');

    if (!deposit) return res.status(404).send('Not found');

    res.render('credit-receipt', { deposit });

  } catch (error) {
    res.status(500).send(error.message);
  }
});


// ======================================
// CUSTOMER HISTORY
// ======================================
router.get('/customer-history/:id', async (req, res) => {

  try {

    const customer = await Credit.findById(req.params.id);
    if (!customer) return res.status(404).send('Not found');

    const deposits = await Deposit.find({
      customer: customer._id
    }).sort({ createdAt: -1 });

    const grouped = {};

    deposits.forEach(d => {

      if (d.item.startsWith('PAYMENT')) return;

      grouped[d._id] = {
        id: d._id,
        item: d.item,
        quantity: d.quantity,
        totalPrice: d.totalPrice,
        amount: d.amount,
        balance: d.balance,
        status: d.status,
        createdAt: d.createdAt
      };
    });

    res.render('customer-history', {
      customer,
      groupedItems: Object.values(grouped)
    });

  } catch (error) {
    res.status(500).send(error.message);
  }
});


// ======================================
// EDIT CREDIT
// ======================================
router.get('/edit-credit/:id', async (req, res) => {

  try {

    const deposit = await Deposit.findById(req.params.id);
    const stocks = await Stock.find();

    if (!deposit) return res.status(404).send('Not found');

    res.render('edit-credit', { deposit, stocks });

  } catch (error) {
    res.status(500).send(error.message);
  }
});


// ======================================
// UPDATE CREDIT
// ======================================
router.post('/edit-credit/:id', async (req, res) => {

  try {

    const deposit = await Deposit.findById(req.params.id);
    const customer = await Credit.findById(deposit.customer);

    const oldBalance = deposit.balance;
    const oldQty = deposit.quantity;

    // restore stock
    const oldStock = await Stock.findOne({
      $or: [
        { productname: deposit.item },
        { productName: deposit.item }
      ]
    });

    if (oldStock) {
      oldStock.quantity += oldQty;
      await oldStock.save();
    }

    const stock = await Stock.findOne({
      $or: [
        { productname: req.body.item },
        { productName: req.body.item }
      ]
    });

    if (!stock) return res.status(404).send('Stock not found');

    const qty = Number(req.body.quantity);
    const paid = Number(req.body.amount);

    if (qty > stock.quantity)
      return res.send('Not enough stock');

    stock.quantity -= qty;
    await stock.save();

    let total = qty * stock.sellingPrice;

    let transport = 0;
    if (customer.distance <= 10 && total < 500000)
      transport = 30000;

    total += transport;

    let balance = total - paid;
    if (balance < 0) balance = 0;

    customer.balance -= oldBalance;
    customer.balance += balance;

    if (customer.balance < 0) customer.balance = 0;

    await customer.save();

    deposit.item = stock.productname || stock.productName;
    deposit.quantity = qty;
    deposit.unitPrice = stock.sellingPrice;
    deposit.totalPrice = total;
    deposit.transportFee = transport;
    deposit.amount = paid;
    deposit.balance = balance;
    deposit.status = balance <= 0 ? 'CLEAR' : 'PENDING';

    await deposit.save();

    res.redirect('/credit-receipt/' + deposit._id);

  } catch (error) {
    res.status(500).send(error.message);
  }
});


// ======================================
// DELETE CREDIT
// ======================================
router.post('/delete-credit/:id', async (req, res) => {

  try {

    const deposit = await Deposit.findById(req.params.id);
    const customer = await Credit.findById(deposit.customer);

    // restore stock
    const stock = await Stock.findOne({
      $or: [
        { productname: deposit.item },
        { productName: deposit.item }
      ]
    });

    if (stock) {
      stock.quantity += deposit.quantity;
      await stock.save();
    }

    customer.balance -= deposit.balance;
    if (customer.balance < 0) customer.balance = 0;

    await customer.save();

    await Deposit.findByIdAndDelete(deposit._id);

    res.redirect('/credit');

  } catch (error) {
    res.status(500).send(error.message);
  }
});

module.exports = router;