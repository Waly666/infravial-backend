const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/dashboard.controller');
const { authenticateToken, hasRole } = require('../middlewares/auth.middleware');

router.get('/stats', authenticateToken, hasRole('admin', 'supervisor'), controller.getStats);

module.exports = router;