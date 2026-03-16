const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/encuestaVial.controller');
const { authenticateToken, hasRole } = require('../middlewares/auth.middleware');

router.get('/preguntas',          authenticateToken,                                              controller.getPreguntas);
router.get('/tramo/:idTramo',     authenticateToken,                                              controller.getRespuestasByTramo);
router.post('/',                  authenticateToken, hasRole('admin','supervisor','encuestador'), controller.guardarRespuestas);

module.exports = router;