
const express = require('express');
const router = express.Router();
const common = require('../controllers/commonController');
const auth = require('../middlewares/auth');
const authorise = require('../middlewares/authorise');
const fee = require('../controllers/feeController');

router.use(auth, authorise('student'));

// Fetch notices for the student
router.get('/notices', common.getNotice);

router.post('/fees/order/:paymentId', fee.createOrder);
router.post('/fees/verify', fee.verifyPayment);
router.get('/fees/my-fees', fee.getStudentFees);

router.get('/profile', common.getProfile);

module.exports = router;
