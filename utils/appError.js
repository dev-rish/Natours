class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    // This prevents it from getting AppError into the stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
