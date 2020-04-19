const AppError = require('../utils/appError');

const handleIdCastError = err => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};
const handleDuplicateFieldsError = err => {
  // Extract name from errmsg
  // "errmsg": "E11000 duplicate key error collection: natours-test.tours index: name_1 dup key: { name: \"The Test Tour\" }"
  const value = err.errmsg.substring(
    err.errmsg.indexOf('"'),
    err.errmsg.lastIndexOf('"') + 1
  );

  const message = `Duplicate field value: ${value}. Please use nother value!`;
  return new AppError(message, 400);
};
const handleValidationError = err => {
  // Fetch error msg for various fields
  const errors = Object.values(err.errors).map(el => el.message);
  // Combine all error msgs
  const message = `Invalid input data. ${errors.join('. ')}.`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid token. Please login again!', 401);

const handleJWTExpireError = () =>
  new AppError('You have been logged out. Please login again!', 401);

const sendErrorDev = (err, req, res) => {
  // API
  if (req.originalUrl.startsWith('/api')) {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  }
  // Render Page
  else {
    res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message
    });
  }
};

const sendErrorProd = (err, req, res) => {
  // API
  if (req.originalUrl.startsWith('/api')) {
    // Operational error: send msg to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    }
    // Programming or any other error: dont leak error details

    // Log the error
    console.error('ERROR 🎇', err);

    // Send generic message
    return res.status(500).json({
      status: 'error',
      message: 'Something went wrong!'
    });
  }
  // Render Page
  if (err.isOperational) {
    res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message
    });
  } else {
    res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: 'Please try again later.'
    });
  }
};

const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    // Make a copy of err
    let error = { message: err.message, ...err };

    // Conver Errors to AppError
    if (error.name === 'CastError') {
      error = handleIdCastError(error);
    }
    if (error.code === 11000) {
      error = handleDuplicateFieldsError(error);
    }
    if (error.name === 'ValidationError') {
      error = handleValidationError(error);
    }
    if (error.name === 'JsonWebTokenError') {
      error = handleJWTError();
    }
    if (error.name === 'TokenExpiredError') {
      error = handleJWTExpireError();
    }
    sendErrorProd(error, req, res);
  }
};

module.exports = { globalErrorHandler };
