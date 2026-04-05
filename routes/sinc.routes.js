const express    = require('express');
const router     = express.Router();
const ctrl       = require('../controllers/sinc.controller');
const { authenticateToken, hasRole } = require('../middlewares/auth.middleware');

const ENC = ['admin', 'supervisor', 'encuestador'];
const SUP = ['admin', 'supervisor'];

// Catálogos de dominio (listas desplegables)
router.get('/dominios', authenticateToken, ctrl.getDominios);

// ─── EJES ────────────────────────────────────────────────────────────────────
router.get('/ejes',             authenticateToken,              ctrl.getAllEjes);
router.get('/ejes/:id',         authenticateToken,              ctrl.getEjeById);
router.get('/ejes/:id/resumen', authenticateToken,              ctrl.getResumenEje);
router.post('/ejes',            authenticateToken, hasRole(...ENC), ctrl.createEje);
router.put('/ejes/:id',         authenticateToken, hasRole(...ENC), ctrl.updateEje);
router.delete('/ejes/:id',      authenticateToken, hasRole(...SUP), ctrl.removeEje);

// ─── FOTO EJE ────────────────────────────────────────────────────────────────
router.get('/ejes/:idEje/fotos',  authenticateToken,              ctrl.getFotosByEje);
router.post('/fotos-eje',         authenticateToken, hasRole(...ENC), ctrl.createFotoEje);
router.put('/fotos-eje/:id',      authenticateToken, hasRole(...ENC), ctrl.updateFotoEje);
router.delete('/fotos-eje/:id',   authenticateToken, hasRole(...SUP), ctrl.removeFotoEje);

// ─── PRS ─────────────────────────────────────────────────────────────────────
router.get('/ejes/:idEje/prs',  authenticateToken,              ctrl.getPrsByEje);
router.post('/prs',             authenticateToken, hasRole(...ENC), ctrl.createPrs);
router.put('/prs/:id',          authenticateToken, hasRole(...ENC), ctrl.updatePrs);
router.delete('/prs/:id',       authenticateToken, hasRole(...SUP), ctrl.removePrs);

// ─── PROPIEDADES ─────────────────────────────────────────────────────────────
router.get('/ejes/:idEje/propiedades',  authenticateToken,              ctrl.getPropiedadesByEje);
router.post('/propiedades',             authenticateToken, hasRole(...ENC), ctrl.createPropiedades);
router.put('/propiedades/:id',          authenticateToken, hasRole(...ENC), ctrl.updatePropiedades);
router.delete('/propiedades/:id',       authenticateToken, hasRole(...SUP), ctrl.removePropiedades);

// ─── PUENTES ─────────────────────────────────────────────────────────────────
router.get('/ejes/:idEje/puentes',  authenticateToken,              ctrl.getPuentesByEje);
router.get('/puentes/:id',          authenticateToken,              ctrl.getPuenteById);
router.post('/puentes',             authenticateToken, hasRole(...ENC), ctrl.createPuente);
router.put('/puentes/:id',          authenticateToken, hasRole(...ENC), ctrl.updatePuente);
router.delete('/puentes/:id',       authenticateToken, hasRole(...SUP), ctrl.removePuente);

// ─── MUROS ───────────────────────────────────────────────────────────────────
router.get('/ejes/:idEje/muros',  authenticateToken,              ctrl.getMurosByEje);
router.post('/muros',             authenticateToken, hasRole(...ENC), ctrl.createMuro);
router.put('/muros/:id',          authenticateToken, hasRole(...ENC), ctrl.updateMuro);
router.delete('/muros/:id',       authenticateToken, hasRole(...SUP), ctrl.removeMuro);

// ─── TÚNELES ─────────────────────────────────────────────────────────────────
router.get('/ejes/:idEje/tuneles',  authenticateToken,              ctrl.getTunelesByEje);
router.post('/tuneles',             authenticateToken, hasRole(...ENC), ctrl.createTunel);
router.put('/tuneles/:id',          authenticateToken, hasRole(...ENC), ctrl.updateTunel);
router.delete('/tuneles/:id',       authenticateToken, hasRole(...SUP), ctrl.removeTunel);

// ─── SITIOS CRÍTICOS ─────────────────────────────────────────────────────────
router.get('/ejes/:idEje/sitios-criticos',  authenticateToken,              ctrl.getSitiosByEje);
router.post('/sitios-criticos',             authenticateToken, hasRole(...ENC), ctrl.createSitio);
router.put('/sitios-criticos/:id',          authenticateToken, hasRole(...ENC), ctrl.updateSitio);
router.delete('/sitios-criticos/:id',       authenticateToken, hasRole(...SUP), ctrl.removeSitio);

// ─── OBRAS DE DRENAJE ────────────────────────────────────────────────────────
router.get('/ejes/:idEje/obras-drenaje',  authenticateToken,              ctrl.getObrasByEje);
router.post('/obras-drenaje',             authenticateToken, hasRole(...ENC), ctrl.createObra);
router.put('/obras-drenaje/:id',          authenticateToken, hasRole(...ENC), ctrl.updateObra);
router.delete('/obras-drenaje/:id',       authenticateToken, hasRole(...SUP), ctrl.removeObra);

// ─── NIVEL DETALLADO Mc — rutas genéricas ────────────────────────────────────
router.get('/ejes/:idEje/mc/:capa',  authenticateToken,                 ctrl.getMcByEje);
router.post('/mc/:capa',             authenticateToken, hasRole(...ENC), ctrl.createMc);
router.put('/mc/:capa/:id',          authenticateToken, hasRole(...ENC), ctrl.updateMc);
router.delete('/mc/:capa/:id',       authenticateToken, hasRole(...SUP), ctrl.removeMc);

module.exports = router;
