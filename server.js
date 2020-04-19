const dotenv = require('dotenv');
const mongoose = require('mongoose');

// This should be at the top
process.on('uncaughtException', err => {
  console.log('UNCAUGHT EXCEPTION🎆🎆🎆. Shutting down server....');
  if (process.env.NODE_ENV === 'development') {
    console.log(err);
  } else {
    console.log(err.name, ':', err.message);
  }

  // 1 means uncaught error
  process.exit(1);
});

// First set the environment vars and then require & run the app.js
dotenv.config({ path: './config.env' });

const app = require('./app');

// console.log(process.env);

let dbUri;
if (process.env.NODE_ENV === 'development') {
  dbUri = process.env.DEV_DATABASE_URI;
} else {
  dbUri = process.env.PROD_DATABASE_URI.replace(
    '<PASSWORD>',
    process.env.DATABASE_PASSWORD
  );
}

// ========Temporary============================
// dbUri = process.env.PROD_DATABASE_URI.replace(
//   '<PASSWORD>',
//   process.env.DATABASE_PASSWORD
// );
// =============================================
mongoose
  .connect(dbUri, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  })
  .then(() => console.log(`${process.env.NODE_ENV} connections success`));

// Start server
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log('App running on port', port);
});

process.on('unhandledRejection', err => {
  console.log('UNHANDLED REJECTION🎆🎆🎆. Shutting down server....');

  if(process.env.NODE_ENV === 'production') {

    console.log(err.name, ':', err.message);
  } else {
    console.log(err)
  }

  // Wait for any pending request to finish and then close
  server.close(() => {
    // 1 means uncaught error
    process.exit(1);
  });
});

process.on('SIGTERM', () => {
  console.log('SIGTERM Received🥱🥱');
  server.close(() => {
    console.log('🧨🧨Process Terminated');
  });
});
