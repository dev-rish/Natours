const stripe = require('stripe')(process.env.STRIPE_SECRET_API_KEY);

const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

const getCheckoutSession = catchAsync(async (req, res) => {
  // Get the currently booked tour
  const tour = await Tour.findById(req.params.tourId);

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    // CAUTION: Not secure since url can be hit directly and hence the webhooks
    success_url: `${req.protocol}://${req.get('host')}?tour=${
      req.params.tourId
    }&user=${req.user.id}&price=${tour.price}`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        name: `${tour.name} Tour`,
        description: tour.summary,
        images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
        amount: tour.price * 100,
        currency: 'inr',
        quantity: 1
      }
    ]
  });

  // Create session as response
  res.status(200).json({
    status: 'success',
    session
  });
});

const createBookingOnCheckout = catchAsync(async (req, res, next) => {
  const { tour, user, price } = req.query;
  // i.e. if homepage is after checkout
  if (tour && user && price) {
    await Booking.create({ tour, user, price });
    res.redirect(req.originalUrl.split('?')[0]);
  } else {
    next();
  }
});

const createBooking = factory.createOne(Booking);
const getBooking = factory.getOne(Booking);
const getAllBooking = factory.getAll(Booking);
const updateBooking = factory.updateOne(Booking);
const deleteBooking = factory.deleteOne(Booking);

module.exports = {
  createBooking,
  getBooking,
  getAllBooking,
  updateBooking,
  deleteBooking,
  getCheckoutSession,
  createBookingOnCheckout
};
