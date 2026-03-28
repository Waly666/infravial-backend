const express = require('express');
const router = express.Router();
const { authenticateToken, isAdmin } = require('../middlewares/auth.middleware');
const controller = require('../controllers/import.controller');

router.post(
    '/excel',
    authenticateToken,
    isAdmin,
    controller.uploadExcel.single('file'),
    controller.importExcel
);
router.get('/status', authenticateToken, isAdmin, controller.getImportStatus);
router.post('/rollback-last', authenticateToken, isAdmin, controller.rollbackLastImport);

module.exports = router;
