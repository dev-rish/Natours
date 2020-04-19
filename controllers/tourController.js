const multer = require('multer');
const sharp = require('sharp');

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Tour = require('../models/tourModel');

const factory = require('./handlerFactory');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Uploaded file is not an image! Try again', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

const uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 }
]);

const resizeTourImages = catchAsync(async (req, res, next) => {
  if (req.files.imageCover && req.files.images) {
    // Cover Image
    req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;

    await sharp(req.files.imageCover[0].buffer)
      .resize(2000, 1333)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(`public/img/tours/${req.body.imageCover}`);

    // Rest of the Images

    // Create array for rest three
    req.body.images = [];

    const imgPromises = req.files.images.map(async (file, index) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${index + 1}.jpeg`;
      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);

      req.body.images.push(filename);
    });

    await Promise.all(imgPromises);
  }
  next();
});

// const resizeUserPhoto = catchAsync(async (req, res, next) => {
//   req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
//   if (!req.file) return next();
//   await sharp(req.file.buffer)
//     .resize(500, 500)
//     .toFormat('jpeg')
//     .jpeg({ quality: 90 })
//     .toFile(`public/img/users/${req.file.filename}`);
//   next();
// });

const getAllTours = factory.getAll(Tour);

const getTour = factory.getOne(Tour, { path: 'reviews' });

const aliasTopTour = (req, res, next) => {
  req.query.limit = 5;
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

const getTourStats = catchAsync(async (req, res) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } }
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        toursCount: { $sum: 1 },
        ratingsCount: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    },
    {
      $sort: { avgPrice: 1 }
    }
    // Can repeat stages
    // {
    //   $match: { _id: { $ne: 'EASY' } }
    // }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats
    }
  });
});

const getMonthlyPlan = catchAsync(async (req, res) => {
  const year = req.params.year * 1;

  const plan = await Tour.aggregate([
    // Produce doc for each start date
    {
      $unwind: '$startDates'
    },
    // List doc with date in the range
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    // Group tours by start date and push names in tours array
    {
      $group: {
        _id: { $month: '$startDates' },
        tourStartCount: { $sum: 1 },
        tours: { $push: '$name' }
      }
    },
    // Add month field
    {
      $addFields: { month: '$_id' }
    },
    // remove _id
    {
      $project: { _id: 0 }
    },
    // Sort in desc order
    {
      $sort: { tourStartCount: -1 }
    },
    // 12 results at a time
    {
      $limit: 12
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      plan
    }
  });
});

// '/tour-within/:distance/unit/:unit/center/:latlng'
// '/tour-within/223/unit/mi/center/34.111,-118.346'
const getToursWithin = catchAsync(async (req, res) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  if (!lat || !lng) {
    throw new AppError(
      'Please specify latitude and longitude in the format lat,lng',
      400
    );
  }

  // convert distance to radians (divide by radius of earth) for mongo
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  // Specify lng then lat
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours
    }
  });
});

const getDistances = catchAsync(async (req, res) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  if (!lat || !lng) {
    throw new AppError(
      'Please specify latitude and longitude in the format lat,lng',
      400
    );
  }

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  const distances = await Tour.aggregate([
    // $geoNear is the only one available for geospatial data and should be the first
    // takes in only indexed field
    {
      $geoNear: {
        // Starting point
        near: {
          type: 'Point',
          // convert lat lng to number
          coordinates: [lng * 1, lat * 1]
        },
        distanceField: 'distance',
        // for conversion from m to mi/km
        distanceMultiplier: multiplier
      }
    },
    // remove unwanted fields
    {
      $project: {
        distance: { $trunc: ['$distance', 3] },
        name: 1
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: distances
    }
  });
});

const createTour = factory.createOne(Tour);

const updateTour = factory.updateOne(Tour);

const deleteTour = factory.deleteOne(Tour);

module.exports = {
  getAllTours,
  getTour,
  getMonthlyPlan,
  getToursWithin,
  getDistances,
  uploadTourImages,
  resizeTourImages,
  aliasTopTour,
  createTour,
  updateTour,
  deleteTour,
  getTourStats
};
