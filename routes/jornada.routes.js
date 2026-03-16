const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/jornada.controller');
const { authenticateToken, isAdmin } = require('../middlewares/auth.middleware');

router.get('/',                authenticateToken,          controller.getAll);
router.get('/activa',          authenticateToken,          controller.getActiva);
router.post('/',               authenticateToken, isAdmin, controller.create);
router.put('/:id/finalizar',   authenticateToken, isAdmin, controller.finalizar);
router.put('/:id',             authenticateToken, isAdmin, controller.update);

module.exports = router;