/* -------------------------------------------------------------------------- */
/*                                Dependencies                                */
/* -------------------------------------------------------------------------- */
// Packages
const router = require('express').Router();

// Middlewares

// controllers
const authController = require('../controllers/auth.controller');

/* -------------------------------------------------------------------------- */
/*                                 Auth Route                                 */
/* -------------------------------------------------------------------------- */

// POST request - create new user fileUpload
router.post('/auth/register', authController.signUp);

// POST request - sign in as a user
router.post('/auth/login', authController.signIn);

// POST request - Sign in as an admin
router.post('/auth/admin/login', authController.adminSignIn);

// POST request - Send password reset link
router.post('/auth/forget-password', authController.forgotPassword);

// POST request - Send password reset link
router.post('/auth/reset-password/:token', authController.resetPassword);

module.exports = router;
