const express = require('express');
const router = express.Router();

const Stock = require('../models/Stock');


// =========================
// UGANDAN PHONE VALIDATION
// =========================
function isValidUgandanNumber(number) {
  if (!number) return false;

  number = number.toString().replace(/[\s-]/g, '');

  const regex = /^(?:\+256|0)7[0-9]{8}$/;
  return regex.test(number);
}

function normalizeUgandanNumber(number) {
  number = number.toString().replace(/[\s-]/g, '');

  if (number.startsWith('0')) {
    return '+256' + number.substring(1);
  }

  return number;
}



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
// ADD STOCK (WITH VALIDATION)
// =========================
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

    // =========================
    // PHONE VALIDATION (SUPPLIER)
    // =========================
    if (!isValidUgandanNumber(supplierphone)) {
      return res.status(400).send(
        "Invalid supplier phone number. Use +2567XXXXXXXX or 07XXXXXXXX"
      );
    }

    const cleanPhone = normalizeUgandanNumber(supplierphone);

    const qty = Number(quantity);
    const cost = Number(unitcost);

    const stock = new Stock({
      productname,
      quantity: qty,
      unitcost: cost,
      sellingPrice: Number(sellingPrice),
      totalpaid: qty * cost,
      suppliername,
      supplierphone: cleanPhone,
      factoryname,
      paymentstatus
    });

    await stock.save();

    res.redirect('/stock');

  } catch (err) {
    res.status(500).send(err.message);
  }
});


// =========================
// DELETE STOCK
// =========================
router.get('/delete-stock/:id', async (req, res) => {
  try {
    await Stock.findByIdAndDelete(req.params.id);
    res.redirect('/stock');
  } catch (err) {
    res.status(500).send(err.message);
  }
});


module.exports = router;