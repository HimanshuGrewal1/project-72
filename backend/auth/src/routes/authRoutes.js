const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateSignup, validateLogin, validateRefresh } = require('../middleware/validateRequest');
const authenticate = require('../middleware/authenticate');

// Public routes
router.post('/signup', validateSignup, authController.signup);
router.post('/signupf', authController.signupf);
router.post('/login', validateLogin, authController.login);
router.post('/refresh', validateRefresh, authController.refresh);

// Protected routes
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getMe);

module.exports = router;