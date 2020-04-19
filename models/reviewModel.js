const mongoose = require('mongoose');
const Tour = require('../models/tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty']
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour']
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user']
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// To make combination of fields unique hence prevent duplicate reviews by a user on a tour
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// Multiple populates
reviewSchema.pre(/^find/, function(next) {
  this
    // removed it to remove chaining
    // .populate({
    //   path: 'tour',
    //   select: 'name'
    // })
    .populate({
      path: 'user',
      select: 'name photo'
    });
  next();
});

reviewSchema.statics.calcAverageRatings = async function(tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId }
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);

  if (stats.length) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5
    });
  }
};

// Storing results from above aggregation. ('pre' also works)
// reviewSchema.pre('save', function(next) {
reviewSchema.post('save', function() {
  // Can't be used since 'Review' is defined only later
  // Review.calcAverageRatings
  // hence,
  this.constructor.calcAverageRatings(this.tour);
});

reviewSchema.post(/^findOneAnd/, async function(review, next) {
  // Check if valid Id in delete operation else review is null
  if (review) {
    review.constructor.calcAverageRatings(review.tour);
  }
  next();
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
