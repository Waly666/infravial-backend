const mongoose = require('mongoose');
const ExistSenVert = require('../models/ExistSenVert');
const ViaTramo = require('../models/ViaTramo');
const Jornada = require('../models/Jornada');

async function buildMatch(query) {
    const m = {};
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

    const hasGeo =
        (query.departamento && String(query.departamento).trim()) ||
        (query.municipio && String(query.municipio).trim()) ||
        (query.tipoLocalidad && String(query.tipoLocalidad).trim());

    if (hasGeo) {
        const tq = {};
        if (query.departamento) tq.departamento = String(query.departamento).trim();
        if (query.municipio) tq.municipio = String(query.municipio).trim();
        if (query.tipoLocalidad) tq.tipoLocalidad = String(query.tipoLocalidad).trim();
        const ids = await ViaTramo.find(tq).distinct('_id');
        m.idViaTramo = { $in: ids };
    }

    return m;
}

function labelId(v) {
    if (v == null || v === '') return 'Sin definir';
    return String(v);
}

async function groupByField(match, field) {
    const rows = await ExistSenVert.aggregate([
        { $match: match },
        { $group: { _id: `$${field}`, total: { $sum: 1 } } },
        { $sort: { total: -1 } }
    ]);
    return rows.map((r) => ({ categoria: labelId(r._id), cantidad: r.total }));
}

async function groupByNumericField(match, field) {
    const rows = await ExistSenVert.aggregate([
        { $match: match },
        {
            $addFields: {
                key: {
                    $cond: [
                        { $or: [{ $eq: [`$${field}`, null] }, { $not: [`$${field}`] }] },
                        'Sin definir',
                        { $toString: `$${field}` }
                    ]
                }
            }
        },
        { $group: { _id: '$key', total: { $sum: 1 } } },
        { $sort: { total: -1 } }
    ]);
    return rows.map((r) => ({ categoria: labelId(r._id), cantidad: r.total }));
}

function conPorcentajes(filas, total) {
    if (!total || total <= 0) return filas.map((f) => ({ ...f, porcentaje: 0 }));
    return filas.map((f) => ({
        ...f,
        porcentaje: Math.round((f.cantidad * 10000) / total) / 100
    }));
}

function bloque(id, tituloHumano, tituloVariable, filas, total) {
    return {
        id,
        tituloHumano,
        tituloVariable,
        filas: conPorcentajes(filas, total)
    };
}

function seccion(id, titulo, descripcion, bloques) {
    return { id, titulo, descripcion, bloques };
}

async function getCatalogos(query) {
    const munFilter = {};
    if (query.departamento) munFilter.departamento = String(query.departamento).trim();

    const [departamentos, municipios, tiposLocalidad, jornadas] = await Promise.all([
        ViaTramo.distinct('departamento', {}),
        ViaTramo.distinct('municipio', munFilter),
        ViaTramo.distinct('tipoLocalidad', {}),
        Jornada.find()
            .sort({ fechaJornada: -1, horaInicio: -1 })
            .limit(300)
            .select('municipio estado fechaJornada horaInicio')
            .lean()
    ]);

    const jor = jornadas.map((j) => {
        const fd = j.fechaJornada || j.horaInicio;
        return {
            _id: String(j._id),
            etiqueta: `${j.municipio || '—'} · ${j.estado || ''} · ${fd ? new Date(fd).toLocaleDateString('es-CO') : ''}`
        };
    });

    return {
        departamentos: departamentos.filter(Boolean).sort(),
        municipios: municipios.filter(Boolean).sort(),
        tiposLocalidad: tiposLocalidad.filter(Boolean).sort(),
        jornadas: jor
    };
}

async function getEstadisticas(query) {
    const match = await buildMatch(query);
    const total = await ExistSenVert.countDocuments(match);

    const [
        estado,
        matPlaca,
        ubicEspacial,
        obstruccion,
        forma,
        orientacion,
        reflecOptima,
        dimTablero,
        ubicPerVial,
        fase,
        accion,
        diagUbicLat,
        diagAltura,
        banderas,
        leyendas,
        ubicLateral,
        altura,
        falla1,
        falla2,
        falla3,
        falla4,
        falla5,
        tipoSoporte,
        sistemaSoporte,
        estadoSoporte,
        estadoAnclaje,
        catalogos
    ] = await Promise.all([
        groupByField(match, 'estado'),
        groupByField(match, 'matPlaca'),
        groupByField(match, 'ubicEspacial'),
        groupByField(match, 'obstruccion'),
        groupByField(match, 'forma'),
        groupByField(match, 'orientacion'),
        groupByField(match, 'reflecOptima'),
        groupByField(match, 'dimTablero'),
        groupByField(match, 'ubicPerVial'),
        groupByField(match, 'fase'),
        groupByField(match, 'accion'),
        groupByField(match, 'diagUbicLat'),
        groupByField(match, 'diagAltura'),
        groupByField(match, 'banderas'),
        groupByField(match, 'leyendas'),
        groupByNumericField(match, 'ubicLateral'),
        groupByNumericField(match, 'altura'),
        groupByField(match, 'falla1'),
        groupByField(match, 'falla2'),
        groupByField(match, 'falla3'),
        groupByField(match, 'falla4'),
        groupByField(match, 'falla5'),
        groupByField(match, 'tipoSoporte'),
        groupByField(match, 'sistemaSoporte'),
        groupByField(match, 'estadoSoporte'),
        groupByField(match, 'estadoAnclaje'),
        getCatalogos(query)
    ]);

    const secciones = [
        seccion(
            'estado-material',
            'Estado y material',
            'Estado general de la señal y material de placa.',
            [
                bloque('estado', 'Estado', 'estado', estado, total),
                bloque('matPlaca', 'Material de placa', 'matPlaca', matPlaca, total)
            ]
        ),
        seccion(
            'ubicacion-forma',
            'Ubicación y forma',
            'Referencia espacial, forma y orientación.',
            [
                bloque('ubicEspacial', 'Ubicación espacial', 'ubicEspacial', ubicEspacial, total),
                bloque('ubicPerVial', 'Ubicación en perímetro vial', 'ubicPerVial', ubicPerVial, total),
                bloque('forma', 'Forma', 'forma', forma, total),
                bloque('orientacion', 'Orientación', 'orientacion', orientacion, total)
            ]
        ),
        seccion(
            'obstruccion-reflectancia',
            'Obstrucción y reflectancia',
            'Visibilidad y reflectancia óptima.',
            [
                bloque('obstruccion', 'Obstrucción', 'obstruccion', obstruccion, total),
                bloque('reflecOptima', 'Reflectancia óptima', 'reflecOptima', reflecOptima, total)
            ]
        ),
        seccion(
            'dimensiones',
            'Dimensiones y diagnósticos',
            'Tablero, lateral, altura y diagnósticos asociados.',
            [
                bloque('dimTablero', 'Dimensión tablero', 'dimTablero', dimTablero, total),
                bloque('ubicLateral', 'Ubicación lateral (valor)', 'ubicLateral', ubicLateral, total),
                bloque('diagUbicLat', 'Diagnóstico ubicación lateral', 'diagUbicLat', diagUbicLat, total),
                bloque('altura', 'Altura (valor)', 'altura', altura, total),
                bloque('diagAltura', 'Diagnóstico altura', 'diagAltura', diagAltura, total)
            ]
        ),
        seccion(
            'gestion-seguimiento',
            'Gestión y seguimiento',
            'Fase y acción.',
            [
                bloque('fase', 'Fase', 'fase', fase, total),
                bloque('accion', 'Acción', 'accion', accion, total)
            ]
        ),
        seccion(
            'banderas-leyendas',
            'Banderas y leyendas',
            'Campos de banderas y leyendas.',
            [
                bloque('banderas', 'Banderas', 'banderas', banderas, total),
                bloque('leyendas', 'Leyendas', 'leyendas', leyendas, total)
            ]
        ),
        seccion(
            'fallas',
            'Fallas registradas',
            'Distribución por campos falla1 … falla5.',
            [
                bloque('falla1', 'Falla 1', 'falla1', falla1, total),
                bloque('falla2', 'Falla 2', 'falla2', falla2, total),
                bloque('falla3', 'Falla 3', 'falla3', falla3, total),
                bloque('falla4', 'Falla 4', 'falla4', falla4, total),
                bloque('falla5', 'Falla 5', 'falla5', falla5, total)
            ]
        ),
        seccion(
            'soporte-anclaje',
            'Soporte y anclaje',
            'Tipo de soporte, sistema, estados.',
            [
                bloque('tipoSoporte', 'Tipo de soporte', 'tipoSoporte', tipoSoporte, total),
                bloque('sistemaSoporte', 'Sistema de soporte', 'sistemaSoporte', sistemaSoporte, total),
                bloque('estadoSoporte', 'Estado del soporte', 'estadoSoporte', estadoSoporte, total),
                bloque('estadoAnclaje', 'Estado del anclaje', 'estadoAnclaje', estadoAnclaje, total)
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

module.exports = { getEstadisticas };
