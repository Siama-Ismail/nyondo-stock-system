const express = require('express');
const router = express.Router();
const Stock = require('../models/Stock');


// OPEN EDIT PAGE

router.get('/edit-stock/:id', async (req, res) => {

  try {

    const stock = await Stock.findById(req.params.id);

    if (!stock) {
      return res.redirect('/stock');
    }

    res.render('editstock', { stock });

  } catch (error) {

    console.log(error);

    res.redirect('/stock');

  }

});



// SHOW STOCK PAGE

router.get('/stock', async (req, res) => {
  try {
    const stocks = await Stock.find() || [];

    // TOTAL ITEMS
    const totalItems = stocks.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

    // TOTAL INVENTORY VALUE (Updated to use item.totalpaid as per your model)
    const inventoryValue = stocks.reduce((sum, item) => sum + (Number(item.totalpaid) || 0), 0);

    // LOW STOCK ITEMS
    const lowStock = stocks.filter(item => (Number(item.quantity) || 0) < 20);

    res.render('stock', {
      stocks,
      totalItems,
      inventoryValue,
      lowStock,
      error: null
    });
  } catch (error) {
    console.log('GET STOCK ERROR:', error);
    res.render('stock', {
      stocks: [], totalItems: 0, inventoryValue: 0, lowStock: [], error: error.message
    });
  }
});


// ADD STOCK

router.post('/add-stock', async (req, res) => {
  try {
    const {
      productname,
      quantity,
      unitcost,      // Matched to Schema
      sellingprice,
      suppliername,  // Matched to Schema
      supplierphone, // Matched to Schema
      factoryname,   // Matched to Schema
      paymentstatus  // Matched to Schema
    } = req.body;

    const qty = Number(quantity) || 0;
    const cost = Number(unitcost) || 0;
    const selling = Number(sellingprice) || 0;

    if (selling <= cost) {
      return res.status(400).send('Selling price must be greater than Unit Cost');
    }

    // Calculate totalpaid as per your Schema requirement
    const totalpaid = qty * cost;

    const newItem = new Stock({
      productname,
      quantity: qty,
      unitcost: cost,
      totalpaid,       // Matches required totalpaid in Schema
      sellingprice: selling,
      suppliername,
      supplierphone,
      factoryname,
      paymentstatus,
      dateReceived: new Date()
    });

    await newItem.save();
    res.redirect('/stock');
  } catch (error) {
    console.log('ADD STOCK ERROR:', error);
    res.status(500).send("Database Error: " + error.message);
  }
});


// UPDATE STOCK

router.post('/update-stock/:id', async (req, res) => {
  try {
    const {
      productname,
      quantity,
      unitcost,
      sellingprice,
      suppliername,
      supplierphone,
      factoryname,
      paymentstatus
    } = req.body;

    const qty = Number(quantity) || 0;
    const cost = Number(unitcost) || 0;
    const totalpaid = qty * cost;

    await Stock.findByIdAndUpdate(req.params.id, {
      productname,
      quantity: qty,
      unitcost: cost,
      totalpaid,
      sellingprice: Number(sellingprice) || 0,
      suppliername,
      supplierphone,
      factoryname,
      paymentstatus
    });

    res.redirect('/stock');
  } catch (error) {
    console.log('UPDATE ERROR:', error);
    res.redirect('/stock');
  }
});


// DELETE STOCK

router.get('/delete-stock/:id', async (req, res) => {
  try {
    await Stock.findByIdAndDelete(req.params.id);
    res.redirect('/stock');
  } catch (error) {
    console.log('DELETE ERROR:', error);
    res.redirect('/stock');
  }
});

// GET Route for Edit Page
router.get('/edit-stock/:id', async (req, res) => {
  try {
    const stock = await Stock.findById(req.params.id);
    if (!stock) return res.redirect('/stock');
    res.render('editstock', { stock });
  } catch (error) {
    res.redirect('/stock');
  }
});

module.exports = router;