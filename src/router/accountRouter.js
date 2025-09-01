const express = require('express');
const router = express.Router();
const accountController = require('../controller/accountController');
const { authenticate } = require('../middleware/jwtMiddleware');

router.post('/v1/user/register', accountController.registerUser);
router.post('/api/token', accountController.login);
router.post('/v1/user/verify-otp', accountController.verifyOtp);
router.post('/v1/user/resend-otp', accountController.resendOtp);
router.get('/v1/user/profile', authenticate, accountController.getProfifleUser);
router.get('/v1/user/display-profile', authenticate, accountController.displayUserProfile);

module.exports = router;