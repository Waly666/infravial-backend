const ViaTramo      = require('../models/ViaTramo');
const ExistSenVert  = require('../models/ExistSenVert');
const ExistSenHor   = require('../models/ExistSenHor');
const Semaforo      = require('../models/Semaforo');
const Jornada       = require('../models/Jornada');

async function getStats() {
    const [
        totalTramos,
        totalSenVert,
        totalSenHor,
        totalSemaforos,
        jornadaActiva,
        senVertEstados,
        senHorEstados,
        semaforosEstados,
        ultimosTramos
    ] = await Promise.all([
        ViaTramo.countDocuments(),
        ExistSenVert.countDocuments(),
        ExistSenHor.countDocuments(),
        Semaforo.countDocuments(),
        Jornada.findOne({ estado: 'EN PROCESO' }),
        ExistSenVert.aggregate([{ $group: { _id: '$estado', total: { $sum: 1 } } }]),
        ExistSenHor.aggregate([{ $group: { _id: '$estadoDem', total: { $sum: 1 } } }]),
        Semaforo.aggregate([{ $group: { _id: '$estadoGenPint', total: { $sum: 1 } } }]),
        ViaTramo.find().sort({ fechaCreacion: -1 }).limit(5)
            .populate('idJornada', 'municipio')
            .select('via municipio fechaCreacion')
    ]);

    return {
        totalTramos,
        totalSenVert,
        totalSenHor,
        totalSemaforos,
        jornadaActiva,
        senVertEstados,
        senHorEstados,
        semaforosEstados,
        ultimosTramos
    };
}

module.exports = { getStats };