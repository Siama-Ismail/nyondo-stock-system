const express = require('express');
const router = express.Router();

const Sales = require('../models/Sales');
const Stock = require('../models/Stock');
const Credit = require('../models/Credit');
const SupplierCredit = require('../models/SupplierCredit');


// ======================================
// REPORTS DASHBOARD
// ======================================
router.get('/reports', async (req, res) => {

  try {

    // ======================================
    // DATABASE RECORDS
    // ======================================
    const sales = await Sales.find().sort({ createdAt: -1 });

    const stocks = await Stock.find();

    const customers = await Credit.find();

    const suppliers = await SupplierCredit.find();



    // ======================================
    // TODAY DATE
    // ======================================
    const today = new Date();

    today.setHours(0,0,0,0);



    // ======================================
    // MONTH START
    // ======================================
    const startOfMonth = new Date();

    startOfMonth.setDate(1);

    startOfMonth.setHours(0,0,0,0);



    // ======================================
    // TODAY SALES
    // ======================================
    const todaySales = sales.filter(sale =>
      new Date(sale.createdAt) >= today
    );

    const todayTotal = todaySales.reduce((sum, sale) =>
      sum + (Number(sale.total) || 0), 0);



    // ======================================
    // MONTHLY SALES
    // ======================================
    const monthlySalesData = sales.filter(sale =>
      new Date(sale.createdAt) >= startOfMonth
    );

    const monthlySales = monthlySalesData.reduce((sum, sale) =>
      sum + (Number(sale.total) || 0), 0);



    // ======================================
    // TOTAL SALES
    // ======================================
    const totalSales = sales.reduce((sum, sale) =>
      sum + (Number(sale.total) || 0), 0);



    // ======================================
    // REAL PROFIT
    // ======================================
    let profit = 0;

    let monthlyProfit = 0;

    let todayProfit = 0;



    for (const sale of sales) {

      if (!sale.items || sale.items.length === 0)
        continue;

      let saleProfit = 0;

      for (const item of sale.items) {

        const stockItem = await Stock.findOne({
          productname: item.product
        });

        if (!stockItem) continue;

        const unitProfit =
          (Number(item.sellingPrice) || 0) -
          (Number(stockItem.unitcost) || 0);

        saleProfit +=
          unitProfit *
          (Number(item.quantity) || 0);
      }

      profit += saleProfit;

      // MONTHLY PROFIT
      if (new Date(sale.createdAt) >= startOfMonth) {
        monthlyProfit += saleProfit;
      }

      // TODAY PROFIT
      if (new Date(sale.createdAt) >= today) {
        todayProfit += saleProfit;
      }
    }



    // ======================================
    // STOCK VALUE
    // ======================================
    const stockValue = stocks.reduce((sum, item) => {

      return sum + (
        (Number(item.quantity) || 0) *
        (Number(item.unitcost) || 0)
      );

    }, 0);



    // ======================================
    // POTENTIAL REVENUE
    // ======================================
    const potentialRevenue = stocks.reduce((sum, item) => {

      return sum + (
        (Number(item.quantity) || 0) *
        (Number(item.sellingPrice) || 0)
      );

    }, 0);



    // ======================================
    // EXPECTED PROFIT
    // ======================================
    const expectedProfit = stocks.reduce((sum, item) => {

      const unitProfit =
        (Number(item.sellingPrice) || 0) -
        (Number(item.unitcost) || 0);

      return sum + (
        unitProfit *
        (Number(item.quantity) || 0)
      );

    }, 0);



    // ======================================
    // CUSTOMER DEBT
    // ======================================
    const totalCustomerDebt = customers.reduce((sum, customer) =>
      sum + (Number(customer.balance) || 0), 0);



    // ======================================
    // SUPPLIER DEBT
    // ======================================
    const totalSupplierDebt = suppliers.reduce((sum, supplier) =>
      sum + (Number(supplier.balance) || 0), 0);



    // ======================================
    // TOP DEBTORS
    // ======================================
    const topDebtors = customers
      .filter(c => c.balance > 0)
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 10);



    // ======================================
    // LOW STOCK
    // ======================================
    const lowStock = stocks.filter(item =>
      Number(item.quantity) < 20
    );



    // ======================================
    // TOTAL PRODUCTS
    // ======================================
    const totalProducts = stocks.length;



    // ======================================
    // TOTAL CUSTOMERS
    // ======================================
    const totalCustomers = customers.length;



    // ======================================
    // RENDER PAGE
    // ======================================
    res.render('reports', {

      todayTotal,

      monthlySales,

      totalSales,

      todayProfit,

      monthlyProfit,

      profit,

      expectedProfit,

      totalCustomerDebt,

      totalSupplierDebt,

      stockValue,

      potentialRevenue,

      topDebtors,

      lowStock,

      totalProducts,

      totalCustomers

    });

  } catch (error) {

    console.log(error);

    res.status(500).send(error.message);

  }

});

module.exports = router;