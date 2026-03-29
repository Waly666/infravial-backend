const mongoose = require('mongoose');
const ViaTramo = require('../models/ViaTramo');
const Jornada = require('../models/Jornada');

function buildMatch(query) {
    const m = {};
    if (query.departamento) m.departamento = String(query.departamento).trim();
    if (query.municipio) m.municipio = String(query.municipio).trim();
    if (query.tipoLocalidad) m.tipoLocalidad = String(query.tipoLocalidad).trim();
    if (query.idJornada && mongoose.Types.ObjectId.isValid(query.idJornada)) {
        m.idJornada = new mongoose.Types.ObjectId(query.idJornada);
    }
    if (query.fechaDesde || query.fechaHasta) {
        m.fechaCreacion = {};
        if (query.fechaDesde) m.fechaCreacion.$gte = new Date(query.fechaDesde);
        if (query.fechaHasta) {
            const end = new Date(query.fechaHasta);
            end.setHours(23, 59, 59, 999);
            m.fechaCreacion.$lte = end;
        }
    }
    return m;
}

function labelId(v) {
    if (v == null || v === '') return 'Sin definir';
    return String(v);
}

async function groupByField(match, field) {
    const rows = await ViaTramo.aggregate([
        { $match: match },
        { $group: { _id: `$${field}`, total: { $sum: 1 } } },
        { $sort: { total: -1 } }
    ]);
    return rows.map(r => ({ categoria: labelId(r._id), cantidad: r.total }));
}

async function groupCarriles(match) {
    const rows = await ViaTramo.aggregate([
        { $match: match },
        {
            $addFields: {
                carStr: {
                    $cond: [
                        { $or: [{ $eq: ['$carriles', null] }, { $not: ['$carriles'] }] },
                        'Sin definir',
                        { $toString: '$carriles' }
                    ]
                }
            }
        },
        { $group: { _id: '$carStr', total: { $sum: 1 } } },
        { $sort: { total: -1 } }
    ]);
    return rows.map(r => ({ categoria: labelId(r._id), cantidad: r.total }));
}

async function groupIluminacion(match) {
    const rows = await ViaTramo.aggregate([
        { $match: match },
        {
            $addFields: {
                etiq: {
                    $switch: {
                        branches: [
                            { case: { $eq: ['$iluminacArtificial', true] }, then: 'Sí' },
                            { case: { $eq: ['$iluminacArtificial', false] }, then: 'No' }
                        ],
                        default: 'N/A / sin registrar'
                    }
                }
            }
        },
        { $group: { _id: '$etiq', total: { $sum: 1 } } },
        { $sort: { total: -1 } }
    ]);
    return rows.map(r => ({ categoria: labelId(r._id), cantidad: r.total }));
}

async function groupZat(match) {
    const rows = await ViaTramo.aggregate([
        { $match: match },
        {
            $lookup: {
                from: 'zats',
                localField: 'zat',
                foreignField: '_id',
                as: 'z'
            }
        },
        {
            $addFields: {
                zatEtiqueta: {
                    $let: {
                        vars: { zz: { $arrayElemAt: ['$z', 0] } },
                        in: {
                            $cond: [
                                { $ne: ['$$zz', null] },
                                {
                                    $trim: {
                                        input: {
                                            $concat: [
                                                { $toString: '$$zz.zatNumero' },
                                                ' ',
                                                { $ifNull: ['$$zz.zatLetra', ''] }
                                            ]
                                        }
                                    }
                                },
                                'Sin ZAT'
                            ]
                        }
                    }
                }
            }
        },
        { $group: { _id: '$zatEtiqueta', total: { $sum: 1 } } },
        { $sort: { total: -1 } }
    ]);
    return rows.map(r => ({ categoria: labelId(r._id), cantidad: r.total }));
}

async function groupEstadoVia2(match) {
    const rows = await ViaTramo.aggregate([
        { $match: match },
        { $unwind: { path: '$estadoVia2', preserveNullAndEmptyArrays: true } },
        {
            $group: {
                _id: {
                    $cond: [
                        { $or: [{ $eq: ['$estadoVia2', null] }, { $eq: ['$estadoVia2', ''] }] },
                        'Sin ítem en estado detallado',
                        '$estadoVia2'
                    ]
                },
                total: { $sum: 1 }
            }
        },
        { $sort: { total: -1 } }
    ]);
    return rows.map(r => ({ categoria: labelId(r._id), cantidad: r.total }));
}

function conPorcentajes(filas, total) {
    if (!total || total <= 0) return filas.map(f => ({ ...f, porcentaje: 0 }));
    return filas.map(f => ({
        ...f,
        porcentaje: Math.round((f.cantidad * 10000) / total) / 100
    }));
}

function bloque(id, tituloHumano, tituloVariable, filas, total) {
    let denom = total;
    if (id === 'estadoVia2' && filas.length) {
        const s = filas.reduce((a, f) => a + f.cantidad, 0);
        if (s > 0) denom = s;
    }
    return {
        id,
        tituloHumano,
        tituloVariable,
        filas: conPorcentajes(filas, denom)
    };
}

function seccion(id, titulo, descripcion, bloques) {
    return { id, titulo, descripcion, bloques };
}

async function getCatalogos(matchBase, query) {
    const munFilter = { ...matchBase };
    if (query.departamento) munFilter.departamento = String(query.departamento).trim();

    const [departamentos, municipios, tiposLocalidad, jornadas] = await Promise.all([
        ViaTramo.distinct('departamento', matchBase),
        ViaTramo.distinct('municipio', munFilter),
        ViaTramo.distinct('tipoLocalidad', matchBase),
        Jornada.find()
            .sort({ fechaJornada: -1, horaInicio: -1 })
            .limit(300)
            .select('municipio estado fechaJornada horaInicio')
            .lean()
    ]);
    const deptSorted = departamentos.filter(Boolean).sort();
    const munSorted = municipios.filter(Boolean).sort();
    const jor = jornadas.map(j => {
        const fd = j.fechaJornada || j.horaInicio;
        return {
            _id: String(j._id),
            etiqueta: `${j.municipio || '—'} · ${j.estado || ''} · ${fd ? new Date(fd).toLocaleDateString('es-CO') : ''}`
        };
    });
    return {
        departamentos: deptSorted,
        municipios: munSorted,
        tiposLocalidad: tiposLocalidad.filter(Boolean).sort(),
        jornadas: jor
    };
}

async function getEstadisticas(query) {
    const match = buildMatch(query);

    const total = await ViaTramo.countDocuments(match);

    const [
        estadoVia,
        clasPorCompetencia,
        clasPorFuncionalidad,
        clasNacional,
        clasPrelacion,
        clasMunPbot,
        tipoVia,
        claseVia,
        tipoLocalidad,
        disenioGeometrico,
        inclinacionVia,
        sentidoVial,
        calzada,
        carriles,
        capaRodadura,
        condicionesVia,
        iluminacion,
        estadoIluminacion,
        visibilidad,
        visDisminuida,
        estadoVia2,
        zat,
        catalogos
    ] = await Promise.all([
        groupByField(match, 'estadoVia'),
        groupByField(match, 'clasPorCompetencia'),
        groupByField(match, 'clasPorFuncionalidad'),
        groupByField(match, 'clasNacional'),
        groupByField(match, 'clasPrelacion'),
        groupByField(match, 'clasMunPbot'),
        groupByField(match, 'tipoVia'),
        groupByField(match, 'claseVia'),
        groupByField(match, 'tipoLocalidad'),
        groupByField(match, 'disenioGeometrico'),
        groupByField(match, 'inclinacionVia'),
        groupByField(match, 'sentidoVial'),
        groupByField(match, 'calzada'),
        groupCarriles(match),
        groupByField(match, 'capaRodadura'),
        groupByField(match, 'condicionesVia'),
        groupIluminacion(match),
        groupByField(match, 'estadoIluminacion'),
        groupByField(match, 'visibilidad'),
        groupByField(match, 'visDisminuida'),
        groupEstadoVia2(match),
        groupZat(match),
        getCatalogos({}, query)
    ]);

    const secciones = [
        seccion(
            'estado-via-general',
            'Estado de vía',
            'Distribución según el campo estado de vía del tramo.',
            [bloque('estadoVia', 'Estado de vía', 'estadoVia', estadoVia, total)]
        ),
        seccion(
            'clasificacion-vial',
            'Clasificación vial',
            'Competencia, funcionalidad, nacional, prelación y clasificación municipal.',
            [
                bloque('clasPorCompetencia', 'Por competencia', 'clasPorCompetencia', clasPorCompetencia, total),
                bloque('clasPorFuncionalidad', 'Por funcionalidad', 'clasPorFuncionalidad', clasPorFuncionalidad, total),
                bloque('clasNacional', 'Clasificación nacional', 'clasNacional', clasNacional, total),
                bloque('clasPrelacion', 'Prelación', 'clasPrelacion', clasPrelacion, total),
                bloque('clasMunPbot', 'Clasificación municipal (peatonal)', 'clasMunPbot', clasMunPbot, total)
            ]
        ),
        seccion(
            'tipo-jerarquia',
            'Tipo y jerarquía',
            'Tipo de vía, clase y tipo de localidad.',
            [
                bloque('tipoVia', 'Tipo de vía', 'tipoVia', tipoVia, total),
                bloque('claseVia', 'Clase de vía', 'claseVia', claseVia, total),
                bloque('tipoLocalidad', 'Tipo de localidad', 'tipoLocalidad', tipoLocalidad, total)
            ]
        ),
        seccion(
            'geometria-circulacion',
            'Geometría y circulación',
            'Diseño, inclinación, sentido, calzadas y carriles.',
            [
                bloque('disenioGeometrico', 'Diseño geométrico', 'disenioGeometrico', disenioGeometrico, total),
                bloque('inclinacionVia', 'Grado de inclinación', 'inclinacionVia', inclinacionVia, total),
                bloque('sentidoVial', 'Sentido de circulación', 'sentidoVial', sentidoVial, total),
                bloque('calzada', 'Calzada', 'calzada', calzada, total),
                bloque('carriles', 'Número de carriles', 'carriles', carriles, total)
            ]
        ),
        seccion(
            'superficie-condiciones',
            'Superficie y condiciones',
            'Capa de rodadura y condiciones registradas.',
            [
                bloque('capaRodadura', 'Capa / superficie de rodadura', 'capaRodadura', capaRodadura, total),
                bloque('condicionesVia', 'Condiciones de la vía', 'condicionesVia', condicionesVia, total)
            ]
        ),
        seccion(
            'iluminacion-visibilidad',
            'Iluminación y visibilidad',
            'Iluminación artificial, estado, visibilidad y factores asociados.',
            [
                bloque('iluminacArtificial', 'Iluminación artificial', 'iluminacArtificial', iluminacion, total),
                bloque('estadoIluminacion', 'Estado de iluminación', 'estadoIluminacion', estadoIluminacion, total),
                bloque('visibilidad', 'Visibilidad', 'visibilidad', visibilidad, total),
                bloque('visDisminuida', 'Visibilidad disminuida (detalle)', 'visDisminuida', visDisminuida, total)
            ]
        ),
        seccion(
            'estado-detalle-zat',
            'Estado detallado y ZAT',
            'Ítems múltiples de estado de vía y distribución por ZAT.',
            [
                bloque('estadoVia2', 'Estado detallado (múltiple)', 'estadoVia2', estadoVia2, total),
                bloque('zat', 'Zona ZAT', 'zat', zat, total)
            ]
        )
    ];

    return {
        totalRegistros: total,
        filtrosEfectivos: match,
        catalogos,
        secciones
    };
}

module.exports = { getEstadisticas, buildMatch };
