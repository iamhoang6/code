const express = require('express');
const rateLimit = require('express-rate-limit');

const authController = require('../controller/auth.controller');
const { isAuth, loggedIn } = require('../middleware/auth.middleware');
const router = express.Router();

// Create a rate limiter for 1 request per minute
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 1, // Limit each IP to 1 request per windowMs
    message: 'Too many requests, please try again after a minute',
  });

router.use('/resend-email', limiter)

router.get('/login', isAuth, authController.login);

router.post('/login', isAuth, authController.performLogin);

router.get('/register', isAuth, authController.register);

router.post('/register', isAuth, authController.performRegister);

router.post('/changePassword', loggedIn, authController.performPasswordChange);
router.post('/changeBietDanh', loggedIn, authController.changeBietDanh);

router.get('/verify-email', loggedIn, authController.verify);
router.post('/verify-email', loggedIn, authController.verifyEmail);

router.get('/resend-mail', loggedIn, authController.resendCode);

router.get('/logout', loggedIn, authController.logout)

module.exports = router;