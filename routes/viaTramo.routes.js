const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/viaTramo.controller');
const { authenticateToken, hasRole } = require('../middlewares/auth.middleware');
const { checkJornada } = require('../middlewares/jornada.middleware');

router.get('/estadisticas', authenticateToken, hasRole('admin', 'supervisor'), controller.getEstadisticas);
router.get('/',       authenticateToken,                                          controller.getAll);
/* Antes de /:id para que "inventario" no se tome como ObjectId */
router.get('/:id/inventario', authenticateToken, controller.getInventario);
router.get('/:id',    authenticateToken,                                          controller.getById);
router.post('/',      authenticateToken, hasRole('admin','supervisor','encuestador'), checkJornada, controller.create);
router.put('/:id',    authenticateToken, hasRole('admin','supervisor','encuestador'), checkJornada, controller.update);
router.delete('/:id', authenticateToken, hasRole('admin','supervisor'),               controller.remove);

module.exports = router;