const express = require('express');
const router = express.Router();
const Stock = require('../models/Stock');


// =====================
// GET STOCK PAGE (FIXED)
// =====================
router.get('/stock', async (req, res) => {

  try {

    const stocks = await Stock.find().sort({ dateReceived: -1 });

    // TOTAL STOCK ITEMS
    const totalItems = stocks.reduce((sum, item) =>
      sum + (Number(item.quantity) || 0), 0);

    // INVENTORY VALUE (SELLING PRICE BASED)
    const inventoryValue = stocks.reduce((sum, item) =>
      sum + (
        (Number(item.quantity) || 0) *
        (Number(item.sellingPrice) || 0)
      ), 0);

    // COST VALUE (WHAT YOU SPENT)
    const costValue = stocks.reduce((sum, item) =>
      sum + (Number(item.totalpaid) || 0), 0);

    // EXPECTED PROFIT
    const expectedProfit = inventoryValue - costValue;

    // LOW STOCK ALERTS
    const lowStock = stocks.filter(item =>
      Number(item.quantity || 0) < 20
    );

    res.render('stock', {
      stocks,
      totalItems,
      inventoryValue,
      costValue,
      expectedProfit,
      lowStock,
      error: null
    });

  } catch (error) {

    console.log(error);

    res.render('stock', {
      stocks: [],
      totalItems: 0,
      inventoryValue: 0,
      costValue: 0,
      expectedProfit: 0,
      lowStock: [],
      error: error.message
    });
  }
});


// =====================
// ADD STOCK
// =====================
router.post('/add-stock', async (req, res) => {

  try {

    const {
      productname,
      quantity,
      unitcost,
      sellingPrice,
      suppliername,
      supplierphone,
      factoryname,
      paymentstatus
    } = req.body;

    const qty = Number(quantity);
    const cost = Number(unitcost);
    const selling = Number(sellingPrice);

    if (selling <= cost) {
      return res.send('Selling price must be greater than unit cost');
    }

    const totalpaid = qty * cost;

    const newStock = new Stock({
      productname,
      quantity: qty,
      unitcost: cost,
      sellingPrice: selling,
      totalpaid,
      suppliername,
      supplierphone,
      factoryname,
      paymentstatus
    });

    await newStock.save();

    res.redirect('/stock');

  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
});


// =====================
// UPDATE STOCK
// =====================
router.post('/update-stock/:id', async (req, res) => {

  try {

    const {
      productname,
      quantity,
      unitcost,
      sellingPrice,
      suppliername,
      supplierphone,
      factoryname,
      paymentstatus
    } = req.body;

    const qty = Number(quantity);
    const cost = Number(unitcost);
    const selling = Number(sellingPrice);

    if (isNaN(qty) || qty <= 0) return res.send('Invalid quantity');
    if (isNaN(cost) || cost <= 0) return res.send('Invalid unit cost');
    if (isNaN(selling) || selling <= 0) return res.send('Invalid selling price');

    if (selling <= cost) {
      return res.send('Selling price must be greater than unit cost');
    }

    const totalpaid = qty * cost;

    await Stock.findByIdAndUpdate(req.params.id, {
      productname,
      quantity: qty,
      unitcost: cost,
      sellingPrice: selling,
      totalpaid,
      suppliername,
      supplierphone,
      factoryname,
      paymentstatus
    });

    res.redirect('/stock');

  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
});


// =====================
// DELETE STOCK
// =====================
router.get('/delete-stock/:id', async (req, res) => {

  try {
    await Stock.findByIdAndDelete(req.params.id);
    res.redirect('/stock');
  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }

});


// =====================
// EDIT STOCK PAGE
// =====================
router.get('/edit-stock/:id', async (req, res) => {

  try {

    const stock = await Stock.findById(req.params.id);
    if (!stock) return res.redirect('/stock');

    res.render('editstock', { stock });

  } catch (error) {
    console.log(error);
    res.redirect('/stock');
  }

});

module.exports = router;