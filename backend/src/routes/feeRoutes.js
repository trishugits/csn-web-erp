const express = require('express');
const router = express.Router();
const fee = require('../controllers/feeController');
const auth = require('../middlewares/auth');
const authorise = require('../middlewares/authorise');

router.post('/fee-structure', fee.createFeeStructure);
router.get('/fee-structure', fee.getFeeStructure);
router.patch('/fee-structure/:id', fee.updateFeeStructure);
router.delete('/fee-structure/:id', fee.deleteFeeStructure);

router.post('/fees/create-period', fee.createPaymentsForPeriod);
router.post('/fees/create-single', fee.createPaymentForStudent);
router.post('/fees/mark-paid', fee.markFeeAsPaid);
router.get('/fees/tracking', fee.getPaymentTracking);
router.get('/fees/class/:class', fee.getClassFees);
router.get('/fees/student/:studentId', fee.getStudentFees);

router.post('/fees/order/:paymentId', fee.createOrder);
router.post('/fees/verify', fee.verifyPayment);

router.get('/fees/summary', fee.getFeeSummary);
router.get('/fees/reports/:class/:session/:period', fee.downloadReport);

// Admin-specific routes
router.get('/fees/admin/dashboard', fee.getAdminDashboardSummary);
router.get('/fees/admin/class-report', fee.getClassWiseReport);
router.get('/fees/admin/all-classes', fee.getAllClassesWithFees);
router.post('/fees/admin/bulk-mark-paid', fee.bulkMarkAsPaid);
router.get('/fees/admin/payment-records', fee.getPaymentRecordsByDate);
router.get('/fees/admin/export-records', fee.exportPaymentRecords);
router.get('/fees/admin/search-class-report', fee.searchClassReport);

module.exports = router;
