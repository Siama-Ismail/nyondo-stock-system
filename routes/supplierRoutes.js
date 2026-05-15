const express = require('express');
const router = express.Router();

const Supplier = require('../models/Supplier');


// =========================
// SHOW SUPPLIERS PAGE
// =========================
router.get('/suppliers', async (req, res) => {

  try {

    const suppliers = await Supplier.find().sort({ createdAt: -1 });

    res.render('suppliers', {
      suppliers
    });

  } catch (error) {

    console.log(error);

    res.render('suppliers', {
      suppliers: [],
      error: error.message
    });

  }

});


// =========================
// ADD SUPPLIER
// =========================
router.post('/add-supplier', async (req, res) => {

  try {

    const supplier = new Supplier({

      supplierName: req.body.supplierName,
      status: req.body.status,
      contactPerson: req.body.contactPerson,
      phoneNumber: req.body.phoneNumber,
      emailAddress: req.body.emailAddress,
      supplierAddress: req.body.supplierAddress,
      productsSupplied: req.body.productsSupplied

    });

    await supplier.save();

    res.redirect('/suppliers');

  } catch (error) {

    console.log(error);
    res.send(error.message);

  }

});


// =========================
// DELETE SUPPLIER
// =========================
router.get('/delete-supplier/:id', async (req, res) => {

  try {

    await Supplier.findByIdAndDelete(req.params.id);

    res.redirect('/suppliers');

  } catch (error) {

    console.log(error);
    res.send(error.message);

  }

});


// =========================
// EDIT SUPPLIER PAGE
// =========================
router.get('/edit-supplier/:id', async (req, res) => {

  try {

    const supplier = await Supplier.findById(req.params.id);

    res.render('editSupplier', {
      supplier
    });

  } catch (error) {

    console.log(error);
    res.send(error.message);

  }

});


// =========================
// UPDATE SUPPLIER
// =========================
router.post('/update-supplier/:id', async (req, res) => {

  try {

    await Supplier.findByIdAndUpdate(req.params.id, {

      supplierName: req.body.supplierName,
      status: req.body.status,
      contactPerson: req.body.contactPerson,
      phoneNumber: req.body.phoneNumber,
      emailAddress: req.body.emailAddress,
      supplierAddress: req.body.supplierAddress,
      productsSupplied: req.body.productsSupplied

    });

    res.redirect('/suppliers');

  } catch (error) {

    console.log(error);
    res.send(error.message);

  }

});

module.exports = router;