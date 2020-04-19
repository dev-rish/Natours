const express = require('express');

const {
  getCheckoutSession,
  createBooking,
  getAllBooking,
  getBooking,
  updateBooking,
  deleteBooking
} = require('../controllers/bookingController');

const { authenticate, authorize } = require('../controllers/authController');

const router = express.Router();

router.use(authenticate);
router.get('/checkout-session/:tourId', getCheckoutSession);

router.use(authorize('admin', 'lead-guide'));

router
  .route('/')
  .get(getAllBooking)
  .post(createBooking);

router
  .route('/:id')
  .get(getBooking)
  .patch(updateBooking)
  .delete(deleteBooking);

module.exports = router;
