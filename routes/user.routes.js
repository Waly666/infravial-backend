const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/user.controller');
const { authenticateToken, isAdmin } = require('../middlewares/auth.middleware');

router.get('/',        authenticateToken, isAdmin, controller.getAll);
router.get('/:id',     authenticateToken, isAdmin, controller.getById);
router.post('/',       authenticateToken, isAdmin, controller.create);
router.put('/:id',     authenticateToken, isAdmin, controller.update);
router.delete('/:id',  authenticateToken, isAdmin, controller.remove);

module.exports = router;