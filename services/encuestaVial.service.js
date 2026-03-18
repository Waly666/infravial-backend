const RespuestaEncVia = require('../models/RespuestaEncVia');

async function getPreguntas() {
    const PreguntaEncVia = require('../models/PreguntaEncVia');
    return await PreguntaEncVia.find().sort({ consecutivo: 1 });
}

async function getRespuestasByTramo(idTramo) {
    return await RespuestaEncVia.find({ idTramoVia: idTramo })
        .populate('idPregunta', 'consecutivo enunciado');
}

async function guardarRespuestas(idTramoVia, respuestas, userId) {
    // Eliminar respuestas anteriores del tramo
    await RespuestaEncVia.deleteMany({ idTramoVia });

    // Insertar nuevas respuestas
    const datos = respuestas
        .filter(r => r.idPregunta && r.valorRta)
        .map(r => ({
            idTramoVia,
            idPregunta:  r.idPregunta,
            consecutivo: r.consecutivo,
            valorRta:    r.valorRta,
            observacion: r.observacion || ''
        }));

    if (datos.length > 0) {
        await RespuestaEncVia.insertMany(datos);
    }

    return { total: datos.length };
}

module.exports = { getPreguntas, getRespuestasByTramo, guardarRespuestas };