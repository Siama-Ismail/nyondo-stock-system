const express = require('express');
const router = express.Router();

const Stock = require('../models/Stock');
const Sales = require('../models/Sales');


// ====================================
// DASHBOARD
// ====================================
router.get('/dashboard', async (req, res) => {

  try {

    // STOCK
    const stocks = await Stock.find();

    const totalStock = stocks.reduce((sum, item) => {
      return sum + (Number(item.quantity) || 0);
    }, 0);

    const lowStock = stocks.filter(item =>
      Number(item.quantity) < 20
    );

    // SALES
    const sales = await Sales.find();

    const totalSales = sales.reduce((sum, sale) => {
      return sum + (Number(sale.total) || 0);
    }, 0);

    // CREDIT
    const creditSales = sales.filter(sale =>
      sale.paymentmethod === 'Credit'
    );

    const pendingCredit = creditSales.reduce((sum, sale) => {
      return sum + (Number(sale.total) || 0);
    }, 0);

    // RECENT SALES
    const recentSales = await Sales.find()
      .sort({ createdAt: -1 })
      .limit(5);

    res.render('dashboard', {

      totalStock,
      totalSales,
      pendingCredit,
      lowStock,
      recentSales

    });

  } catch (error) {

    console.log(error);

    res.render('dashboard', {

      totalStock: 0,
      totalSales: 0,
      pendingCredit: 0,
      lowStock: [],
      recentSales: [],
      error: error.message

    });

  }

});

module.exports = router;