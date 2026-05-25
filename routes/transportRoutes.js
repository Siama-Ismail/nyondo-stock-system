const express = require('express');
const router = express.Router();

const Transport = require('../models/Transport');


// =========================
// TRANSPORT DASHBOARD
// =========================
router.get('/transport', async (req, res) => {
  try {

    const deliveries = await Transport.find().sort({ createdAt: -1 });

    const active = await Transport.countDocuments({ status: 'ACTIVE' });
    const pending = await Transport.countDocuments({ status: 'PENDING' });
    const completed = await Transport.countDocuments({ status: 'COMPLETED' });

    res.render('transport', {
      deliveries,
      stats: {
        active,
        pending,
        completed,
        fleet: 8
      }
    });

  } catch (err) {
    console.log(err);
    res.status(500).send('Server Error');
  }
});


// =========================
// CREATE DELIVERY
// =========================
router.post('/transport/add', async (req, res) => {
  try {

    const { customer, vehicle, driver, deliveryDate, eta } = req.body;

    const count = await Transport.countDocuments();

    await Transport.create({
      deliveryNumber: `DL${10000 + count + 1}`,
      customer,
      vehicle,
      driver,
      deliveryDate,
      eta
    });

    res.redirect('/transport');

  } catch (err) {
    console.log(err);
    res.status(500).send('Error creating delivery');
  }
});


// =========================
// UPDATE STATUS
// =========================
router.post('/transport/status/:id', async (req, res) => {
  try {

    await Transport.findByIdAndUpdate(req.params.id, {
      status: req.body.status
    });

    res.redirect('/transport');

  } catch (err) {
    console.log(err);
    res.status(500).send('Error updating status');
  }
});


// =========================
// DELETE DELIVERY
// =========================
router.post('/transport/delete/:id', async (req, res) => {
  try {

    await Transport.findByIdAndDelete(req.params.id);

    res.redirect('/transport');

  } catch (err) {
    console.log(err);
    res.status(500).send('Error deleting delivery');
  }
});

module.exports = router;