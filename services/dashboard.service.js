const ViaTramo         = require('../models/ViaTramo');
const ExistSenVert     = require('../models/ExistSenVert');
const ExistSenHor      = require('../models/ExistSenHor');
const Semaforo         = require('../models/Semaforo');
const ControlSemaforo  = require('../models/ControlSemaforo');
const Jornada          = require('../models/Jornada');
const CajaInspeccion   = require('../models/CajaInspeccion');
const CategorizacionVial = require('../models/CategorizacionVial');

function groupBy(Model, field, match) {
    const pipeline = [];
    if (match) pipeline.push({ $match: match });
    pipeline.push(
        { $group: { _id: `$${field}`, total: { $sum: 1 } } },
        { $sort: { total: -1 } }
    );
    return Model.aggregate(pipeline);
}

async function getStats(filters = {}) {
    const { departamento, municipio } = filters;

    const tramoMatch = {};
    if (departamento) tramoMatch.departamento = departamento;
    if (municipio) tramoMatch.municipio = municipio;
    const hasGeoFilter = Object.keys(tramoMatch).length > 0;

    let relMatch = {};
    if (hasGeoFilter) {
        const tramoIds = await ViaTramo.find(tramoMatch).distinct('_id');
        relMatch = { idViaTramo: { $in: tramoIds } };
    }

    const tramoFilter = hasGeoFilter ? tramoMatch : {};

    const [
        totalTramos,
        totalSenVert,
        totalSenHor,
        totalSemaforos,
        totalControlSem,
        totalCajasInsp,
        totalCategVial,
        jornadaActiva,
        senVertEstados,
        senHorEstados,
        semaforosEstados,
        ultimosTramos,
        tramosPorEstadoVia,
        tramosPorFase,
        tramosPorAccion,
        senVertFases,
        senVertAcciones,
        senHorFases,
        senHorAcciones,
        semaforosFases,
        semaforosAcciones,
        controlSemPorEstadoCtrl,
        controlSemFases,
        controlSemAcciones,
        departamentos,
        municipios
    ] = await Promise.all([
        ViaTramo.countDocuments(tramoFilter),
        ExistSenVert.countDocuments(relMatch),
        ExistSenHor.countDocuments(relMatch),
        Semaforo.countDocuments(relMatch),
        ControlSemaforo.countDocuments(relMatch),
        CajaInspeccion.countDocuments(relMatch),
        CategorizacionVial.countDocuments(tramoFilter),
        Jornada.findOne({ estado: 'EN PROCESO' }),
        groupBy(ExistSenVert, 'estado', hasGeoFilter ? relMatch : null),
        groupBy(ExistSenHor, 'estadoDem', hasGeoFilter ? relMatch : null),
        groupBy(Semaforo, 'estadoGenPint', hasGeoFilter ? relMatch : null),
        ViaTramo.find(tramoFilter).sort({ fechaCreacion: -1 }).limit(5)
            .populate('idJornada', 'municipio')
            .select('via municipio fechaCreacion tipoUbic'),
        groupBy(ViaTramo, 'estadoVia', hasGeoFilter ? tramoFilter : null),
        groupBy(ViaTramo, 'fase', hasGeoFilter ? tramoFilter : null),
        groupBy(ViaTramo, 'accion', hasGeoFilter ? tramoFilter : null),
        groupBy(ExistSenVert, 'fase', hasGeoFilter ? relMatch : null),
        groupBy(ExistSenVert, 'accion', hasGeoFilter ? relMatch : null),
        groupBy(ExistSenHor, 'fase', hasGeoFilter ? relMatch : null),
        groupBy(ExistSenHor, 'accion', hasGeoFilter ? relMatch : null),
        groupBy(Semaforo, 'fase', hasGeoFilter ? relMatch : null),
        groupBy(Semaforo, 'accion', hasGeoFilter ? relMatch : null),
        groupBy(ControlSemaforo, 'estadoControlador', hasGeoFilter ? relMatch : null),
        groupBy(ControlSemaforo, 'fase', hasGeoFilter ? relMatch : null),
        groupBy(ControlSemaforo, 'accion', hasGeoFilter ? relMatch : null),
        ViaTramo.distinct('departamento'),
        departamento
            ? ViaTramo.distinct('municipio', { departamento })
            : ViaTramo.distinct('municipio')
    ]);

    return {
        totalTramos,
        totalSenVert,
        totalSenHor,
        totalSemaforos,
        totalControlSem,
        totalCajasInsp,
        totalCategVial,
        jornadaActiva,
        senVertEstados,
        senHorEstados,
        semaforosEstados,
        ultimosTramos,
        tramosPorEstadoVia,
        tramosPorFase,
        tramosPorAccion,
        senVertFases,
        senVertAcciones,
        senHorFases,
        senHorAcciones,
        semaforosFases,
        semaforosAcciones,
        controlSemPorEstadoCtrl,
        controlSemFases,
        controlSemAcciones,
        departamentos: departamentos.filter(Boolean).sort(),
        municipios: municipios.filter(Boolean).sort()
    };
}

module.exports = { getStats };
