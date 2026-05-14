const express = require('express');
const router = express.Router();

const Stock = require('../models/Stock');
const Sales = require('../models/Sales');
const Credit = require('../models/Credit');


// ============================
// ADMIN DASHBOARD
// ============================
router.get('/dashboard', async (req, res) => {

  try {

    // =========================
    // STOCK DETAILS
    // =========================
    const stocks = await Stock.find();

    let totalStock = 0;
    let inventoryValue = 0;

    stocks.forEach(stock => {

      totalStock += Number(stock.quantity);

      inventoryValue +=
        Number(stock.quantity) *
        Number(stock.sellingprice || 0);

    });


    // =========================
    // SALES DETAILS
    // =========================
    const sales = await Sales.find();

    let totalSales = 0;

    sales.forEach(sale => {

      totalSales += Number(sale.total);

    });


    // =========================
    // CREDIT DETAILS
    // =========================
    const credits = await Credit.find();

    let totalCredit = 0;

    credits.forEach(credit => {

      totalCredit += Number(credit.currentDebt || 0);

    });


    // =========================
    // RECENT SALES
    // =========================
    const recentSales = await Sales
      .find()
      .sort({ createdAt: -1 })
      .limit(5);


    // =========================
    // LOW STOCK ALERTS
    // =========================
    const lowStock = await Stock.find({
      quantity: { $lt: 20 }
    });


    // =========================
    // RENDER DASHBOARD
    // =========================
    res.render('dashboard', {

      totalStock,

      inventoryValue,

      totalSales,

      totalCredit,

      recentSales,

      lowStock

    });

  } catch (error) {

    console.log(error);

    res.send(error.message);

  }

});

module.exports = router;