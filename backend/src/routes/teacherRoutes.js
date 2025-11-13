const express = require('express');
const router = express.Router();
const teacher = require('../controllers/teacherController');
const authorise = require('../middlewares/authorise');
const auth = require('../middlewares/auth');
const upload = require('../middlewares/multerCsv');
const notice = require('../controllers/noticeController');
const common = require('../controllers/commonController');
const feeRoutes = require('./feeRoutes');


router.use(auth, authorise('teacher'));

router.post('/students', teacher.addStudent);
router.post('/students/import', upload.single('file'), teacher.importStudentsCSV);
router.delete('/students/delete/:id', teacher.deleteStudent);
router.patch('/students/update/:id', teacher.updateStudent);
router.get('/students', teacher.getStudents);
router.post('/students/status', teacher.updateStatus);

router.post('/notices', notice.addNotice);
router.patch('/notices/:id', notice.editNotice);
router.get('/notices', common.getNotice);
router.delete('/notices/:id', notice.deleteNotice);
router.get('/notices/published', notice.getPublishedNotices);

router.get('/profile', common.getProfile);

router.use('/', feeRoutes);


module.exports = router;
