const RespuestaEncVia = require('../models/RespuestaEncVia');
const PreguntaEncVia  = require('../models/PreguntaEncVia');

async function getPreguntas() {
    return await PreguntaEncVia.find().sort({ consecutivo: 1 });
}

async function getRespuestasByTramo(idTramoVia) {
    return await RespuestaEncVia.find({ idTramoVia })
        .populate('idPregunta', 'consecutivo enunciado')
        .sort({ consecutivo: 1 });
}

async function guardarRespuestas(idTramoVia, respuestas, creadoPor) {
    // Eliminar respuestas anteriores del tramo
    await RespuestaEncVia.deleteMany({ idTramoVia });

    const docs = respuestas.map(r => ({
        idTramoVia,
        idPregunta:   r.idPregunta,
        consecutivo:  r.consecutivo,
        valorRta:     r.valorRta,
        observacion:  r.observacion,
        creadoPor
    }));

    return await RespuestaEncVia.insertMany(docs);
}

module.exports = { getPreguntas, getRespuestasByTramo, guardarRespuestas };