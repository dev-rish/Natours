const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const getOverview = catchAsync(async (req, res) => {
  // Get tours from DB
  const tours = await Tour.find();

  // Build template

  // Render template with Tours data
  res.status(200).render('overview', {
    title: 'All Tours',
    tours
  });
});

const getTour = catchAsync(async (req, res) => {
  // Get the slug from req
  const { slug } = req.params;
  // find tour in db and populate it with reviews too
  const tour = await Tour.findOne({ slug }).populate({
    path: 'reviews',
    fields: 'review user rating'
  });

  if (!tour) {
    throw new AppError('No tour with that name', 404);
  }
  res.status(200).render('tour', {
    title: tour.name,
    tour
  });
});

const getLoginForm = catchAsync(async (req, res) => {
  res.status(200).render('login', {
    title: 'Login'
  });
});

const getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'Your Account'
  });
};

const getMyBookings = catchAsync(async (req, res) => {
  // Find all booking for the user
  const bookings = await Booking.find({ user: req.user.id });

  // Find tours with the returned IDs
  const tourIds = bookings.map(el => el.tour);
  const tours = await Tour.find({ _id: { $in: tourIds } });

  res.status(200).render('overview', {
    title: 'My Tours',
    tours
  });
});

module.exports = {
  getOverview,
  getTour,
  getLoginForm,
  getAccount,
  getMyBookings
};
