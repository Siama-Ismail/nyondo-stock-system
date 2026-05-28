const express = require('express');
const router = express.Router();

const Sales = require('../models/Sales');
const Stock = require('../models/Stock');

// UGANDAN PHONE VALIDATION
function isValidUgandanNumber(number) {
  const regex = /^(?:\+256|0)7[0-9]{8}$/;
  return regex.test(number);
}

// GET SALES PAGE
router.get('/sales', async (req, res) => {
  try {
    const sales = await Sales.find().sort({ createdAt: -1 });
    const stocks = await Stock.find();

    res.render('sales', {
      sales,
      stocks
    });
  } catch (err) {
    res.render('sales', {
      sales: [],
      stocks: [],
      error: err.message
    });
  }
});

// ADD SALE
router.post('/add-sales', async (req, res) => {
  try {
    let {
      customerName,
      customerContact,
      paymentMethod,
      deliveryDistance,
      product,
      quantity
    } = req.body;

    const ownTransport = req.body.ownTransport === 'on';

    const renderWithError = async (errorMessage) => {
      const sales = await Sales.find().sort({ createdAt: -1 });
      const stocks = await Stock.find();
      return res.render('sales', {
        sales,
        stocks,
        error: errorMessage
      });
    };

    // VALIDATE PHONE NUMBER
    if (!isValidUgandanNumber(customerContact)) {
      return renderWithError('Invalid phone number. Use +2567XXXXXXXX or 07XXXXXXXX');
    }

    // NORMALIZE PHONE NUMBER
    if (customerContact.startsWith('0')) {
      customerContact = '+256' + customerContact.substring(1);
    }

    // ENSURE ARRAYS
    if (!Array.isArray(product)) {
      product = [product];
      quantity = [quantity];
    }

    let items = [];
    let computedSubtotal = 0;

    // PROCESS ITEMS
    for (let i = 0; i < product.length; i++) {
      if (!product[i]) continue;

      const stock = await Stock.findOne({ productname: product[i] });

      if (!stock) {
        return renderWithError(`Product not found: ${product[i]}`);
      }

      const qty = Number(quantity[i]);

      if (qty <= 0) {
        return renderWithError('Quantity must be greater than zero');
      }

      if (stock.quantity < qty) {
        return renderWithError(`Not enough stock for ${product[i]}`);
      }

      const price = stock.sellingPrice;
      const total = qty * price;
      computedSubtotal += total;

      items.push({
        product: product[i],
        quantity: qty,
        sellingPrice: price,
        itemTotal: total
      });

      // REDUCE STOCK
      stock.quantity -= qty;
      await stock.save();
    }

    // UNIFIED TRANSPORT FEES RULES ENGINE
    let transportFee = 30000;

    if (ownTransport) {
      transportFee = 0;
    } else if (Number(deliveryDistance) <= 10 && computedSubtotal >= 500000) {
      transportFee = 0;
    }

    // CREATE SALE
    const sale = new Sales({
      customerName,
      customerContact,
      paymentMethod,
      deliveryDistance: ownTransport ? 0 : Number(deliveryDistance),
      ownTransport,
      items,
      subTotal: computedSubtotal,
      transportFee,
      total: computedSubtotal + transportFee
    });

    await sale.save();
    res.redirect('/sales');

  } catch (err) {
    console.error(err);
    try {
      const sales = await Sales.find().sort({ createdAt: -1 });
      const stocks = await Stock.find();
      res.render('sales', {
        sales,
        stocks,
        error: "A critical database error occurred while recording the sale."
      });
    } catch (fatalErr) {
      res.status(500).send(err.message);
    }
  }
});

// EDIT SALES PAGE
router.get('/edit-sales/:id', async (req, res) => {
  try {
    const sale = await Sales.findById(req.params.id);
    const stocks = await Stock.find();

    if (!sale) {
      return res.status(404).send('Sale not found');
    }

    res.render('edit-sales', {
      sale,
      stocks
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// UPDATE SALE
router.post('/update-sales/:id', async (req, res) => {
  try {
    let {
      customerName,
      customerContact,
      paymentMethod,
      deliveryDistance,
      product,
      quantity
    } = req.body;

    const ownTransport = req.body.ownTransport === 'on';

    const sale = await Sales.findById(req.params.id);
    const stocks = await Stock.find();

    if (!sale) {
      return res.status(404).send('Sale not found');
    }

    const renderEditWithError = (errorMessage) => {
      return res.render('edit-sales', {
        sale,
        stocks,
        error: errorMessage
      });
    };

    if (!isValidUgandanNumber(customerContact)) {
      return renderEditWithError('Invalid phone number. Use +2567XXXXXXXX or 07XXXXXXXX');
    }

    if (customerContact.startsWith('0')) {
      customerContact = '+256' + customerContact.substring(1);
    }

    const stock = await Stock.findOne({ productname: product });

    if (!stock) {
      return renderEditWithError('Product not found');
    }

    const qty = Number(quantity);

    if (qty <= 0) {
      return renderEditWithError('Quantity must be greater than zero');
    }

    const price = stock.sellingPrice;
    const itemTotal = qty * price;

    let transportFee = 30000;

    if (ownTransport) {
      transportFee = 0;
    } else if (Number(deliveryDistance) <= 10 && itemTotal >= 500000) {
      transportFee = 0;
    }

    // SAVING CONSTRAINTS
    sale.customerName = customerName;
    sale.customerContact = customerContact;
    sale.paymentMethod = paymentMethod;
    sale.deliveryDistance = ownTransport ? 0 : Number(deliveryDistance);
    sale.ownTransport = ownTransport;
    sale.items = [{
      product,
      quantity: qty,
      sellingPrice: price,
      itemTotal
    }];
    sale.subTotal = itemTotal;
    sale.transportFee = transportFee;
    sale.total = itemTotal + transportFee;

    await sale.save();
    res.redirect('/sales');

  } catch (err) {
    res.status(500).send(err.message);
  }
});

// DELETE SALE
router.get('/delete-sales/:id', async (req, res) => {
  try {
    await Sales.findByIdAndDelete(req.params.id);
    res.redirect('/sales');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// RECEIPT PAGE
router.get('/receipt/:id', async (req, res) => {
  try {
    const sale = await Sales.findById(req.params.id);

    if (!sale) {
      return res.status(404).send('Sale not found');
    }

    res.render('receipt', { sale });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;