const express = require('express');
const router = express.Router();

const Stock = require('../models/Stock');
const Sales = require('../models/Sales');
const Credit = require('../models/Credit');
const Registration = require('../models/Registration');


// =====================
// ADMIN DASHBOARD
// =====================
router.get('/admin', async (req, res) => {

  try {

    const stocks = await Stock.find();
    const sales = await Sales.find().sort({ createdAt: -1 });
    const credits = await Credit.find();
    const staffs = await Registration.find().sort({ createdAt: -1 });

    // =====================
    // STOCK METRICS
    // =====================
    const totalStockItems = stocks.reduce((sum, item) =>
      sum + (Number(item.quantity) || 0), 0);

    const totalProducts = stocks.length;

    const inventoryValue = stocks.reduce((sum, item) =>
      sum + (
        (Number(item.quantity) || 0) *
        (Number(item.sellingPrice) || 0)
      ), 0);

    const costValue = stocks.reduce((sum, item) =>
  sum + (
    (Number(item.quantity) || 0) *
    (Number(item.unitcost) || 0)
  ), 0);
    const expectedProfit = inventoryValue - costValue;

    // =====================
    // SALES METRICS
    // =====================
    const totalSales = sales.reduce((sum, sale) =>
      sum + (Number(sale.total) || 0), 0);

    const today = new Date();

    const totalSalesToday = sales
      .filter(sale => {
        const d = new Date(sale.createdAt);
        return d.toDateString() === today.toDateString();
      })
      .reduce((sum, sale) => sum + Number(sale.total || 0), 0);

    const totalSalesMonth = sales
      .filter(sale => {
        const d = new Date(sale.createdAt);
        return d.getMonth() === today.getMonth() &&
               d.getFullYear() === today.getFullYear();
      })
      .reduce((sum, sale) => sum + Number(sale.total || 0), 0);

    // =====================
    // OTHER METRICS
    // =====================
    const lowStock = stocks.filter(item =>
      Number(item.quantity || 0) < 20
    );

    const recentSales = sales.slice(0, 5);

    // =====================
    // RENDER
    // =====================
    res.render('admin', {

      totalStockItems,
      totalProducts,

      inventoryValue,
      costValue,
      expectedProfit,

      totalSales,
      totalSalesToday,
      totalSalesMonth,

      lowStock,
      recentSales,

      staffs,
      totalStaffs: staffs.length
    });

  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }

});


// =====================
// DELETE STAFF
// =====================
router.get('/delete-admin/:id', async (req, res) => {

  try {
    await Registration.findByIdAndDelete(req.params.id);
    res.redirect('/admin');
  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }

});


// =====================
// STAFF PAGE
// =====================
router.get('/staffs', async (req, res) => {

  try {

    const staffs = await Registration.find()
      .sort({ createdAt: -1 });

    res.render('staffs', { staffs });

  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }

});

module.exports = router;