const express = require('express');

const {
  setTourUserIds,
  getReview,
  createReview,
  getAllReviews,
  updateReview,
  deleteReview
} = require('../controllers/reviewController');

const { authenticate, authorize } = require('../controllers/authController');

// { mergeParams: true } to get access to tourId from the tour routes
const router = express.Router({ mergeParams: true });

router.use(authenticate);

router
  .route('/')
  .get(getAllReviews)
  .post(authorize('user'), setTourUserIds, createReview);

router
  .route('/:id')
  .get(getReview)
  .patch(authorize('user', 'admin'), updateReview)
  .delete(authorize('user', 'admin'), deleteReview);

module.exports = router;
