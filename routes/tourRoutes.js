const express = require('express');

const {
  createTour,
  deleteTour,
  getAllTours,
  getTour,
  getTourStats,
  getMonthlyPlan,
  getToursWithin,
  getDistances,
  aliasTopTour,
  updateTour,
  uploadTourImages,
  resizeTourImages
} = require('../controllers/tourController');

const { authenticate, authorize } = require('../controllers/authController');

const reviewRouter = require('../routes/reviewRoutes');

const router = express.Router();

// Param Middleware
// router.param('id', checkID);

router.route('/top-5-cheap').get(aliasTopTour, getAllTours);
router.route('/tour-stats').get(getTourStats);
router
  .route('/tour-within/:distance/unit/:unit/center/:latlng')
  .get(getToursWithin);
router.route('/distances/:latlng/unit/:unit').get(getDistances);

router
  .route('/monthly-plan/:year')
  .get(authenticate, authorize('admin', 'lead-guide', 'guide'), getMonthlyPlan);

// This route is related to tour hence nested routes
router.use('/:tourId/reviews', reviewRouter);
// CAUTION: Not the right way
// router
//   .route('/:tourId/reviews')
//   .post(authenticate, authorize('user'), createReview);

router
  .route('/')
  .get(getAllTours)
  .post(authenticate, authorize('admin', 'lead-guide'), createTour);

router
  .route('/:id')
  .get(getTour)
  .patch(
    authenticate,
    authorize('admin', 'lead-guide'),
    uploadTourImages,
    resizeTourImages,
    updateTour
  )
  .delete(authenticate, authorize('admin', 'lead-guide'), deleteTour);

module.exports = router;
