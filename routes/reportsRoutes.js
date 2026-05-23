const express = require('express');
const router = express.Router();

const Deposit = require('../models/Deposit');
const Credit = require('../models/Credit');
const Stock = require('../models/Stock');
const SupplierCredit = require('../models/SupplierCredit');


// =========================
// REPORTS DASHBOARD
// =========================
router.get('/reports', async (req, res) => {

  // =========================
  // LOAD DATA
  // =========================
  const deposits = await Deposit.find();
  const customers = await Credit.find();
  const stock = await Stock.find();
  const suppliers = await SupplierCredit.find();

  // =========================
  // DATE FILTER (TODAY)
  // =========================
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaySales = deposits.filter(d =>
    new Date(d.createdAt) >= today
  );

  // =========================
  // SALES TOTALS
  // =========================
  const totalSales = deposits.reduce((a, b) => a + (b.amount || 0), 0);

  const todayTotal = todaySales.reduce((a, b) =>
    a + (b.amount || 0), 0
  );

  // =========================
  // CUSTOMER DEBT
  // =========================
  const totalCustomerDebt = customers.reduce((a, b) =>
    a + (b.balance || 0), 0
  );

  const topDebtors = customers
    .filter(c => c.balance > 0)
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 5);

  // =========================
  // SUPPLIER DEBT
  // =========================
  const totalSupplierDebt = suppliers.reduce((a, b) =>
    a + (b.balance || 0), 0
  );

  // =========================
  // STOCK VALUE (COST VALUE)
  // =========================
  const stockValue = stock.reduce((a, item) => {
    return a + (item.unitcost * item.quantity);
  }, 0);

  // =========================
  // POTENTIAL REVENUE (IF SOLD ALL STOCK)
  // =========================
  const potentialRevenue = stock.reduce((a, item) => {
    return a + (item.sellingPrice * item.quantity);
  }, 0);

  // =========================
  // EXPECTED PROFIT (STOCK BASED)
  // =========================
  const expectedProfit = stock.reduce((a, item) => {
    return a + ((item.sellingPrice - item.unitcost) * item.quantity);
  }, 0);

  // =========================
  // REALIZED PROFIT (FROM SALES)
  // =========================
  let profit = 0;

  deposits.forEach(sale => {

    const item = stock.find(
      p => p.productname === sale.item
    );

    if (item) {

      const cost = item.unitcost * sale.quantity;
      const revenue = sale.amount || 0;

      profit += (revenue - cost);
    }
  });

  // =========================
  // LOW STOCK ITEMS
  // =========================
  const lowStock = stock.filter(
    item => item.quantity <= 5
  );

  // =========================
  // FINAL OUTPUT
  // =========================
  res.render('reports', {

    // sales
    totalSales,
    todayTotal,

    // profit
    profit,
    expectedProfit,

    // debts
    totalCustomerDebt,
    totalSupplierDebt,

    // stock
    stockValue,
    potentialRevenue,

    // lists
    topDebtors,
    lowStock
  });

});


module.exports = router;