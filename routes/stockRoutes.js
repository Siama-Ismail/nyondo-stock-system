const express = require('express');
const router = express.Router();

const Stock = require('../models/Stock');
const StockLedger = require('../models/StockLedger');


// ======================================
// UGANDAN PHONE VALIDATION
// ======================================

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


// ======================================
// STOCK VALIDATION & HELPERS
// ======================================

const allowedPaymentStatuses = ['Cash At Hand', 'Mobile Money', 'Bank'];

const fetchStocks = async () => {
  const stocks = await Stock.find();
  const totalItems = stocks.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const inventoryValue = stocks.reduce((sum, item) => sum + ((Number(item.quantity) || 0) * (Number(item.sellingPrice) || 0)), 0);
  const costValue = stocks.reduce((sum, item) => sum + (Number(item.totalpaid) || 0), 0);
  const lowStock = stocks.filter(item => (Number(item.quantity) || 0) < 20);
  return { stocks, totalItems, inventoryValue, costValue, lowStock };
};

const renderStockForm = async (res, fieldErrors = {}, values = {}) => {
  const { stocks, totalItems, inventoryValue, costValue, lowStock } = await fetchStocks();
  return res.render('stock', {
    stocks,
    totalItems,
    inventoryValue,
    costValue,
    expectedProfit: inventoryValue - costValue,
    lowStock,
    fieldErrors,
    ...values
  });
};

function validateStockInput(fields) {
  const {
    productname,
    quantity,
    unitcost,
    sellingPrice,
    suppliername,
    supplierphone,
    factoryname,
    paymentstatus
  } = fields;

  const errors = {};

  if (!productname || productname.trim() === '') {
    errors.productname = 'Select a product.';
  }

  if (!quantity || quantity === '' || isNaN(Number(quantity)) || Number(quantity) <= 0) {
    errors.quantity = 'Quantity must be a positive number.';
  }

  if (!unitcost || unitcost === '' || isNaN(Number(unitcost)) || Number(unitcost) <= 0) {
    errors.unitcost = 'Unit cost must be a positive number.';
  }

  if (!sellingPrice || sellingPrice === '' || isNaN(Number(sellingPrice)) || Number(sellingPrice) <= 0) {
    errors.sellingPrice = 'Selling price must be a positive number.';
  }

  if (!suppliername || suppliername.trim().length < 2) {
    errors.suppliername = 'Enter a valid supplier name.';
  }

  if (!supplierphone || !isValidUgandanNumber(supplierphone.trim())) {
    errors.supplierphone = 'Enter a valid Ugandan phone (+2567XXXXXXXX or 07XXXXXXXX).';
  }

  if (!factoryname || factoryname.trim().length < 2) {
    errors.factoryname = 'Enter a valid factory name.';
  }

  if (!paymentstatus || !allowedPaymentStatuses.includes(paymentstatus)) {
    errors.paymentstatus = 'Select a valid payment status.';
  }

  return Object.keys(errors).length > 0 ? errors : null;
}


// ======================================
// STOCK PAGE
// ======================================

router.get('/stock', async (req, res) => {

  try {

    const stocks = await Stock.find();

    const totalItems = stocks.reduce(
      (sum, item) =>
        sum + (Number(item.quantity) || 0),
      0
    );

    const inventoryValue = stocks.reduce(
      (sum, item) =>
        sum +
        ((Number(item.quantity) || 0) *
        (Number(item.sellingPrice) || 0)),
      0
    );

    const costValue = stocks.reduce(
      (sum, item) =>
        sum + (Number(item.totalpaid) || 0),
      0
    );

    const lowStock = stocks.filter(
      item => (Number(item.quantity) || 0) < 20
    );

    res.render('stock', {

      stocks,
      totalItems,
      inventoryValue,
      costValue,
      expectedProfit: inventoryValue - costValue,
      lowStock

    });

  }

  catch (error) {

    console.log(error);
    res.status(500).send(error.message);

  }

});


// ======================================
// ADD STOCK / RESTOCK (FIXED)
// ======================================

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

    const validationError = validateStockInput({
      productname,
      quantity,
      unitcost,
      sellingPrice,
      suppliername,
      supplierphone,
      factoryname,
      paymentstatus
    });

    if (validationError) {
      return renderStockForm(res, validationError, {
        productname,
        quantity,
        unitcost,
        sellingPrice,
        suppliername,
        supplierphone,
        factoryname,
        paymentstatus
      });
    }

    const cleanPhone = normalizeUgandanNumber(supplierphone);

    const qty = Number(quantity);
    const cost = Number(unitcost);
    const price = Number(sellingPrice);


    // ======================================
    // CURRENT STOCK
    // ======================================

    const existingStock = await Stock.findOne({ productname });

    if (existingStock) {

      existingStock.quantity += qty;
      existingStock.unitcost = cost;
      existingStock.sellingPrice = price;
      existingStock.totalpaid += qty * cost;
      existingStock.suppliername = suppliername;
      existingStock.supplierphone = cleanPhone;
      existingStock.factoryname = factoryname;
      existingStock.paymentstatus = paymentstatus;

      // ✅ UPDATE RESTOCK DATE ONLY
      existingStock.lastRestocked = new Date();

      await existingStock.save();

    }

    else {

      const now = new Date();

      const newStock = new Stock({

        productname,
        quantity: qty,
        unitcost: cost,
        sellingPrice: price,
        totalpaid: qty * cost,
        suppliername,
        supplierphone: cleanPhone,
        factoryname,
        paymentstatus,

        // ✅ FIRST TIME ENTRY DATE
        dateReceived: now,

        // ✅ INITIAL RESTOCK DATE
        lastRestocked: now

      });

      await newStock.save();

    }


    // ======================================
    // LIFETIME STOCK LEDGER (UNCHANGED)
    // ======================================

    const existingLedger = await StockLedger.findOne({ productname });

    if (existingLedger) {

      existingLedger.lifetimeQuantity += qty;
      existingLedger.unitcost = cost;
      existingLedger.sellingPrice = price;
      existingLedger.suppliername = suppliername;
      existingLedger.supplierphone = cleanPhone;
      existingLedger.factoryname = factoryname;

      existingLedger.totalValue =
        existingLedger.lifetimeQuantity * price;

      await existingLedger.save();

    }

    else {

      const newLedger = new StockLedger({

        productname,
        lifetimeQuantity: qty,
        unitcost: cost,
        sellingPrice: price,
        suppliername,
        supplierphone: cleanPhone,
        factoryname,
        totalValue: qty * price

      });

      await newLedger.save();

    }

    req.flash('success', 'Stock item added successfully.');
    res.redirect('/stock');

  }

  catch (error) {

    console.log(error);
    res.status(500).send(error.message);

  }

});


// ======================================
// DELETE STOCK (UNCHANGED)
// ======================================

router.get('/delete-stock/:id', async (req, res) => {

  try {

    await Stock.findByIdAndDelete(req.params.id);
    res.redirect('/stock');

  }

  catch (error) {

    console.log(error);
    res.status(500).send(error.message);

  }

});


// ======================================
// EDIT STOCK PAGE (UNCHANGED)
// ======================================

router.get('/edit-stock/:id', async (req, res) => {

  try {

    const stockItem = await Stock.findById(req.params.id);

    if (!stockItem) {
      return res.status(404).send('Stock item not found');
    }

    res.render('edit-stock', { stock: stockItem });

  }

  catch (error) {

    console.log(error);
    res.status(500).send('Error retrieving stock item');

  }

});


// ======================================
// UPDATE STOCK (UNCHANGED)
// ======================================

router.post('/edit-stock/:id', async (req, res) => {

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
    const price = Number(sellingPrice);
    const totalpaid = qty * cost;

    await Stock.findByIdAndUpdate(req.params.id, {

      productname,
      quantity: qty,
      unitcost: cost,
      sellingPrice: price,
      totalpaid,
      suppliername,
      supplierphone,
      factoryname,
      paymentstatus

    });

    res.redirect('/stock');

  }

  catch (error) {

    console.log(error);
    res.status(500).send('Error updating stock item');

  }

});


// ======================================
// LIFETIME STOCK LEDGER PAGE (UNCHANGED)
// ======================================

router.get('/manage-stock', async (req, res) => {

  try {

    const ledgerStocks = await StockLedger.find()
      .sort({ updatedAt: -1 });

    const totalLifetimeItems = ledgerStocks.reduce(
      (sum, item) =>
        sum + (Number(item.lifetimeQuantity) || 0),
      0
    );

    const totalLifetimeValue = ledgerStocks.reduce(
      (sum, item) =>
        sum + (Number(item.totalValue) || 0),
      0
    );

    res.render('manage-stock', {

      ledgerStocks,
      totalLifetimeItems,
      totalLifetimeValue

    });

  }

  catch (error) {

    console.log(error);
    res.status(500).send(error.message);

  }

});


module.exports = router;