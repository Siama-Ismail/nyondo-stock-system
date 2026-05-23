const express = require('express');
const router = express.Router();

const Supplier = require('../models/Supplier');
const SupplierCredit = require('../models/SupplierCredit');


// =========================
// SHOW SUPPLIERS PAGE
// =========================
router.get('/suppliers', async (req, res) => {

  try {

    const suppliers = await Supplier.find()
      .sort({ createdAt: -1 });

    res.render('suppliers', {
      suppliers
    });

  } catch (error) {

    console.log(error);

    res.render('suppliers', {
      suppliers: [],
      error: error.message
    });
  }
});


// =========================
// ADD SUPPLIER
// =========================
router.post('/add-supplier', async (req, res) => {

  try {

    const supplier = new Supplier({
      supplierName: req.body.supplierName,
      status: req.body.status,
      contactPerson: req.body.contactPerson,
      phoneNumber: req.body.phoneNumber,
      emailAddress: req.body.emailAddress,
      supplierAddress: req.body.supplierAddress,
      productsSupplied: req.body.productsSupplied
    });

    await supplier.save();

    res.redirect('/suppliers');

  } catch (error) {

    console.log(error);
    res.status(500).send(error.message);
  }
});


// =========================
// DELETE SUPPLIER
// =========================
router.get('/delete-supplier/:id', async (req, res) => {

  try {

    await Supplier.findByIdAndDelete(req.params.id);

    res.redirect('/suppliers');

  } catch (error) {

    console.log(error);
    res.status(500).send(error.message);
  }
});


// =========================
// EDIT SUPPLIER PAGE
// =========================
router.get('/edit-supplier/:id', async (req, res) => {

  try {

    const supplier = await Supplier.findById(req.params.id);

    res.render('editSupplier', {
      supplier
    });

  } catch (error) {

    console.log(error);
    res.status(500).send(error.message);
  }
});


// =========================
// UPDATE SUPPLIER
// =========================
router.post('/update-supplier/:id', async (req, res) => {

  try {

    await Supplier.findByIdAndUpdate(req.params.id, {

      supplierName: req.body.supplierName,
      status: req.body.status,
      contactPerson: req.body.contactPerson,
      phoneNumber: req.body.phoneNumber,
      emailAddress: req.body.emailAddress,
      supplierAddress: req.body.supplierAddress,
      productsSupplied: req.body.productsSupplied

    });

    res.redirect('/suppliers');

  } catch (error) {

    console.log(error);
    res.status(500).send(error.message);
  }
});


// =========================
// GET SUPPLIER CREDIT PAGE
// =========================
router.get('/supplier-credit', async (req, res) => {

  try {

    const credits = await SupplierCredit.find()
      .sort({ createdAt: -1 });

    const totalDebt = credits.reduce((sum, c) =>
      sum + Number(c.balance || 0), 0);

    res.render('supplier_credit', {
      credits,
      totalDebt
    });

  } catch (error) {

    console.log(error);
    res.status(500).send(error.message);
  }
});


// =========================
// ADD SUPPLIER CREDIT
// =========================
router.post('/add-supplier-credit', async (req, res) => {

  try {

    const {
      supplierName,
      supplierPhone,
      item,
      quantity,
      unitPrice,
      paid
    } = req.body;

    const qty = Number(quantity);
    const price = Number(unitPrice);
    const pd = Number(paid || 0);

    const amt = qty * price;

    const balance = Math.max(0, amt - pd);

    const newCredit = new SupplierCredit({

      supplierName,
      supplierPhone,
      item,

      quantity: qty,
      unitPrice: price,

      amount: amt,
      paid: pd,
      balance,

      status: balance <= 0 ? 'PAID' : 'UNPAID'
    });

    await newCredit.save();

    res.redirect('/supplier-credit');

  } catch (error) {

    console.log(error);
    res.status(500).send(error.message);
  }
});


// =========================
// UPDATE PAYMENT
// =========================
router.post('/pay-supplier/:id', async (req, res) => {

  try {

    const payAmount = Number(req.body.paid);

    const credit = await SupplierCredit.findById(req.params.id);

    credit.paid += payAmount;

    if (credit.paid > credit.amount) {
      credit.paid = credit.amount;
    }

    credit.balance = Math.max(
      0,
      credit.amount - credit.paid
    );

    if (credit.balance <= 0) {
      credit.status = 'PAID';
    }

    await credit.save();

    res.redirect('/supplier-credit');

  } catch (error) {

    console.log(error);
    res.status(500).send(error.message);
  }
});


// =========================
// EDIT SUPPLIER CREDIT PAGE
// =========================
router.get('/edit-supplier-credit/:id', async (req, res) => {

  try {

    const credit = await SupplierCredit.findById(req.params.id);

    res.render('editSupplierCredit', {
      credit
    });

  } catch (error) {

    console.log(error);
    res.status(500).send(error.message);
  }
});


// =========================
// UPDATE SUPPLIER CREDIT
// =========================
router.post('/update-supplier-credit/:id', async (req, res) => {

  try {

    const {
      supplierName,
      supplierPhone,
      item,
      quantity,
      unitPrice,
      paid
    } = req.body;

    const qty = Number(quantity);
    const price = Number(unitPrice);
    const pd = Number(paid || 0);

    const amount = qty * price;

    const balance = Math.max(0, amount - pd);

    await SupplierCredit.findByIdAndUpdate(req.params.id, {

      supplierName,
      supplierPhone,
      item,

      quantity: qty,
      unitPrice: price,

      amount,
      paid: pd,
      balance,

      status: balance <= 0 ? 'PAID' : 'UNPAID'
    });

    res.redirect('/supplier-credit');

  } catch (error) {

    console.log(error);
    res.status(500).send(error.message);
  }
});


// =========================
// DELETE CREDIT
// =========================
router.get('/delete-supplier-credit/:id', async (req, res) => {

  try {

    await SupplierCredit.findByIdAndDelete(req.params.id);

    res.redirect('/supplier-credit');

  } catch (error) {

    console.log(error);
    res.status(500).send(error.message);
  }
});


// =========================
// RECEIPT
// =========================
router.get('/supplier-credit-receipt/:id', async (req, res) => {

  try {

    const credit = await SupplierCredit.findById(req.params.id);

    if (!credit) {
      return res.status(404).send('Credit not found');
    }

    res.render('supplier_receipt', {
      credit
    });

  } catch (error) {

    console.log(error);
    res.status(500).send(error.message);
  }
});

module.exports = router;