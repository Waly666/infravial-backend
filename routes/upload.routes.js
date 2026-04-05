const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/upload.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const {
    uploadFotoViaTramo,
    uploadFotoSenVert,
    uploadFotoSenHor,
    uploadFotoSemaforo,
    uploadFotoControlSem,
    uploadFotoSincEje,
    uploadFotoSincPuente,
    uploadFotoSincMuro,
    uploadFotoSincTunel,
    uploadFotoSincSitio,
    uploadFotoSincDrenaje,
    uploadFotoSincMc
} = require('../middlewares/upload.middleware');

router.post('/via-tramo', authenticateToken, uploadFotoViaTramo.array('foto', 10), controller.subirFoto);
router.post('/sen-vert',    authenticateToken, uploadFotoSenVert.single('foto'),    controller.subirFoto);
router.post('/sen-hor',     authenticateToken, uploadFotoSenHor.single('foto'),     controller.subirFoto);

router.post('/semaforo', authenticateToken, uploadFotoSemaforo.array('foto', 10), controller.subirFoto);
router.post('/control-sem', authenticateToken, uploadFotoControlSem.single('foto'), controller.subirFoto);

// SINC
router.post('/sinc-ejes',     authenticateToken, uploadFotoSincEje.array('fotos', 20),    controller.subirFoto);
router.post('/sinc-puentes',  authenticateToken, uploadFotoSincPuente.array('fotos', 20), controller.subirFoto);
router.post('/sinc-muros',    authenticateToken, uploadFotoSincMuro.array('fotos', 20),   controller.subirFoto);
router.post('/sinc-tuneles',  authenticateToken, uploadFotoSincTunel.array('fotos', 20),  controller.subirFoto);
router.post('/sinc-sitios',   authenticateToken, uploadFotoSincSitio.array('fotos', 20),  controller.subirFoto);
router.post('/sinc-drenaje',  authenticateToken, uploadFotoSincDrenaje.array('fotos', 20),controller.subirFoto);
router.post('/sinc-mc',      authenticateToken, uploadFotoSincMc.array('fotos', 20),       controller.subirFoto);

module.exports = router;