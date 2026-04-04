const express = require('express');
const router  = express.Router();
const { authenticateToken, isAdmin } = require('../middlewares/auth.middleware');
const ctrl = require('../controllers/data-transfer.controller');

// Opciones de filtros (departamentos, municipios, jornadas)
router.get('/opciones', authenticateToken, isAdmin, ctrl.getOpciones);

// Iniciar exportación → devuelve { jobId }
router.post('/export/start', authenticateToken, isAdmin, ctrl.startExport);

// Iniciar importación → sube ZIP, devuelve { jobId }
router.post('/import/start', authenticateToken, isAdmin, ctrl.uploadZip.single('file'), ctrl.startImport);

// Progreso SSE → auth por query ?token= (EventSource no soporta headers)
router.get('/progress/:jobId', ctrl.getProgress);

// Descargar ZIP generado
router.get('/export/download/:jobId', authenticateToken, isAdmin, ctrl.downloadExport);

module.exports = router;
