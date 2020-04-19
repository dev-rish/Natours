const multer = require('multer');
const sharp = require('sharp');

const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const filterObject = require('../utils/filterObject');
const factory = require('./handlerFactory');

// Image processing needed hence using sharp and memory as storage
// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     // Filename - userID + Timestamp
//     const extension = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${extension}`);
//   }
// });

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

// For very simple use
// const upload = multer({ dest: 'public/img/users' });

const uploadUserPhoto = upload.single('photo');

const resizeUserPhoto = catchAsync(async (req, res, next) => {
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
  if (!req.file) return next();
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

const createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'Please use signup instead'
  });
};

const updateMe = catchAsync(async (req, res) => {
  // Check if user posts passsword
  const { password, passwordConfirm } = req.body;
  if (password || passwordConfirm) {
    throw new AppError(
      `This Route isn't for password updates. Please use /updateMyPassword`,
      400
    );
  }

  // Update user
  const updates = filterObject(req.body, 'name', 'email');
  // Get name of image if any
  if (req.file) updates.photo = req.file.filename;

  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    // Filter out unwanted fields
    updates,
    {
      new: true,
      runValidators: true
    }
  );
  res.status(201).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });
});

// Simply set 'active' field to false
const deleteMe = catchAsync(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user.id,
    // Filter out unwanted fields
    { active: false }
  );
  res.status(204).json({
    status: 'success',
    data: null
  });
});

const getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

const getAllUsers = factory.getAll(User);

const getUser = factory.getOne(User);

// CAUTION: Passwords can't be changed with it
const updateUser = factory.updateOne(User);

// Effectively delete user (admin only)
const deleteUser = factory.deleteOne(User);

module.exports = {
  getMe,
  getUser,
  getAllUsers,
  createUser,
  updateUser,
  uploadUserPhoto,
  resizeUserPhoto,
  deleteUser,
  updateMe,
  deleteMe
};
