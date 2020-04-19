const express = require('express');

const {
  getOverview,
  getTour,
  getLoginForm,
  getAccount,
  getMyBookings
} = require('../controllers/viewsController');
const { isLoggedIn, authenticate } = require('../controllers/authController');
const { createBookingOnCheckout } = require('../controllers/bookingController');

const router = express.Router();

// NOTE: 'createBookingOnCheckout' is first middleware since login isn't needed since this will work only when stripe makes a success_url GET call which wouldn't have token
router.get('/', createBookingOnCheckout, isLoggedIn, getOverview);
router.get('/tour/:slug', isLoggedIn, getTour);
router.get('/login', getLoginForm);
router.get('/me', authenticate, getAccount);
router.get('/my-bookings', authenticate, getMyBookings);

module.exports = router;
