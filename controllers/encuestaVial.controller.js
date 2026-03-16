const encuestaService = require('../services/encuestaVial.service');

async function getPreguntas(req, res) {
    try {
        const preguntas = await encuestaService.getPreguntas();
        res.json({ message: 'Preguntas encuesta INFRAVIAL', preguntas });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function getRespuestasByTramo(req, res) {
    try {
        const respuestas = await encuestaService.getRespuestasByTramo(req.params.idTramo);
        res.json({ message: 'Respuestas encuesta INFRAVIAL', respuestas });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function guardarRespuestas(req, res) {
    try {
        const { idTramoVia, respuestas } = req.body;
        if (!idTramoVia || !respuestas) return res.status(400).json({ message: 'Datos incompletos INFRAVIAL' });
        const resultado = await encuestaService.guardarRespuestas(idTramoVia, respuestas, req.user.id);
        res.status(201).json({ message: 'Encuesta guardada INFRAVIAL', resultado });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

module.exports = { getPreguntas, getRespuestasByTramo, guardarRespuestas };