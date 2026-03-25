const ViaTramo       = require('../models/ViaTramo');
const ExistSenVert   = require('../models/ExistSenVert');
const ExistSenHor    = require('../models/ExistSenHor');
const Semaforo       = require('../models/Semaforo');
const Jornada        = require('../models/Jornada');
const CajaInspeccion = require('../models/CajaInspeccion');

async function getStats() {
    const desdeMeses = new Date();
    desdeMeses.setMonth(desdeMeses.getMonth() - 5);
    desdeMeses.setDate(1);
    desdeMeses.setHours(0, 0, 0, 0);

    const [
        totalTramos,
        totalSenVert,
        totalSenHor,
        totalSemaforos,
        totalCajasInsp,
        jornadaActiva,
        senVertEstados,
        senHorEstados,
        semaforosEstados,
        tramosPorMes,
        ultimosTramos
    ] = await Promise.all([
        ViaTramo.countDocuments(),
        ExistSenVert.countDocuments(),
        ExistSenHor.countDocuments(),
        Semaforo.countDocuments(),
        CajaInspeccion.countDocuments(),
        Jornada.findOne({ estado: 'EN PROCESO' }),
        ExistSenVert.aggregate([{ $group: { _id: '$estado', total: { $sum: 1 } } }]),
        ExistSenHor.aggregate([{ $group: { _id: '$estadoDem', total: { $sum: 1 } } }]),
        Semaforo.aggregate([{ $group: { _id: '$estadoGenPint', total: { $sum: 1 } } }]),
        ViaTramo.aggregate([
            { $match: { fechaCreacion: { $gte: desdeMeses } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m', date: '$fechaCreacion' } },
                    total: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]),
        ViaTramo.find().sort({ fechaCreacion: -1 }).limit(5)
            .populate('idJornada', 'municipio')
            .select('via municipio fechaCreacion')
    ]);

    return {
        totalTramos,
        totalSenVert,
        totalSenHor,
        totalSemaforos,
        totalCajasInsp,
        jornadaActiva,
        senVertEstados,
        senHorEstados,
        semaforosEstados,
        tramosPorMes,
        ultimosTramos
    };
}

module.exports = { getStats };