const express    = require('express');
const router     = express.Router();
const ctrl       = require('../controllers/categorizacion-vial.controller');
const { authenticateToken, hasRole } = require('../middlewares/auth.middleware');

// Vista previa del scoring (sin autenticación rígida, solo token)
router.get('/preview',       authenticateToken, ctrl.preview);
router.get('/estadisticas',  authenticateToken, ctrl.estadisticas);

// CRUD
router.get('/',              authenticateToken, ctrl.getAll);
router.get('/:id/matriz',    authenticateToken, ctrl.exportMatriz);
router.get('/:id',           authenticateToken, ctrl.getById);
router.post('/',             authenticateToken, hasRole('admin', 'supervisor', 'encuestador'), ctrl.create);
router.put('/:id',           authenticateToken, hasRole('admin', 'supervisor'), ctrl.update);
router.delete('/:id',        authenticateToken, hasRole('admin'), ctrl.remove);

module.exports = router;
