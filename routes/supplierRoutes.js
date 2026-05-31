const express = require('express');
const router = express.Router();

const Supplier = require('../models/Supplier');
const Stock = require('../models/Stock');
const SupplierCredit = require('../models/SupplierCredit');

const parseProductsSupplied = (productsInput) => {
  if (!productsInput) return [];
  if (typeof productsInput !== 'string') return [];
  return productsInput
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
};

const validateSupplierInput = ({ supplierName, contactPerson, phoneNumber, emailAddress, supplierAddress }) => {
  const errors = {};

  if (!supplierName || supplierName.trim().length < 3) {
    errors.supplierName = 'Enter a valid supplier name (at least 3 characters).';
  }

  if (!contactPerson || contactPerson.trim().length < 3) {
    errors.contactPerson = 'Enter a valid contact person name (at least 3 characters).';
  }

  if (!phoneNumber || !/^\+256[0-9]{9}$/.test(phoneNumber.trim())) {
    errors.phoneNumber = 'Enter a valid Ugandan phone number (+256 followed by 9 digits).';
  }

  const email = (emailAddress || '').trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.emailAddress = 'Enter a valid email address.';
  }

  const address = (supplierAddress || '').trim();
  if (address && address.length < 5) {
    errors.supplierAddress = 'Supplier address must be at least 5 characters long.';
  }

  return Object.keys(errors).length > 0 ? errors : null;
};

const renderSuppliersPage = async (res, fieldErrors = {}, oldData = {}) => {
  const suppliers = await Supplier.find().sort({ createdAt: -1 });
  const stock = await Stock.find();

  const data = suppliers.map(supplier => {
    const items = stock.filter(item =>
      supplier.productsSupplied.includes(item.productname)
    );

    const lowStockItems = items.filter(item =>
      item.quantity <= 5
    );

    let autoStatus = 'inactive';

    if (items.length > 0) {
      const availableItems = items.filter(i =>
        i.quantity > 5
      );

      if (availableItems.length > 0) {
        autoStatus = 'active';
      } else {
        autoStatus = 'low-stock';
      }
    }

    return {
      ...supplier._doc,
      status: autoStatus,
      items,
      lowStockItems
    };
  });

  res.render('suppliers', {
    suppliers: data,
    fieldErrors,
    oldData
  });
};

const syncCreditToStock = async ({ item, quantity, unitPrice, supplierName, supplierPhone }) => {
  const qty = Number(quantity);
  const cost = Number(unitPrice);
  const now = new Date();

  const existingStock = await Stock.findOne({ productname: item });

  if (existingStock) {
    existingStock.quantity += qty;
    existingStock.unitcost = cost;
    existingStock.totalpaid += qty * cost;
    existingStock.suppliername = supplierName;
    existingStock.supplierphone = supplierPhone;
    existingStock.lastRestocked = now;
    await existingStock.save();
    return;
  }

  await Stock.create({
    productname: item,
    quantity: qty,
    unitcost: cost,
    totalpaid: qty * cost,
    sellingPrice: cost,
    suppliername: supplierName,
    supplierphone: supplierPhone,
    factoryname: supplierName,
    paymentstatus: 'Bank',
    dateReceived: now,
    lastRestocked: now
  });
};

// SUPPLIERS DASHBOARD

router.get('/suppliers', async (req, res) => {

  try {

    await renderSuppliersPage(res);

  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
});

// ADD SUPPLIER

router.post('/add-supplier', async (req, res) => {

  try {

    const productsRaw = req.body.productsSupplied || '';
    const products = parseProductsSupplied(productsRaw);

    const supplierInput = {
      supplierName: req.body.supplierName,
      contactPerson: req.body.contactPerson,
      phoneNumber: req.body.phoneNumber,
      emailAddress: req.body.emailAddress,
      supplierAddress: req.body.supplierAddress
    };

    const validationErrors = validateSupplierInput(supplierInput);

    if (validationErrors) {
      return renderSuppliersPage(res, validationErrors, {
        ...supplierInput,
        productsSupplied: productsRaw
      });
    }

    await Supplier.create({
      ...supplierInput,
      productsSupplied: products
    });

    res.redirect('/suppliers');

  } catch (error) {

    console.log('ADD SUPPLIER ERROR:', error);

    res.status(500).send(error.message);
  }
});

// EDIT SUPPLIER PAGE

router.get('/edit-supplier/:id', async (req, res) => {

  try {

    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      return res.status(404).send('Supplier not found');
    }

    res.render('editSupplier', {
      supplier
    });

  } catch (error) {

    console.log(error);
    if (error.name === 'ValidationError') {
      try {
        const credits = await SupplierCredit.find().sort({ createdAt: -1 });
        const totalDebt = credits.reduce((sum, c) => sum + Number(c.balance || 0), 0);
        const fieldErrors = {};
        for (const key in error.errors) {
          if (Object.prototype.hasOwnProperty.call(error.errors, key)) {
            fieldErrors[key] = error.errors[key].message;
          }
        }
        return res.render('supplier_credit', { credits, totalDebt, fieldErrors, oldData: req.body });
      } catch (innerErr) {
        console.log('Error rendering validation state:', innerErr);
        return res.status(500).send(innerErr.message);
      }
    }

    res.status(500).send(error.message);
  }
});

// UPDATE SUPPLIER

router.post('/update-supplier/:id', async (req, res) => {

  try {

    const productsRaw = req.body.productsSupplied || '';
    const products = parseProductsSupplied(productsRaw);

    const supplierInput = {
      supplierName: req.body.supplierName,
      contactPerson: req.body.contactPerson,
      phoneNumber: req.body.phoneNumber,
      emailAddress: req.body.emailAddress,
      supplierAddress: req.body.supplierAddress
    };

    const validationErrors = validateSupplierInput(supplierInput);

    if (validationErrors) {
      const supplier = await Supplier.findById(req.params.id);
      if (!supplier) {
        return res.status(404).send('Supplier not found');
      }
      return res.render('editsupplier', {
        supplier,
        fieldErrors: validationErrors,
        oldData: {
          ...supplierInput,
          productsSupplied: productsRaw,
          status: req.body.status
        }
      });
    }

    await Supplier.findByIdAndUpdate(req.params.id, {
      supplierName: req.body.supplierName,
      contactPerson: req.body.contactPerson,
      phoneNumber: req.body.phoneNumber,
      emailAddress: req.body.emailAddress,
      supplierAddress: req.body.supplierAddress,
      productsSupplied: products
    });

    res.redirect('/suppliers');

  } catch (error) {

    console.log(error);

    if (error.name === 'ValidationError') {
      try {
        const credit = await SupplierCredit.findById(req.params.id);
        if (!credit) return res.status(404).send('Credit not found');
        const fieldErrors = {};
        for (const key in error.errors) {
          if (Object.prototype.hasOwnProperty.call(error.errors, key)) {
            fieldErrors[key] = error.errors[key].message;
          }
        }
        return res.render('editSupplierCredit', { credit, fieldErrors, oldData: req.body });
      } catch (innerErr) {
        console.log('Error rendering validation for update:', innerErr);
        return res.status(500).send(innerErr.message);
      }
    }

    res.status(500).send(error.message);
  }
});

// DELETE SUPPLIER

router.get('/delete-supplier/:id', async (req, res) => {

  try {

    await Supplier.findByIdAndDelete(req.params.id);

    res.redirect('/suppliers');

  } catch (error) {

    console.log(error);

    res.status(500).send(error.message);
  }
});

// SUPPLIER CREDIT DASHBOARD

router.get('/supplier-credit', async (req, res) => {

  try {

    const credits = await SupplierCredit.find()
      .sort({ createdAt: -1 });

    const totalDebt = credits.reduce((sum, c) =>
      sum + Number(c.balance || 0), 0
    );

    res.render('supplier_credit', {
      credits,
      totalDebt
    });

  } catch (error) {

    console.log(error);

    res.status(500).send(error.message);
  }
});

// ADD SUPPLIER CREDIT

router.post('/add-supplier-credit', async (req, res) => {

  try {

    const {
      supplierName,
      supplierPhone,
      item,
      quantity,
      unitPrice,
      paid
    } = req.body;

    const qty = Number(quantity);
    const price = Number(unitPrice);
    const pd = Number(paid || 0);

    const amount = qty * price;

    const balance = Math.max(0, amount - pd);

    await SupplierCredit.create({
      supplierName,
      supplierPhone,
      item,
      quantity: qty,
      unitPrice: price,
      amount,
      paid: pd,
      balance,
      status: balance <= 0 ? 'PAID' : 'UNPAID'
    });

    await syncCreditToStock({
      item,
      quantity: qty,
      unitPrice: price,
      supplierName,
      supplierPhone
    });

    req.flash('success', 'Supplier credit record added successfully.');
    res.redirect('/supplier-credit');

  } catch (error) {

    console.log(error);

    res.status(500).send(error.message);
  }
});

// PAY SUPPLIER

router.post('/pay-supplier/:id', async (req, res) => {

  try {

    const payAmount = Number(req.body.paid || 0);

    const credit = await SupplierCredit.findById(req.params.id);

    if (!credit) {
      return res.status(404).send('Credit not found');
    }

    credit.paid += payAmount;

    if (credit.paid > credit.amount) {
      credit.paid = credit.amount;
    }

    credit.balance = Math.max(
      0,
      credit.amount - credit.paid
    );

    if (credit.balance <= 0) {
      credit.status = 'PAID';
    }

    await credit.save();

    req.flash('success', 'Supplier payment recorded successfully.');
    res.redirect('/supplier-credit');

  } catch (error) {

    console.log(error);

    res.status(500).send(error.message);
  }
});

// EDIT SUPPLIER CREDIT PAGE

router.get('/edit-supplier-credit/:id', async (req, res) => {

  try {

    const credit = await SupplierCredit.findById(req.params.id);

    if (!credit) {
      return res.status(404).send('Credit not found');
    }

    res.render('editSupplierCredit', {
      credit
    });

  } catch (error) {

    console.log(error);

    res.status(500).send(error.message);
  }
});

// UPDATE SUPPLIER CREDIT

router.post('/update-supplier-credit/:id', async (req, res) => {

  try {

    const {
      supplierName,
      supplierPhone,
      item,
      quantity,
      unitPrice,
      paid
    } = req.body;

    const qty = Number(quantity);
    const price = Number(unitPrice);
    const pd = Number(paid || 0);

    const amount = qty * price;

    const balance = Math.max(0, amount - pd);

    await SupplierCredit.findByIdAndUpdate(req.params.id, {

      supplierName,

      supplierPhone,

      item,

      quantity: qty,

      unitPrice: price,

      amount,

      paid: pd,

      balance,

      status: balance <= 0
        ? 'PAID'
        : 'UNPAID'
    });

    req.flash('success', 'Supplier credit updated successfully.');
    res.redirect('/supplier-credit');

  } catch (error) {

    console.log(error);

    res.status(500).send(error.message);
  }
});

// DELETE SUPPLIER CREDIT

router.get('/delete-supplier-credit/:id', async (req, res) => {

  try {

    await SupplierCredit.findByIdAndDelete(req.params.id);

    res.redirect('/supplier-credit');

  } catch (error) {

    console.log(error);

    res.status(500).send(error.message);
  }
});

// SUPPLIER CREDIT RECEIPT

router.get('/supplier-credit-receipt/:id', async (req, res) => {

  try {

    const credit = await SupplierCredit.findById(req.params.id);

    if (!credit) {
      return res.status(404).send('Credit not found');
    }

    res.render('supplier_receipt', {
      credit
    });

  } catch (error) {

    console.log(error);

    res.status(500).send(error.message);
  }
});


module.exports = router;