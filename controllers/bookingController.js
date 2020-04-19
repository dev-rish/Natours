const stripe = require('stripe')(process.env.STRIPE_SECRET_API_KEY);

const Tour = require('../models/tourModel');
const User = require('../models/userModel');
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
    // NOTE: was just a temp. workaround until the site wasn't deployed. Not secure since url can be hit directly and hence the webhooks
    // success_url: `${req.protocol}://${req.get('host')}?tour=${
    //   req.params.tourId
    // }&user=${req.user.id}&price=${tour.price}`,
    success_url: `${req.protocol}://${req.get('host')}/my-bookings`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    // Will be used in webhook
    client_reference_id: req.params.tourId,
    line_items: [
      {
        name: `${tour.name} Tour`,
        description: tour.summary,
        images: [
          `${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}`
        ],
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

// NOTE: was just a temp. workaround until the site wasn't deployed
// const createBookingOnCheckout = catchAsync(async (req, res, next) => {
//   const { tour, user, price } = req.query;
//   // i.e. if homepage is after checkout
//   if (tour && user && price) {
//     await Booking.create({ tour, user, price });
//     res.redirect(req.originalUrl.split('?')[0]);
//   } else {
//     next();
//   }
// });

const createBookingOnCheckout = async session => {
  const tour = session.client_reference_id;
  const user = (await User.find({ email: session.customer_email })).id;
  const price = session.line_items[0].amount / 100;
  await Booking.create({ tour, user, price });
};

const webhookCheckout = (req, res, next) => {
  let event;
  try {
    const signature = req.header['stripe-signature'];
    // Raw req.body
    event = stripe.webhooks.constructEvent(
      res.body,
      signature,
      process.env.STRIPE_SECRET_WEBHOOK
    );
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  // Just to be sure
  if (event.type === 'checkout.session.completed') {
    this.createBookingOnCheckout(event.data.object);
  }

  res.status(200).json({ received: true });
};

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
  createBookingOnCheckout,
  webhookCheckout
};
