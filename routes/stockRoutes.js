const express = require('express');
const router = express.Router();

const Stock = require('../models/Stock');

// =========================
// STOCK PAGE
// =========================
router.get('/stock', async (req, res) => {

  try {

    const stocks = await Stock.find();

    const totalItems = stocks.reduce((a, b) => a + b.quantity, 0);

    const inventoryValue = stocks.reduce((a, b) =>
      a + (b.quantity * b.sellingPrice), 0);

    const costValue = stocks.reduce((a, b) =>
      a + (b.totalpaid || 0), 0);

    const lowStock = stocks.filter(s => s.quantity < 20);

    res.render('stock', {
      stocks,
      totalItems,
      inventoryValue,
      costValue,
      expectedProfit: inventoryValue - costValue,
      lowStock
    });

  } catch (err) {
    res.status(500).send(err.message);
  }
});

// =========================
// ADD STOCK
// =========================
router.post('/add-stock', async (req, res) => {

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

  const stock = new Stock({
    productname,
    quantity: qty,
    unitcost: cost,
    sellingPrice: Number(sellingPrice),
    totalpaid: qty * cost,
    suppliername,
    supplierphone,
    factoryname,
    paymentstatus
  });

  await stock.save();

  res.redirect('/stock');
});

// =========================
// DELETE STOCK
// =========================
router.get('/delete-stock/:id', async (req, res) => {
  await Stock.findByIdAndDelete(req.params.id);
  res.redirect('/stock');
});

module.exports = router;