const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/controlSem.controller');
const { authenticateToken, hasRole } = require('../middlewares/auth.middleware');
const { checkJornada } = require('../middlewares/jornada.middleware');

router.get('/',       authenticateToken,                                              controller.getAll);
/* Debe ir antes de /:id para que "tramo" no se interprete como id */
router.get('/tramo/:idViaTramo', authenticateToken, controller.getByTramo);
router.get('/:id',    authenticateToken,                                              controller.getById);
router.post('/',      authenticateToken, hasRole('admin','supervisor','encuestador'), checkJornada, controller.create);
router.put('/:id',    authenticateToken, hasRole('admin','supervisor','encuestador'), checkJornada, controller.update);
router.delete('/:id', authenticateToken, hasRole('admin','supervisor'),               controller.remove);

module.exports = router;