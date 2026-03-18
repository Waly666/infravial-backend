const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/upload.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const {
    uploadFotoViaTramo,
    uploadFotoSenVert,
    uploadFotoSenHor,
    uploadFotoSemaforo,
    uploadFotoControlSem
} = require('../middlewares/upload.middleware');

router.post('/via-tramo', authenticateToken, uploadFotoViaTramo.array('foto', 10), controller.subirFoto);
router.post('/sen-vert',    authenticateToken, uploadFotoSenVert.single('foto'),    controller.subirFoto);
router.post('/sen-hor',     authenticateToken, uploadFotoSenHor.single('foto'),     controller.subirFoto);
router.post('/semaforo',    authenticateToken, uploadFotoSemaforo.single('foto'),   controller.subirFoto);
router.post('/control-sem', authenticateToken, uploadFotoControlSem.single('foto'), controller.subirFoto);

module.exports = router;