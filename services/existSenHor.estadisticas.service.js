const mongoose = require('mongoose');
const ExistSenHor = require('../models/ExistSenHor');
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
    const rows = await ExistSenHor.aggregate([
        { $match: match },
        { $group: { _id: `$${field}`, total: { $sum: 1 } } },
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
    const total = await ExistSenHor.countDocuments(match);

    const [
        tipoDem,
        estadoDem,
        tipoPintura,
        material,
        color,
        claseDemLinea,
        claseDemPunto,
        fase,
        accion,
        ubicResTramo,
        reflectOptima,
        retroreflectividad,
        catalogos
    ] = await Promise.all([
        groupByField(match, 'tipoDem'),
        groupByField(match, 'estadoDem'),
        groupByField(match, 'tipoPintura'),
        groupByField(match, 'material'),
        groupByField(match, 'color'),
        groupByField(match, 'claseDemLinea'),
        groupByField(match, 'claseDemPunto'),
        groupByField(match, 'fase'),
        groupByField(match, 'accion'),
        groupByField(match, 'ubicResTramo'),
        groupByField(match, 'reflectOptima'),
        groupByField(match, 'retroreflectividad'),
        getCatalogos(query)
    ]);

    const secciones = [
        seccion(
            'demarcacion-estado',
            'Demarcación y estado',
            'Tipo y estado de la demarcación horizontal.',
            [
                bloque('tipoDem', 'Tipo de demarcación', 'tipoDem', tipoDem, total),
                bloque('estadoDem', 'Estado de demarcación', 'estadoDem', estadoDem, total)
            ]
        ),
        seccion(
            'material-pintura',
            'Material, pintura y color',
            'Características del material y acabado.',
            [
                bloque('tipoPintura', 'Tipo de pintura', 'tipoPintura', tipoPintura, total),
                bloque('material', 'Material', 'material', material, total),
                bloque('color', 'Color', 'color', color, total)
            ]
        ),
        seccion(
            'clasificacion-demarcacion',
            'Clasificación de demarcación',
            'Línea y punto según catálogo.',
            [
                bloque('claseDemLinea', 'Clase demarcación (línea)', 'claseDemLinea', claseDemLinea, total),
                bloque('claseDemPunto', 'Clase demarcación (punto)', 'claseDemPunto', claseDemPunto, total)
            ]
        ),
        seccion(
            'gestion-seguimiento',
            'Gestión y seguimiento',
            'Fase y acción registradas en el inventario.',
            [
                bloque('fase', 'Fase', 'fase', fase, total),
                bloque('accion', 'Acción', 'accion', accion, total)
            ]
        ),
        seccion(
            'ubicacion-tramo',
            'Ubicación en el tramo',
            'Referencia respecto al tramo vial.',
            [bloque('ubicResTramo', 'Ubicación en tramo', 'ubicResTramo', ubicResTramo, total)]
        ),
        seccion(
            'reflectividad',
            'Reflectividad',
            'Reflectancia y retroreflectividad.',
            [
                bloque('reflectOptima', 'Reflectancia óptima', 'reflectOptima', reflectOptima, total),
                bloque(
                    'retroreflectividad',
                    'Retroreflectividad',
                    'retroreflectividad',
                    retroreflectividad,
                    total
                )
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
