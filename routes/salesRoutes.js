const express = require('express');
const router = express.Router();

const Sales = require('../models/Sales');
const Stock = require('../models/Stock');

// =========================
// GET SALES PAGE
// =========================
router.get('/sales', async (req, res) => {
  try {
    const sales = await Sales.find().sort({ createdAt: -1 });
    const stocks = await Stock.find();

    res.render('sales', { sales, stocks });

  } catch (err) {
    res.render('sales', {
      sales: [],
      stocks: [],
      error: err.message
    });
  }
});

// =========================
// ADD SALE
// =========================
router.post('/add-sales', async (req, res) => {
  try {
    let { customerName, customerContact, paymentMethod, deliveryDistance, product, quantity } = req.body;

    if (!Array.isArray(product)) {
      product = [product];
      quantity = [quantity];
    }

    let items = [];
    let subtotal = 0;

    for (let i = 0; i < product.length; i++) {

      const stock = await Stock.findOne({ productname: product[i] });

      if (!stock) return res.send('Product not found');

      const qty = Number(quantity[i]);

      if (stock.quantity < qty) return res.send('Not enough stock');

      const price = stock.sellingPrice;

      const total = qty * price;

      subtotal += total;

      items.push({
        product: product[i],
        quantity: qty,
        sellingPrice: price,
        itemTotal: total
      });

      stock.quantity -= qty;
      await stock.save();
    }

    let transport = (deliveryDistance <= 10 && subtotal >= 500000) ? 0 : 30000;

    const sale = new Sales({
      customerName,
      customerContact,
      paymentMethod,
      deliveryDistance,
      items,
      transportFee: transport,
      total: subtotal + transport
    });

    await sale.save();

    res.redirect('/sales');

  } catch (err) {
    res.status(500).send(err.message);
  }
});

// =========================
// DELETE SALE
// =========================
router.get('/delete-sales/:id', async (req, res) => {
  await Sales.findByIdAndDelete(req.params.id);
  res.redirect('/sales');
});

// =========================
// RECEIPT
// =========================
router.get('/receipt/:id', async (req, res) => {
  const sale = await Sales.findById(req.params.id);
  res.render('receipt', { sale });
});

module.exports = router;