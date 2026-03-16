const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/catalogo.controller');
const { authenticateToken, isAdmin } = require('../middlewares/auth.middleware');
const {
    uploadCatEsquema,
    uploadCatSenVert,
    uploadCatUbicSenHor,
    uploadCatDemarcacion
} = require('../middlewares/upload.middleware');

// ── DIVIPOL ──────────────────────────────────────────
router.get('/divipol',          authenticateToken,          controller.divipol.getAll);
router.get('/divipol/buscar',   authenticateToken,          controller.divipol.buscar);
router.get('/divipol/:id',      authenticateToken,          controller.divipol.getById);
router.post('/divipol',         authenticateToken, isAdmin, controller.divipol.create);
router.put('/divipol/:id',      authenticateToken, isAdmin, controller.divipol.update);
router.delete('/divipol/:id',   authenticateToken, isAdmin, controller.divipol.remove);

// ── ESQUEMA PERFIL ───────────────────────────────────
router.get('/esquema-perfil',        authenticateToken,          controller.esquemaPerfil.getAll);
router.get('/esquema-perfil/:id',    authenticateToken,          controller.esquemaPerfil.getById);
router.post('/esquema-perfil',       authenticateToken, isAdmin, uploadCatEsquema.single('imagen'), controller.esquemaPerfil.create);
router.put('/esquema-perfil/:id',    authenticateToken, isAdmin, uploadCatEsquema.single('imagen'), controller.esquemaPerfil.update);
router.delete('/esquema-perfil/:id', authenticateToken, isAdmin, controller.esquemaPerfil.remove);

// ── SEÑALES VERTICALES CATÁLOGO ──────────────────────
router.get('/sen-vert',        authenticateToken,          controller.senVert.getAll);
router.get('/sen-vert/:id',    authenticateToken,          controller.senVert.getById);
router.post('/sen-vert',       authenticateToken, isAdmin, uploadCatSenVert.single('imagen'), controller.senVert.create);
router.put('/sen-vert/:id',    authenticateToken, isAdmin, uploadCatSenVert.single('imagen'), controller.senVert.update);
router.delete('/sen-vert/:id', authenticateToken, isAdmin, controller.senVert.remove);

// ── UBICACIÓN SEÑALES HORIZONTALES ──────────────────
router.get('/ubic-sen-hor',        authenticateToken,          controller.ubicSenHor.getAll);
router.get('/ubic-sen-hor/:id',    authenticateToken,          controller.ubicSenHor.getById);
router.post('/ubic-sen-hor',       authenticateToken, isAdmin, uploadCatUbicSenHor.single('imagen'), controller.ubicSenHor.create);
router.put('/ubic-sen-hor/:id',    authenticateToken, isAdmin, uploadCatUbicSenHor.single('imagen'), controller.ubicSenHor.update);
router.delete('/ubic-sen-hor/:id', authenticateToken, isAdmin, controller.ubicSenHor.remove);

// ── DEMARCACIONES ────────────────────────────────────
router.get('/demarcaciones',        authenticateToken,          controller.demarcacion.getAll);
router.get('/demarcaciones/:id',    authenticateToken,          controller.demarcacion.getById);
router.post('/demarcaciones',       authenticateToken, isAdmin, uploadCatDemarcacion.single('imagen'), controller.demarcacion.create);
router.put('/demarcaciones/:id',    authenticateToken, isAdmin, uploadCatDemarcacion.single('imagen'), controller.demarcacion.update);
router.delete('/demarcaciones/:id', authenticateToken, isAdmin, controller.demarcacion.remove);

// ── OBSERVACIONES VIA TRAMOS ─────────────────────────
router.get('/obs-vias',        authenticateToken,          controller.observacionVia.getAll);
router.get('/obs-vias/:id',    authenticateToken,          controller.observacionVia.getById);
router.post('/obs-vias',       authenticateToken, isAdmin, controller.observacionVia.create);
router.put('/obs-vias/:id',    authenticateToken, isAdmin, controller.observacionVia.update);
router.delete('/obs-vias/:id', authenticateToken, isAdmin, controller.observacionVia.remove);

// ── OBSERVACIONES SEÑALES VERTICALES ─────────────────
router.get('/obs-sv',        authenticateToken,          controller.observacionSV.getAll);
router.get('/obs-sv/:id',    authenticateToken,          controller.observacionSV.getById);
router.post('/obs-sv',       authenticateToken, isAdmin, controller.observacionSV.create);
router.put('/obs-sv/:id',    authenticateToken, isAdmin, controller.observacionSV.update);
router.delete('/obs-sv/:id', authenticateToken, isAdmin, controller.observacionSV.remove);

// ── OBSERVACIONES SEÑALES HORIZONTALES ───────────────
router.get('/obs-sh',        authenticateToken,          controller.observacionSH.getAll);
router.get('/obs-sh/:id',    authenticateToken,          controller.observacionSH.getById);
router.post('/obs-sh',       authenticateToken, isAdmin, controller.observacionSH.create);
router.put('/obs-sh/:id',    authenticateToken, isAdmin, controller.observacionSH.update);
router.delete('/obs-sh/:id', authenticateToken, isAdmin, controller.observacionSH.remove);

// ── OBSERVACIONES SEMÁFOROS ──────────────────────────
router.get('/obs-semaforos',        authenticateToken,          controller.obsSemaforo.getAll);
router.get('/obs-semaforos/:id',    authenticateToken,          controller.obsSemaforo.getById);
router.post('/obs-semaforos',       authenticateToken, isAdmin, controller.obsSemaforo.create);
router.put('/obs-semaforos/:id',    authenticateToken, isAdmin, controller.obsSemaforo.update);
router.delete('/obs-semaforos/:id', authenticateToken, isAdmin, controller.obsSemaforo.remove);

// ── ZATs ─────────────────────────────────────────────
router.get('/zats',        authenticateToken,          controller.zat.getAll);
router.get('/zats/:id',    authenticateToken,          controller.zat.getById);
router.post('/zats',       authenticateToken, isAdmin, controller.zat.create);
router.put('/zats/:id',    authenticateToken, isAdmin, controller.zat.update);
router.delete('/zats/:id', authenticateToken, isAdmin, controller.zat.remove);

// ── COMUNAS ──────────────────────────────────────────
router.get('/comunas',        authenticateToken,          controller.comuna.getAll);
router.get('/comunas/:id',    authenticateToken,          controller.comuna.getById);
router.post('/comunas',       authenticateToken, isAdmin, controller.comuna.create);
router.put('/comunas/:id',    authenticateToken, isAdmin, controller.comuna.update);
router.delete('/comunas/:id', authenticateToken, isAdmin, controller.comuna.remove);

// ── BARRIOS ───────────────────────────────────────────
router.get('/barrios',        authenticateToken,          controller.barrio.getAll);
router.get('/barrios/:id',    authenticateToken,          controller.barrio.getById);
router.post('/barrios',       authenticateToken, isAdmin, controller.barrio.create);
router.put('/barrios/:id',    authenticateToken, isAdmin, controller.barrio.update);
router.delete('/barrios/:id', authenticateToken, isAdmin, controller.barrio.remove);

// ── PREGUNTAS ENCUESTA VIAL ───────────────────────────
router.get('/preguntas-enc',        authenticateToken,          controller.preguntaEncVia.getAll);
router.get('/preguntas-enc/:id',    authenticateToken,          controller.preguntaEncVia.getById);
router.post('/preguntas-enc',       authenticateToken, isAdmin, controller.preguntaEncVia.create);
router.put('/preguntas-enc/:id',    authenticateToken, isAdmin, controller.preguntaEncVia.update);
router.delete('/preguntas-enc/:id', authenticateToken, isAdmin, controller.preguntaEncVia.remove);

module.exports = router;