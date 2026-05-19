const express = require('express');
const router = express.Router();

const Sales = require('../models/Sales');
const Stock = require('../models/Stock');


// =========================
// GET SALES PAGE (WITH STOCKS)
// =========================
router.get('/sales', async (req, res) => {
  try {

    const sales = await Sales.find().sort({ createdAt: -1 });
    const stocks = await Stock.find();

    res.render('sales', {
      sales,
      stocks
    });

  } catch (error) {
    console.log(error);

    res.render('sales', {
      sales: [],
      stocks: [],
      error: error.message
    });
  }
});


// =========================
// ADD NEW SALE
// =========================
router.post('/add-sales', async (req, res) => {
  try {
    let { customerName, customerContact, paymentMethod, deliveryDistance, product, quantity } = req.body;

    // Normalizing dynamic lines into arrays safely
    if (!Array.isArray(product)) {
      product = [product];
      quantity = [quantity];
    }

    let itemsOrdered = [];
    let subtotal = 0;

    for (let i = 0; i < product.length; i++) {
      const currentProductName = product[i];
      const currentQuantity = parseInt(quantity[i], 10);

      if (!currentProductName || !currentQuantity) continue;

      // Locate stock document mapping
      const stockItem = await Stock.findOne({ productname: currentProductName });

      if (!stockItem) {
        return res.status(400).send(`Product "${currentProductName}" not found in inventory balances.`);
      }

      if (stockItem.quantity < currentQuantity) {
        return res.status(400).send(`Insufficient inventory stock for ${currentProductName}.`);
      }

      const pricePerUnit = Number(stockItem.sellingPrice) || 0;
      const computedRowTotal = pricePerUnit * currentQuantity;

      subtotal += computedRowTotal;

      // FIXED HERE: Keys now match your schema validation requirements exactly
      itemsOrdered.push({
        product: currentProductName,     // Changed from productname -> product
        quantity: currentQuantity,
        sellingPrice: pricePerUnit,      // Changed from price -> sellingPrice
        itemTotal: computedRowTotal       // Changed from subtotal -> itemTotal
      });

      // Update remaining floor quantities
      stockItem.quantity -= currentQuantity;
      await stockItem.save();
    }

    // Process delivery transport structures 
    const distanceKM = Number(deliveryDistance) || 0;
    let transportFee = 0;
    if (distanceKM > 10 || subtotal < 500000) {
      transportFee = 30000;
    }

    const grandTotal = subtotal + transportFee;

    // Build finalized schema record
    const newSale = new Sales({
      customerName,
      customerContact,
      paymentMethod,
      deliveryDistance: distanceKM,
      items: itemsOrdered, 
      transportFee,
      total: grandTotal    
    });

    await newSale.save();
    res.redirect('/sales');

  } catch (err) {
    console.error("Error saving sale transaction:", err);
    res.status(500).send("Database processing error recording transaction.");
  }
});
// =========================
// DELETE SALE
// =========================
router.get('/delete-sales/:id', async (req, res) => {
  try {

    await Sales.findByIdAndDelete(req.params.id);

    res.redirect('/sales');

  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
});


// =========================
// EDIT SALE PAGE
// =========================
router.get('/edit-sales/:id', async (req, res) => {
  try {

    const sale = await Sales.findById(req.params.id);

    if (!sale) return res.redirect('/sales');

    res.render('editsales', { sale });

  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
});


// =========================
// UPDATE SALE
// =========================
router.post('/update-sales/:id', async (req, res) => {
  try {

    const {
      product,
      quantity,
      sellingPrice,
      customerName,
      customerContact,
      paymentMethod,
      deliveryDistance
    } = req.body;

    const qty = Number(quantity);
    const price = Number(sellingPrice); // FIXED (was unitPrice before)
    const distance = Number(deliveryDistance);

    const totalAmount = qty * price;

    const transportFee =
      (distance <= 10 && totalAmount >= 500000)
        ? 0
        : 30000;

    await Sales.findByIdAndUpdate(req.params.id, {
      product,
      quantity: qty,
      sellingPrice: price,
      customerName,
      customerContact,
      paymentMethod,
      deliveryDistance: distance,
      transportFee,
      total: totalAmount + transportFee
    });

    res.redirect('/sales');

  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
});


// =========================
// RECEIPT PAGE
// =========================
router.get('/receipt/:id', async (req, res) => {
  try {

    const sale = await Sales.findById(req.params.id);

    if (!sale) return res.status(404).send('Sale not found');

    res.render('receipt', { sale });

  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
});


module.exports = router;