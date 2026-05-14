const express = require('express');
const router = express.Router();

const Sales = require('../models/Sales');
const Stock = require('../models/Stock');



  
// =========================
// GET EDIT SALE PAGE
// =========================
router.get('/edit-sales/:id', async (req, res) => {
  try {
    const sale = await Sales.findById(req.params.id);

    if (!sale) return res.status(404).send('Sale not found');

    res.render('editsales', { sale });

  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
});


// =========================
// UPDATE SALE
// =========================
router.post('/update-sales/:id', async (req, res) => {
  try {
    const {
      product,
      quantity,
      unitPrice,
      customerName,
      customerContact,
      paymentMethod,
      deliveryDistance
    } = req.body;

    // -------------------------
    // STEP 1: BASE AMOUNT
    // -------------------------
    const baseAmount =
      Number(quantity) * Number(unitPrice);

    // -------------------------
    // STEP 2: TRANSPORT LOGIC
    // -------------------------
    let transportFee;

    if (
      Number(deliveryDistance) <= 10 &&
      baseAmount >= 500000
    ) {
      transportFee = 0;
    } else {
      transportFee = 30000;
    }

    // -------------------------
    // STEP 3: TOTAL
    // -------------------------
    const total = baseAmount + transportFee;

    // -------------------------
    // UPDATE DB
    // -------------------------
    await Sales.findByIdAndUpdate(req.params.id, {
      product,
      quantity: Number(quantity),
      unitPrice: Number(unitPrice),
      customerName,
      customerContact,
      paymentMethod,
      deliveryDistance: Number(deliveryDistance),
      transportFee,
      total
    });

    res.redirect('/sales');

  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
});


// =========================
// SHOW SALES PAGE
// =========================
router.get('/sales', async (req, res) => {
  try {

    const sales = await Sales.find().sort({ createdAt: -1 });

    res.render('sales', { sales });

  } catch (error) {

    console.log(error);

    res.render('sales', {
      sales: [],
      error: error.message
    });

  }
});


// =========================
// ADD NEW SALE
// =========================
router.post('/add-sales', async (req, res) => {

  try {

    const {
      product,
      quantity,
      unitPrice,
      customerName,
      customerContact,
      paymentMethod,
      deliveryDistance
    } = req.body;


    // =========================
    // FIND PRODUCT IN STOCK
    // =========================
    const stockItem = await Stock.findOne({
      productname: product
    });

    if (!stockItem) {
      return res.send('Product not found in stock');
    }


    // =========================
    // CHECK STOCK QUANTITY
    // =========================
    const qty = Number(quantity);

    if (qty > stockItem.quantity) {
      return res.send('Not enough stock available');
    }


    // =========================
    // CALCULATIONS
    // =========================
    const price = Number(unitPrice);
    const distance = Number(deliveryDistance);

    const totalAmount = qty * price;


    // TRANSPORT LOGIC
    let transportFee;

    if (distance <= 10 && totalAmount >= 500000) {
      transportFee = 0;
    } else {
      transportFee = 30000;
    }


    // =========================
    // CREATE SALE
    // =========================
    const sale = new Sales({

      product,

      quantity: qty,

      unitPrice: price,

      customerName,

      customerContact,

      paymentMethod,

      deliveryDistance: distance,

      transportFee,

      total: totalAmount + transportFee

    });

    await sale.save();


    // =========================
    // REDUCE STOCK
    // =========================
    stockItem.quantity = stockItem.quantity - qty;

    await stockItem.save();


    // =========================
    // REDIRECT TO RECEIPT
    // =========================
    res.redirect('/receipt/' + sale._id);

  } catch (error) {

    console.log(error);

    res.status(500).send(error.message);

  }

});


// =========================
// DELETE SALE
// =========================
router.get('/delete-sales/:id', async (req, res) => {

  try {

    await Sales.findByIdAndDelete(req.params.id);

    res.redirect('/sales');

  } catch (error) {

    console.log(error);

    res.status(500).send(error.message);

  }

});


// =========================
// EDIT SALE PAGE
// =========================
router.get('/edit-sales/:id', async (req, res) => {

  try {

    const sale = await Sales.findById(req.params.id);

    if (!sale) {
      return res.redirect('/sales');
    }

    res.render('edit-sales', { sale });

  } catch (error) {

    console.log(error);

    res.status(500).send(error.message);

  }

});


// =========================
// UPDATE SALE
// =========================
router.post('/update-sales/:id', async (req, res) => {

  try {

    const {
      product,
      quantity,
      unitPrice,
      customerName,
      customerContact,
      paymentMethod,
      deliveryDistance
    } = req.body;

    const qty = Number(quantity);
    const price = Number(unitPrice);
    const distance = Number(deliveryDistance);

    const totalAmount = qty * price;

    let transportFee;

    if (distance <= 10 && totalAmount >= 500000) {
      transportFee = 0;
    } else {
      transportFee = 30000;
    }

    await Sales.findByIdAndUpdate(req.params.id, {

      product,

      quantity: qty,

      unitPrice: price,

      customerName,

      customerContact,

      paymentMethod,

      deliveryDistance: distance,

      transportFee,

      total: totalAmount + transportFee

    });

    res.redirect('/sales');

  } catch (error) {

    console.log(error);

    res.status(500).send(error.message);

  }

});


// =========================
// RECEIPT ROUTE
// =========================
router.get('/receipt/:id', async (req, res) => {

  try {

    const sale = await Sales.findById(req.params.id);

    if (!sale) {
      return res.status(404).send('Sale not found');
    }

    res.render('receipt', { sale });

  } catch (error) {

    console.log(error);

    res.status(500).send(error.message);

  }

});


module.exports = router;