const express = require('express');

const {
  alerts,
  getOverview,
  getTour,
  getLoginForm,
  getSignupForm,
  getAccount,
  getMyBookings
} = require('../controllers/viewsController');
const { isLoggedIn, authenticate } = require('../controllers/authController');

const router = express.Router();

// to detect any alert that may need to be generated
router.use(alerts);

// NOTE: 'createBookingOnCheckout' is first middleware since login isn't needed since this will work only when stripe makes a success_url GET call which wouldn't have token
router.get('/', isLoggedIn, getOverview);
router.get('/tour/:slug', isLoggedIn, getTour);
router.get('/login', getLoginForm);
router.get('/signup', getSignupForm);
router.get('/me', authenticate, getAccount);
router.get('/my-bookings', authenticate, getMyBookings);

module.exports = router;
