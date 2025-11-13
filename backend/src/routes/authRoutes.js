const express = require('express');
const router = express.Router();
const auth = require('../controllers/authController');

router.post('/admin/login', auth.adminLogin);
router.post('/teacher/login', auth.teacherLogin);
router.post('/student/login', auth. studentLogin);

router.post('/forgot-password', auth.resetPasswordRequest);
router.post('/verify-otp', auth.verifyOtp);
router.post('/reset-password', auth.resetPassword);

module.exports = router;