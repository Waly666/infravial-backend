const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/audit.controller');
const { authenticateToken, isAdmin } = require('../middlewares/auth.middleware');

router.get('/',             authenticateToken, isAdmin, controller.getAll);
router.get('/user/:userId', authenticateToken, isAdmin, controller.getByUser);

module.exports = router;
