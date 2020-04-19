const mongoose = require('mongoose');
const slugify = require('slugify');

const tourSchema = new mongoose.Schema(
  // Define the model object
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A tour name must have 40 or less characters'],
      minlength: [10, 'A tour name must have at least 10 characters']
      // validate: [validator.isAlpha, 'Tour name must only contain letters']
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration']
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size']
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium, difficult'
      }
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      set: val => val.toFixed(2)
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    rating: {
      type: Number,
      default: 4.5
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price']
    },
    priceDiscount: {
      type: Number,
      // CAUTION: Would only work on new doc creation
      validate: {
        message: 'Discount price ({VALUE}) should be less than regular price',
        validator: function(val) {
          return val <= this.price;
        }
      }
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description']
    },
    description: {
      type: String,
      trim: true
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image']
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false
    },
    startLocation: {
      // GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      address: String,
      description: String
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
      }
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
      }
    ]
  },
  // Options
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// SINGE FIELD INDEX
// +1 means asc. order
// tourSchema.index({ price: 1 });

// COMPOUND FIELD INDEX
// -1 means desc. order
tourSchema.index({ price: 1, ratingsAverage: -1 });

tourSchema.index({ slug: 1 });

// for geospatial field it different!(earth is a sphere)
tourSchema.index({ startLocation: '2dsphere' });

// Cant be used in queries
tourSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7;
});

// define vitual property here.(being populated in getTour)
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id'
});

// DOCUMENT MIDDLEWARE: Points to current document
//runs before .save() and .create() not .insertMany(), .update()
tourSchema.pre('save', function(next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// QUERY MIDDLEWARE: Points to current query
// Regex to execute for all types of find query
tourSchema.pre(/^find/, function(next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

// Populate 'guides' field in each tour
tourSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'guides',
    // remove unwanted fields
    select: '-__v -passwordChangedAt'
  });
  next();
});

// AGGREGATION MIDDLEWARE
tourSchema.pre('aggregate', function(next) {
  // filter out non-secret tours
  // this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  next();
});

// If guides were embedded
// tourSchema.pre('save', async function(next) {
//   const guidesPromises = this.guides.map(async id => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });

// REFRENCE
// tourSchema.post('save', function(doc, next) {
//   console.log(doc);
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
