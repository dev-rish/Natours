const Review = require('../models/reviewModel');
const factory = require('./handlerFactory');

const setTourUserIds = (req, res, next) => {
  // Make it optional for user to pass IDs in req body
  // IDs will be fetched from req body else from req object itself
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;

  next();
};

const getReview = factory.getOne(Review);

const createReview = factory.createOne(Review);

const getAllReviews = factory.getAll(Review);

const updateReview = factory.updateOne(Review);

const deleteReview = factory.deleteOne(Review);

module.exports = {
  setTourUserIds,
  getReview,
  createReview,
  getAllReviews,
  updateReview,
  deleteReview
};
