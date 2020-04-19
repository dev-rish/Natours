const express = require('express');

const {
  getMe,
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  uploadUserPhoto,
  resizeUserPhoto,
  deleteUser,
  updateMe,
  deleteMe
} = require('../controllers/userController');
const {
  signup,
  login,
  logout,
  forgotPassword,
  resetPassword,
  authenticate,
  authorize,
  updatePassword
} = require('../controllers/authController');

const router = express.Router();

// Will be used by the user
router.post('/signup', signup);
router.post('/login', login);
router.get('/logout', logout);
router.post('/forgotPassword', forgotPassword);
router.patch('/resetPassword/:token', resetPassword);

// Routes after this will use authenticate
router.use(authenticate);

router.patch('/updateMyPassword', updatePassword);
router.get('/me', getMe, getUser);
router.patch('/updateMe', uploadUserPhoto, resizeUserPhoto, updateMe);
router.delete('/deleteMe', deleteMe);

// Routes after this will only be authorized to admin
router.use(authorize('admin'));

// Will usually be used by admin
router
  .route('/')
  .get(getAllUsers)
  .post(createUser);

router
  .route('/:id')
  .get(getUser)
  .patch(updateUser)
  .delete(deleteUser);

module.exports = router;
