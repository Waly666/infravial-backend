const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/conteo.controller');
const { authenticateToken, isAdmin, hasRole } = require('../middlewares/auth.middleware');
const isSupervisor = hasRole('admin', 'supervisor');

// ── CATÁLOGOS (lectura pública autenticada) ───────────────────────────────────
router.get('/catalogos/cats',     authenticateToken, ctrl.catalogo.getCats);
router.get('/catalogos/sentidos', authenticateToken, ctrl.catalogo.getSentidos);

// ── PROYECTOS ─────────────────────────────────────────────────────────────────
router.get   ('/proyectos',                authenticateToken,                ctrl.proyecto.getAll);
router.get   ('/proyectos/activo',         authenticateToken,                ctrl.proyecto.getActivo);
router.post  ('/proyectos',                authenticateToken, isSupervisor,  ctrl.proyecto.create);
router.put   ('/proyectos/:id',            authenticateToken, isSupervisor,  ctrl.proyecto.update);
router.put   ('/proyectos/:id/activar',    authenticateToken, isSupervisor,  ctrl.proyecto.activar);
router.put   ('/proyectos/:id/desactivar', authenticateToken, isSupervisor,  ctrl.proyecto.desactivar);
router.delete('/proyectos/:id',            authenticateToken, isSupervisor,  ctrl.proyecto.remove);

// ── ESTACIONES ────────────────────────────────────────────────────────────────
router.get   ('/estaciones',     authenticateToken,             ctrl.estacion.getAll);
router.get   ('/estaciones/:id', authenticateToken,             ctrl.estacion.getById);
router.post  ('/estaciones',     authenticateToken, isSupervisor, ctrl.estacion.create);
router.put   ('/estaciones/:id', authenticateToken, isSupervisor, ctrl.estacion.update);
router.delete('/estaciones/:id', authenticateToken, isAdmin,    ctrl.estacion.remove);

// ── CONTEOS ───────────────────────────────────────────────────────────────────
router.get   ('/conteos',     authenticateToken,               ctrl.conteo.getAll);
router.get   ('/conteos/:id', authenticateToken,               ctrl.conteo.getById);
router.post  ('/conteos',     authenticateToken, isSupervisor, ctrl.conteo.create);
router.put   ('/conteos/:id', authenticateToken, isSupervisor, ctrl.conteo.update);
router.delete('/conteos/:id', authenticateToken, isAdmin,      ctrl.conteo.remove);

// ── SESIONES (bloqueo sentidos) ───────────────────────────────────────────────
router.get ('/sesiones/:idConteo',             authenticateToken,              ctrl.sesion.getByConteo);
router.post('/sesiones/tomar',                 authenticateToken,              ctrl.sesion.tomar);
router.put ('/sesiones/:idConteo/liberar',     authenticateToken,              ctrl.sesion.liberar);
router.put ('/sesiones/:idConteo/liberar-todas', authenticateToken, isSupervisor, ctrl.sesion.liberarTodas);

// ── DETALLE (registrar vehículos) ─────────────────────────────────────────────
router.post('/detalle',                         authenticateToken, ctrl.detalle.registrar);
router.get ('/detalle/:idConteo',               authenticateToken, ctrl.detalle.getByConteo);
router.get ('/detalle/:idConteo/resumen',       authenticateToken, ctrl.detalle.resumen);
router.delete('/detalle/:idConteo/deshacer',    authenticateToken, ctrl.detalle.deshacer);

// ── SSE tiempo real ───────────────────────────────────────────────────────────
router.get('/sse/:idConteo', authenticateToken, ctrl.sse);

module.exports = router;
