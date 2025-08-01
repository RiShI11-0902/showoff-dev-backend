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

router.get('/auth/github', authController.github);

router.get('/auth/github/callback', authController.githubCallback);

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

router.post('/auth/logout', authController.logout);

module.exports = router;
