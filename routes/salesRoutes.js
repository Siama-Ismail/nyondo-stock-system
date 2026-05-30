const express = require('express');
const router = express.Router();

const Sales = require('../models/Sales');
const Stock = require('../models/Stock');

// UGANDAN PHONE VALIDATION
function isValidUgandanNumber(number) {
  const regex = /^(?:\+256|0)7[0-9]{8}$/;
  return regex.test(number);
}

const allowedPaymentMethods = ['Cash', 'Mobile Money', 'Bank'];

const fetchSalesAndStocks = async () => {
  const sales = await Sales.find().sort({ createdAt: -1 });
  const stocks = await Stock.find();
  return { sales, stocks };
};

const renderSalesForm = async (res, fieldErrors = {}, values = {}) => {
  const { sales, stocks } = await fetchSalesAndStocks();
  return res.render('sales', {
    sales,
    stocks,
    fieldErrors,
    ...values
  });
};

function normalizeUgandanNumber(number) {
  let normalized = String(number).trim();
  if (normalized.startsWith('0')) {
    normalized = '+256' + normalized.substring(1);
  }
  return normalized;
}

function validateSaleInput(fields) {
  const {
    customerName,
    customerContact,
    paymentMethod,
    deliveryDistance,
    ownTransport,
    products,
    quantities
  } = fields;

  const errors = {};

  if (!customerName || customerName.trim().length < 3 || !/^[A-Za-z ]+$/.test(customerName.trim())) {
    errors.customerName = 'Enter a valid name (letters only, at least 3 characters).';
  }

  if (!customerContact || !isValidUgandanNumber(customerContact.trim())) {
    errors.customerContact = 'Enter a valid Ugandan number (+2567XXXXXXXX or 07XXXXXXXX).';
  }

  if (!paymentMethod || !allowedPaymentMethods.includes(paymentMethod)) {
    errors.paymentMethod = 'Select a valid payment method.';
  }

  if (!ownTransport) {
    if (deliveryDistance === '' || deliveryDistance === undefined || isNaN(Number(deliveryDistance)) || Number(deliveryDistance) < 0) {
      errors.deliveryDistance = 'Enter a valid delivery distance or select customer own transport.';
    }
  }

  const productsArray = Array.isArray(products) ? products : [products];
  const quantitiesArray = Array.isArray(quantities) ? quantities : [quantities];

  if (!productsArray.length || productsArray.every(p => !p)) {
    errors.product = 'Select at least one product.';
  }

  if (quantitiesArray.some(q => q === undefined || q === null || q === '' || isNaN(Number(q)) || Number(q) <= 0)) {
    errors.quantity = 'Quantity must be greater than zero.';
  }

  return Object.keys(errors).length > 0 ? errors : null;
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

    if (!Array.isArray(product)) {
      product = [product];
      quantity = [quantity];
    }

    const validationError = validateSaleInput({
      customerName,
      customerContact,
      paymentMethod,
      deliveryDistance,
      ownTransport,
      products: product,
      quantities: quantity
    });

    if (validationError) {
      return renderSalesForm(res, validationError, {
        customerName,
        customerContact,
        paymentMethod,
        deliveryDistance,
        ownTransport,
        product,
        quantity
      });
    }

    customerContact = normalizeUgandanNumber(customerContact);

    let items = [];
    let computedSubtotal = 0;

    for (let i = 0; i < product.length; i++) {
      if (!product[i]) continue;

      const stock = await Stock.findOne({ productname: product[i] });

      if (!stock) {
        return renderSalesForm(res, `Product not found: ${product[i]}`, {
          customerName,
          customerContact,
          paymentMethod,
          deliveryDistance,
          ownTransport,
          product,
          quantity
        });
      }

      const qty = Number(quantity[i]);

      if (qty <= 0) {
        return renderSalesForm(res, 'Quantity must be greater than zero', {
          customerName,
          customerContact,
          paymentMethod,
          deliveryDistance,
          ownTransport,
          product,
          quantity
        });
      }

      if (stock.quantity < qty) {
        return renderSalesForm(res, `Not enough stock for ${product[i]}`, {
          customerName,
          customerContact,
          paymentMethod,
          deliveryDistance,
          ownTransport,
          product,
          quantity
        });
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

    if (!items.length) {
      return renderSalesForm(res, 'Select at least one valid product with quantity.', {
        customerName,
        customerContact,
        paymentMethod,
        deliveryDistance,
        ownTransport,
        product,
        quantity
      });
    }

    let transportFee = 30000;

    if (ownTransport) {
      transportFee = 0;
    } else if (Number(deliveryDistance) <= 10 && computedSubtotal >= 500000) {
      transportFee = 0;
    }

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
    req.flash('success', 'Sale recorded successfully.');
    res.redirect('/sales');

  } catch (err) {
    console.error(err);
    try {
      const { sales, stocks } = await fetchSalesAndStocks();
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