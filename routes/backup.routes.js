const express = require('express');
const router = express.Router();
const controller = require('../controllers/backup.controller');
const { authenticateToken, isAdmin } = require('../middlewares/auth.middleware');

router.get('/logs', authenticateToken, isAdmin, controller.listBackups);
router.post('/create', authenticateToken, isAdmin, controller.createBackup);
router.post('/restore', authenticateToken, isAdmin, controller.restoreBackup);
router.get('/download/:archivo', authenticateToken, isAdmin, controller.downloadBackup);
router.post(
    '/restore-upload',
    authenticateToken,
    isAdmin,
    controller.uploadRestore.single('file'),
    controller.restoreBackupUpload
);
router.post('/purge', authenticateToken, isAdmin, controller.purgeDatabase);

module.exports = router;
