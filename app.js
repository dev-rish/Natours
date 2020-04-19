const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');

const AppError = require('./utils/appError');
const { globalErrorHandler } = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewsRoutes');

// Initialize express server
const app = express();

app.enable('trust-proxy');

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// MIDDLEWARE:
app.use(express.static(path.join(__dirname, 'public')));

// Enable logging in development mode
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Set Security HTTP headers
app.use(helmet());

// Limit no. of request from a certain IP
const limiter = rateLimit({
  max: 100,
  windowMs: 3600 * 1000,
  message: 'Too many requests. Please try again later!'
});
app.use('/api', limiter);

// Body parser, read data from body into req.body and limit req body size
app.use(express.json({ limit: '10kb' }));

// When data is encoded in url (like in form submit)
// app.use(express.urlencoded({ extended: true, limit: '10kb' }));

app.use(cookieParser());

// Data Sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data Sanitization against XSS
app.use(xss());

// Prevent HTTP parameter pollution i.e. duplicate parameters
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'difficulty',
      'maxGroupSize',
      'price'
    ]
  })
);

app.use(compression());
// Custom middleware
// app.use((req, res, next) => {
//   console.log(req.cookies);
//   next();
// });

// App routes
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/booking', bookingRouter);

// Undefined route handler
app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'fail',
  //   message: `Can't find ${req.originalUrl} on the server`
  // });

  // next always receives error or nothing. If passed error it will directly go to error handler
  next(new AppError(`Can't find ${req.originalUrl} on the server`, 400));
});

// Function with such signature passed in app.use will be considered global error handler by express
app.use(globalErrorHandler);

module.exports = app;
