const express = require('express');
const router = express.Router();

const Sales = require('../models/Sales');
const Stock = require('../models/Stock');
const SupplierCredit = require('../models/SupplierCredit');

// =========================
// REPORT DASHBOARD
// =========================
router.get('/reports', async (req, res) => {

  try {

    const sales = await Sales.find().sort({ createdAt: -1 });
    const stocks = await Stock.find();
    const credits = await SupplierCredit.find();

    const totalSales = sales.reduce((a, b) => a + b.total, 0);

    const inventoryValue = stocks.reduce(
      (a, b) => a + (b.quantity * b.sellingPrice), 0
    );

    const expectedProfit = stocks.reduce((sum, item) => {
  return sum +
    ((Number(item.sellingPrice) - Number(item.unitcost)) *
     Number(item.quantity || 0));
}, 0);
    const lowStock = stocks.filter(s => s.quantity < 20);

    const totalDebt = credits.reduce((a, b) => a + b.balance, 0);

    res.render('reports', {
      sales: sales.slice(0, 10),
      inventoryValue,
      expectedProfit,
      lowStock,
      credits: credits.slice(0, 10),
      totalSales,
      totalDebt
    });

  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;