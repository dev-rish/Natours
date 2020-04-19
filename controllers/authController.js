const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

const generateToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE_TIME
  });
};

const createSendJwt = (user, statusCode, req, res) => {
  const token = generateToken(user._id);
  const expires = new Date(
    Date.now() + process.env.JWT_COOKIE_EXPIRE_TIME * 24 * 60 * 60 * 1000
  );

  const cookieOptions = {
    expires,
    // Cookie can be accessed or modified by browser
    httpOnly: true,
    // Cookie will only be sent on secure conn.
    // 'x-forwarded-proto' is specific to heroku
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https'
  };

  res.cookie('jwt', token, cookieOptions);

  // Remove password from res josn
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

const signup = catchAsync(async (req, res) => {
  const {
    name,
    email,
    password,
    passwordConfirm,
    passwordChangedAt
  } = req.body;

  const newUser = await User.create({
    name,
    email,
    password,
    passwordConfirm,
    passwordChangedAt
  });

  const url = `${req.protocol}://${req.get('host')}/me`;

  // await new Email(newUser, url).sendWelcome();

  createSendJwt(newUser, 201, req, res);
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  // Check if email & password exist
  if (!email || !password) {
    throw new AppError('Please provide email and password', 400);
  }
  // Check if user exist and if password correct
  // Select password back as => select: false in model
  const user = await User.findOne({ email }).select('+password');

  const isValid = user && (await bcrypt.compare(password, user.password));

  // Keep it vague hence combine error
  if (!user || !isValid) {
    throw new AppError('Invalid email or password', 401);
  }
  // Send jwt
  createSendJwt(user, 200, req, res);
});

// Only for rendered pages
const isLoggedIn = catchAsync(async (req, res, next) => {
  // Check if token is present
  try {
    if (req.cookies.jwt) {
      const decoded = jwt.verify(req.cookies.jwt, process.env.JWT_SECRET);

      // Also check if user exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) return next();

      // Check if user changed password after the token was issued
      if (
        // Check if user changed password
        currentUser.passwordChangedAt &&
        // Check if token issued after password was changed
        !(currentUser.passwordChangedAt.getTime() < decoded.iat * 1000)
      ) {
        return next();
      }

      // There is a valid logged in user
      res.locals.user = currentUser;
    }
  } catch (err) {
    // Block executes for invalid jwt set on logout
    // Nothing to be done here
  }
  next();
});

const authenticate = catchAsync(async (req, res, next) => {
  // Check if token is present
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    throw new AppError('Please login first!', 401);
  }

  // Validate token
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // Also check if user exists
  const user = await User.findById(decoded.id);
  if (!user) throw new AppError('The user no longer exists');

  // Check if user changed password after the token was issued
  if (
    // Check if user changed password
    user.passwordChangedAt &&
    // Check if token issued after password was changed
    !(user.passwordChangedAt.getTime() < decoded.iat * 1000)
  ) {
    throw new AppError('Password changed. Please login again!', 401);
  }

  // Grant access to protected route
  req.user = user;
  res.locals.user = user;
  next();
});

// Restrict access to sensitive routes
// Wrap function so as for it to get accepted for a middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new AppError(
        'You do not have permission to perform this action!',
        403
      );
    }
    next();
  };
};

const logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 1000),
    httpOnly: true
  });
  // no need to set secure: true since cookie has no sensitive data
  res.status(200).json({ status: 'success' });
};

const forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    throw new AppError('Please provide email', 400);
  }
  // Get user from the email
  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError('No user with that email', 404);
  }
  // Generate the random reset token
  const resetToken = user.createResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  try {
    // Send the email to user
    const resetUrl = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/user/resetPassword/${resetToken}`;

    // await new Email(user, resetUrl).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Password reset link sent to email'
    });
  } catch (e) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    next(
      new AppError('Error sending password rest email. Try again later!', 500)
    );
  }
};

const resetPassword = catchAsync(async (req, res) => {
  // Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  // user with token and valid token i.e. not expired token
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  // Check if there is user and token not expired
  if (!user) {
    throw new AppError('Reset link has expired!', 400);
  }

  // Update the user, password, passwordChangedAt property
  const { password, passwordConfirm } = req.body;
  user.password = password;
  user.passwordConfirm = passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // Log the user in and send JWT
  createSendJwt(user, 200, req, res);
});

const updatePassword = catchAsync(async (req, res) => {
  const { oldPassword, newPassword, newPasswordConfirm } = req.body;

  // Get user from db
  const user = await User.findById(req.user.id).select('+password');

  // Check if old password is correct
  const isCorrectPassword = await bcrypt.compare(oldPassword, user.password);
  if (!isCorrectPassword) {
    throw new AppError('Old Password is incorrect!', 401);
  }

  // Update password
  user.password = newPassword;
  user.passwordConfirm = newPasswordConfirm;
  await user.save();
  // Log user in i.e. send token
  createSendJwt(user, 200, req, res);
});

module.exports = {
  signup,
  login,
  isLoggedIn,
  logout,
  forgotPassword,
  resetPassword,
  updatePassword,
  authenticate,
  authorize
};
