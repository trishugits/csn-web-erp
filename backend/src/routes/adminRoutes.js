const express = require('express');
const router = express.Router();
const admin = require('../controllers/adminController');
const upload = require('../middlewares/multerCsv');
const authorise = require('../middlewares/authorise');
const auth = require('../middlewares/auth');
const notice = require("../controllers/noticeController");
const common = require("../controllers/commonController");
const feeRoutes = require('./feeRoutes');

router.use(auth, authorise('admin'));

router.post('/teachers', admin.addTeachers);
router.post('/teachers/import', upload.single('file'), admin.importTeachersCsv);
router.get('/teachers', admin.getTeachers);
router.post('/teachers/reassign', admin.reassignClasses);
router.post('/teachers/archive/:id', admin.archiveTeacher);
router.post('/teachers/unarchive/:id', admin.unarchiveTeacher);
router.post('/teachers/status', admin.updateTeacherStatus);
router.patch('/teachers/update/:id', admin.updateTeacher);
router.delete('/teachers/delete/:id', admin.deleteTeacher);

router.post('/notices', notice.addNotice);
router.patch('/notices/:id', notice.editNotice);
router.get('/notices', common.getNotice);
router.delete('/notices/:id', notice.deleteNotice);
router.get('/notices/published', notice.getPublishedNotices);

router.post('/students', admin.addStudent);
router.post('/students/import', upload.single('file'), admin.importStudentsCSV);
router.get('/students', admin.getAllStudents);
router.get('/students/classwise', admin.getStudentsClasswise); 
router.get('/students/class/:class', admin.getStudentsByClass);
router.patch('/students/update/:id', admin.updateStudent);
router.post('/students/archive/:id', admin.archiveStudent);
router.post('/students/unarchive/:id', admin.unarchiveStudent);
router.delete('/students/delete/:id', admin.deleteStudent);

router.use('/', feeRoutes);

router.get('/profile', common.getProfile);
module.exports = router;
