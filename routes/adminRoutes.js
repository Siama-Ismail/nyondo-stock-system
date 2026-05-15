const express = require('express');
const router = express.Router();

const Stock = require('../models/Stock');
const Sales = require('../models/Sales');
const Credit = require('../models/Credit');

router.get('/admin', async (req, res) => {

  try {

    const stocks = await Stock.find();
    const sales = await Sales.find().sort({ createdAt: -1 });
    const credits = await Credit.find();

    const totalStockItems = stocks.length;

    const inventoryValue = stocks.reduce((total, item) => {
      return total + (item.quantity * item.sellingprice);
    }, 0);

    const totalSales = sales.reduce((total, sale) => {
      return total + sale.total;
    }, 0);

    const totalCredit = credits.reduce((total, credit) => {
      return total + credit.balance;
    }, 0);

    const lowStock = stocks.filter(item => item.quantity < 20);

    const recentSales = sales.slice(0, 5);

    res.render('admin', {
      totalStockItems,
      inventoryValue,
      totalSales,
      totalCredit,
      lowStock,
      recentSales
    });

  } catch (error) {

    console.log(error);
    res.send(error.message);

  }

});

module.exports = router;