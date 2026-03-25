const express = require('express');
const router = express.Router();
const controller = require('../controllers/backup.controller');
const { authenticateToken, isAdmin } = require('../middlewares/auth.middleware');

router.get('/logs', authenticateToken, isAdmin, controller.listBackups);
router.post('/create', authenticateToken, isAdmin, controller.createBackup);
router.post('/restore', authenticateToken, isAdmin, controller.restoreBackup);

module.exports = router;
