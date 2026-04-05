const fs       = require('fs');
const path     = require('path');
const multer   = require('multer');
const archiver = require('archiver');
const unzipper = require('unzipper');
const XLSX     = require('xlsx');
const jwt      = require('jsonwebtoken');
const { Types } = require('mongoose');

const ViaTramo        = require('../models/ViaTramo');
const ExistSenVert    = require('../models/ExistSenVert');
const ExistSenHor     = require('../models/ExistSenHor');
const Semaforo        = require('../models/Semaforo');
const ControlSemaforo = require('../models/ControlSemaforo');
const CajaInspeccion  = require('../models/CajaInspeccion');
const CategorizacionVial = require('../models/CategorizacionVial');
const Divipol         = require('../models/Divipol');
const Zat             = require('../models/Zat');
const Comuna          = require('../models/Comuna');
const Barrio          = require('../models/Barrio');
const Jornada         = require('../models/Jornada');

// Modelos SINC
const SincEje              = require('../models/SincEje');
const SincPropiedades      = require('../models/SincPropiedades');
const SincFotoEje          = require('../models/SincFotoEje');
const SincPuente           = require('../models/SincPuente');
const SincPonton           = require('../models/SincPonton');
const SincObraDrenaje      = require('../models/SincObraDrenaje');
const SincInterseccion     = require('../models/SincInterseccion');
const SincDefensa          = require('../models/SincDefensa');
const SincMuro             = require('../models/SincMuro');
const SincTalude           = require('../models/SincTalude');
const SincTunel            = require('../models/SincTunel');
const SincEstructuraPavimento = require('../models/SincEstructuraPavimento');
const SincMcModels         = require('../models/SincMc');
const SincPrs              = require('../models/SincPrs');
const SincSenal            = require('../models/SincSenal');
const SincSitioCritico     = require('../models/SincSitioCritico');

const UPLOADS_DIR     = path.join(__dirname, '..', 'uploads');
const EXPORTS_DIR     = path.join(__dirname, '..', 'exports');
const IMPORTS_TMP_DIR = path.join(__dirname, '..', 'imports-tmp');

[EXPORTS_DIR, IMPORTS_TMP_DIR].forEach(d => {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

// ── Job store ─────────────────────────────────────────────────────────────────
const jobs = new Map();

// Limpiar jobs mayores a 2 horas
setInterval(() => {
    const cutoff = Date.now() - 2 * 60 * 60 * 1000;
    for (const [id, job] of jobs) {
        if (job.createdAt < cutoff) {
            if (job.zipPath && fs.existsSync(job.zipPath)) {
                try { fs.unlinkSync(job.zipPath); } catch { /* ignorar */ }
            }
            jobs.delete(id);
        }
    }
}, 30 * 60 * 1000);

function createJob(type) {
    const id = `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    jobs.set(id, {
        id,
        type,
        status: 'running',
        tables: {},
        photos: { total: 0, current: 0, ok: 0, err: 0 },
        error: null,
        zipPath: null,
        zipName: null,
        createdAt: Date.now()
    });
    return id;
}

// ── Tablas config ─────────────────────────────────────────────────────────────
// Jornada va primero: las demás tablas la referencian con idJornada.
// filterType 'jornada-direct': la propia Jornada usa municipio/dpto en lugar de departamento.
const OPER_TABLES = [
    { key: 'jornadas',         model: Jornada,         label: 'Jornadas',           filterType: 'jornada-direct' },
    { key: 'via-tramos',       model: ViaTramo,        label: 'Vía Tramos',         filterType: 'direct'         },
    { key: 'sen-verticales',   model: ExistSenVert,    label: 'Señales Verticales', filterType: 'via-tramo'      },
    { key: 'sen-horizontales', model: ExistSenHor,     label: 'Señales Horiz.',     filterType: 'via-tramo'      },
    { key: 'semaforos',        model: Semaforo,        label: 'Semáforos',          filterType: 'via-tramo'      },
    { key: 'control-semaforo', model: ControlSemaforo, label: 'Control Semáforo',   filterType: 'via-tramo'      },
    { key: 'cajas-inspeccion', model: CajaInspeccion,  label: 'Cajas Inspección',   filterType: 'via-tramo'      },
    {
        key: 'categorizacion-vial',
        model: CategorizacionVial,
        label: 'Categorización Vial',
        /** Mismo dept./mun. que vía-tramos; sin idJornada: jornada → filtro por dpto/mun. de la jornada */
        filterType: 'direct-categ'
    },
];

const CATALOG_TABLES = [
    { key: 'divipol', model: Divipol, label: 'Divipol' },
    { key: 'zat',     model: Zat,     label: 'ZAT'     },
    { key: 'comunas', model: Comuna,  label: 'Comunas' },
    { key: 'barrios', model: Barrio,  label: 'Barrios' },
];

// SINC: SincEje va primero (referencia Jornada); los demás referencian SincEje
const SINC_TABLES = [
    { key: 'sinc-ejes',            model: SincEje,               label: 'SINC Ejes',              filterType: 'sinc-direct' },
    { key: 'sinc-propiedades',     model: SincPropiedades,       label: 'SINC Propiedades',       filterType: 'sinc-eje' },
    { key: 'sinc-fotos-eje',       model: SincFotoEje,           label: 'SINC Fotos Eje',         filterType: 'sinc-eje' },
    { key: 'sinc-puentes',         model: SincPuente,            label: 'SINC Puentes',           filterType: 'sinc-eje' },
    { key: 'sinc-pontones',        model: SincPonton,            label: 'SINC Pontones',          filterType: 'sinc-eje' },
    { key: 'sinc-obras-drenaje',   model: SincObraDrenaje,       label: 'SINC Obras Drenaje',     filterType: 'sinc-eje' },
    { key: 'sinc-intersecciones',  model: SincInterseccion,      label: 'SINC Intersecciones',    filterType: 'sinc-eje' },
    { key: 'sinc-defensas',        model: SincDefensa,           label: 'SINC Defensas',          filterType: 'sinc-eje' },
    { key: 'sinc-muros',           model: SincMuro,              label: 'SINC Muros',             filterType: 'sinc-eje' },
    { key: 'sinc-taludes',         model: SincTalude,            label: 'SINC Taludes',           filterType: 'sinc-eje' },
    { key: 'sinc-tuneles',         model: SincTunel,             label: 'SINC Túneles',           filterType: 'sinc-eje' },
    { key: 'sinc-est-pavimento',   model: SincEstructuraPavimento, label: 'SINC Est. Pavimento',  filterType: 'sinc-eje' },
    // Nivel Detallado Mc — 17 capas (todas referencian idEje)
    { key: 'sinc-mc-berma',           model: SincMcModels.SincMcBerma,          label: 'SINC MC Berma',           filterType: 'sinc-eje' },
    { key: 'sinc-mc-calzada',         model: SincMcModels.SincMcCalzada,        label: 'SINC MC Calzada',         filterType: 'sinc-eje' },
    { key: 'sinc-mc-cco',             model: SincMcModels.SincMcCco,            label: 'SINC MC CCO',             filterType: 'sinc-eje' },
    { key: 'sinc-mc-cicloruta',       model: SincMcModels.SincMcCicloruta,      label: 'SINC MC Cicloruta',       filterType: 'sinc-eje' },
    { key: 'sinc-mc-cuneta',          model: SincMcModels.SincMcCuneta,         label: 'SINC MC Cuneta',          filterType: 'sinc-eje' },
    { key: 'sinc-mc-defensa-vial',    model: SincMcModels.SincMcDefensaVial,    label: 'SINC MC Defensa Vial',    filterType: 'sinc-eje' },
    { key: 'sinc-mc-dispositivo-its', model: SincMcModels.SincMcDispositivoIts, label: 'SINC MC Dispositivo ITS', filterType: 'sinc-eje' },
    { key: 'sinc-mc-drenaje',         model: SincMcModels.SincMcDrenaje,        label: 'SINC MC Drenaje',         filterType: 'sinc-eje' },
    { key: 'sinc-mc-estacion-peaje',  model: SincMcModels.SincMcEstacionPeaje,  label: 'SINC MC Est. Peaje',      filterType: 'sinc-eje' },
    { key: 'sinc-mc-estacion-pesaje', model: SincMcModels.SincMcEstacionPesaje, label: 'SINC MC Est. Pesaje',     filterType: 'sinc-eje' },
    { key: 'sinc-mc-luminaria',       model: SincMcModels.SincMcLuminaria,      label: 'SINC MC Luminaria',       filterType: 'sinc-eje' },
    { key: 'sinc-mc-muro',            model: SincMcModels.SincMcMuro,           label: 'SINC MC Muro',            filterType: 'sinc-eje' },
    { key: 'sinc-mc-puente',          model: SincMcModels.SincMcPuente,         label: 'SINC MC Puente',          filterType: 'sinc-eje' },
    { key: 'sinc-mc-senal-vertical',  model: SincMcModels.SincMcSenalVertical,  label: 'SINC MC Señal Vertical',  filterType: 'sinc-eje' },
    { key: 'sinc-mc-separador',       model: SincMcModels.SincMcSeparador,      label: 'SINC MC Separador',       filterType: 'sinc-eje' },
    { key: 'sinc-mc-tunel',           model: SincMcModels.SincMcTunel,          label: 'SINC MC Túnel',           filterType: 'sinc-eje' },
    { key: 'sinc-mc-zona-servicio',   model: SincMcModels.SincMcZonaServicio,   label: 'SINC MC Zona Servicio',   filterType: 'sinc-eje' },
    { key: 'sinc-prs',                model: SincPrs,                           label: 'SINC PRS',                filterType: 'sinc-eje' },
    { key: 'sinc-senales',         model: SincSenal,             label: 'SINC Señales',           filterType: 'sinc-eje' },
    { key: 'sinc-sitios-criticos', model: SincSitioCritico,      label: 'SINC Sitios Críticos',   filterType: 'sinc-eje' },
];

// ALL_TABLES define también el ORDEN de importación:
// Jornadas → Catálogos → ViaTramos → Señales/Semáforos → SINC (SincEje antes que sus dependientes)
const ALL_TABLES = [
    OPER_TABLES[0],          // jornadas
    ...CATALOG_TABLES,       // divipol, zat, comunas, barrios
    ...OPER_TABLES.slice(1), // via-tramos, sen-vert, sen-hor, semaforos, control-sem, cajas, categorizacion-vial
    ...SINC_TABLES,          // sinc-ejes y sus dependientes
];

// ── Utilidades ────────────────────────────────────────────────────────────────
const sleep = () => new Promise(r => setImmediate(r));

const BATCH_READ  = 100;
const BATCH_WRITE = 50;

/** Extrae todas las URLs /uploads/... de un registro recursivamente */
function extractPhotoUrls(record) {
    const urls = [];
    function scan(val) {
        if (!val || typeof val !== 'object') return;
        const items = Array.isArray(val) ? val : Object.values(val);
        for (const v of items) {
            if (typeof v === 'string' && v.startsWith('/uploads/')) {
                urls.push(v);
            } else if (v && typeof v === 'object') {
                scan(v);
            }
        }
    }
    scan(record);
    return urls;
}

/**
 * Serializa un documento lean() para XLSX.
 * Los campos que son arrays u objetos se guardan como JSON string
 * para que XLSX no los destruya con "[object Object]".
 */
function serializeForExcel(record) {
    const plain = JSON.parse(JSON.stringify(record));
    const result = {};
    for (const [key, val] of Object.entries(plain)) {
        if (val === null || val === undefined) {
            result[key] = '';
        } else if (Array.isArray(val) || (typeof val === 'object')) {
            result[key] = JSON.stringify(val);
        } else {
            result[key] = val;
        }
    }
    return result;
}

/**
 * Revierte la serialización de Excel: parsea JSON strings de vuelta
 * a arrays/objetos antes de insertar en MongoDB.
 */
function deserializeFromExcel(row) {
    const doc = {};
    for (const [key, val] of Object.entries(row)) {
        if (val === '' || val === null || val === undefined) {
            // omitir — Mongoose usará el default o dejará sin definir
        } else if (typeof val === 'string' && (val[0] === '[' || val[0] === '{')) {
            try { doc[key] = JSON.parse(val); } catch { doc[key] = val; }
        } else {
            doc[key] = val;
        }
    }
    return doc;
}

/** Escapa caracteres especiales de regex en el valor del filtro */
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Sin tildes/diacríticos — alinea «Popayán» con «POPAYAN» en comparaciones por regex. */
function foldDiacritics(s) {
    return String(s || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
}

/** Variantes regex (original + sin diacríticos) para un campo textual. */
function matchFieldFlexibleConds(fieldName, raw) {
    const v1 = String(raw).trim();
    if (!v1) return [];
    const v2 = foldDiacritics(v1);
    const conds = [{ [fieldName]: { $regex: new RegExp(`^${escapeRegex(v1)}$`, 'i') } }];
    if (v2 !== v1) {
        conds.push({ [fieldName]: { $regex: new RegExp(`^${escapeRegex(v2)}$`, 'i') } });
    }
    return conds;
}

function applyFlexibleFieldToFilter(filter, fieldName, rawValue) {
    const conds = matchFieldFlexibleConds(fieldName, rawValue);
    if (!conds.length) return;
    if (conds.length === 1) Object.assign(filter, conds[0]);
    else filter.$or = conds;
}

/** Par departamento + municipio (para categorización vial / mismo criterio geo que un tramo). */
function matchDeptMunPair(depRaw, munRaw) {
    const dConds = matchFieldFlexibleConds('departamento', depRaw);
    const mConds = matchFieldFlexibleConds('municipio', munRaw);
    if (!dConds.length || !mConds.length) return null;
    return { $and: [{ $or: dConds }, { $or: mConds }] };
}

/** $match por idJornada tolerando ObjectId o string (datos legacy). */
function matchIdJornadaClause(jidVal) {
    const oid = new Types.ObjectId(jidVal);
    const asStr = String(oid);
    return { $or: [{ idJornada: oid }, { idJornada: asStr }] };
}

/**
 * Combina criterio geo y rango fechaCreacion en un único $and
 * (evita comportamientos ambiguos con $or + campo fecha a la vez).
 */
function appendFechaCreacionToFilter(baseFilter, fechaDesde, fechaHasta) {
    if (!fechaDesde && !fechaHasta) return baseFilter;
    const fc = {};
    if (fechaDesde) fc.$gte = new Date(fechaDesde);
    if (fechaHasta) fc.$lte = new Date(fechaHasta + 'T23:59:59.999Z');
    const fechaClause = { fechaCreacion: fc };
    if (!baseFilter || typeof baseFilter !== 'object' || !Object.keys(baseFilter).length) {
        return fechaClause;
    }
    return { $and: [baseFilter, fechaClause] };
}

/** Construye el filtro MongoDB según tipo */
async function buildFilter(filterType, tipoFiltro, valorFiltro, viaIds, ejeIds, fechaDesde, fechaHasta) {
    const filter = {};
    const safe   = escapeRegex(valorFiltro);

    if (filterType === 'jornada-direct') {
        // Jornada usa municipio/dpto (no departamento ni idJornada)
        if (tipoFiltro === 'municipio')         filter.municipio = { $regex: new RegExp(`^${safe}$`, 'i') };
        else if (tipoFiltro === 'departamento') filter.dpto      = { $regex: new RegExp(`^${safe}$`, 'i') };
        else if (tipoFiltro === 'jornada') {
            if (!Types.ObjectId.isValid(valorFiltro)) return null;
            filter._id = new Types.ObjectId(valorFiltro);
        }
    } else if (filterType === 'direct') {
        if (tipoFiltro === 'departamento')      filter.departamento = { $regex: new RegExp(`^${safe}$`, 'i') };
        else if (tipoFiltro === 'municipio')    filter.municipio    = { $regex: new RegExp(`^${safe}$`, 'i') };
        else if (tipoFiltro === 'jornada') {
            if (!Types.ObjectId.isValid(valorFiltro)) return null;
            filter.idJornada = new Types.ObjectId(valorFiltro);
        }
    } else if (filterType === 'via-tramo') {
        if (tipoFiltro === 'jornada') {
            if (!Types.ObjectId.isValid(valorFiltro)) return null;
            filter.idJornada = new Types.ObjectId(valorFiltro);
        } else {
            if (!viaIds || viaIds.length === 0) return null;
            filter.idViaTramo = { $in: viaIds };
        }
    } else if (filterType === 'sinc-direct') {
        // Siempre filtrar SincEje por idJornada (evita inconsistencias en campos geo de SincEje)
        if (tipoFiltro === 'jornada') {
            if (!Types.ObjectId.isValid(valorFiltro)) return null;
            const jid    = new Types.ObjectId(valorFiltro);
            const jidStr = String(jid);
            Object.assign(filter, { $or: [{ idJornada: jid }, { idJornada: jidStr }] });
        } else {
            // municipio o departamento: derivar IDs de Jornada y filtrar SincEje por idJornada
            // Jornada usa 'dpto' para departamento
            const jorField = tipoFiltro === 'departamento' ? 'dpto' : 'municipio';
            const jorns = await Jornada.find({
                [jorField]: { $regex: new RegExp(`^${safe}$`, 'i') }
            }).select('_id').lean();
            if (!jorns.length) return null;
            const jorIds    = jorns.map(j => j._id);
            const jorStrIds = jorns.map(j => String(j._id));
            Object.assign(filter, { $or: [{ idJornada: { $in: jorIds } }, { idJornada: { $in: jorStrIds } }] });
        }
    } else if (filterType === 'sinc-eje') {
        // Tablas hijas de SincEje: filtrar por idEje
        if (!ejeIds || ejeIds.length === 0) return null;
        filter.idEje = { $in: ejeIds };
    } else if (filterType === 'direct-categ') {
        if (tipoFiltro === 'departamento') {
            applyFlexibleFieldToFilter(filter, 'departamento', valorFiltro);
        } else if (tipoFiltro === 'municipio') {
            applyFlexibleFieldToFilter(filter, 'municipio', valorFiltro);
        } else if (tipoFiltro === 'jornada') {
            if (!Types.ObjectId.isValid(valorFiltro)) return null;
            const jid = new Types.ObjectId(valorFiltro);
            const jidStr = String(jid);
            /** Documentos vinculados por idJornada (colección categorizacionvials) o por geo de tramos (legacy). */
            const idJornadaBranches = [{ idJornada: jid }, { idJornada: jidStr }];
            /**
             * Pares (departamento, municipio) únicos en vía-tramos de la jornada.
             * idJornada puede estar como ObjectId o string; se usa agregación + $match amplio.
             * Incluye coincidencia exacta (como en BD) y ramas regex (tildes / mayúsculas).
             */
            const rows = await ViaTramo.aggregate([
                { $match: matchIdJornadaClause(jid) },
                {
                    $match: {
                        departamento: { $exists: true, $nin: ['', null] },
                        municipio: { $exists: true, $nin: ['', null] }
                    }
                },
                { $group: { _id: { d: '$departamento', m: '$municipio' } } }
            ]);
            const seen = new Set();
            const orBranches = [...idJornadaBranches];
            for (const row of rows) {
                const d = row._id && row._id.d != null ? String(row._id.d).trim() : '';
                const m = row._id && row._id.m != null ? String(row._id.m).trim() : '';
                if (!d || !m) continue;
                const sig = `${foldDiacritics(d)}|${foldDiacritics(m)}`;
                if (seen.has(sig)) continue;
                seen.add(sig);
                orBranches.push({ departamento: d, municipio: m });
                const flex = matchDeptMunPair(d, m);
                if (flex) orBranches.push(flex);
            }
            if (orBranches.length === idJornadaBranches.length) {
                const j = await Jornada.findById(jid).select('dpto municipio').lean();
                if (j && (j.dpto || j.municipio)) {
                    const d = String(j.dpto || '').trim();
                    const m = String(j.municipio || '').trim();
                    if (d && m) {
                        const sig = `${foldDiacritics(d)}|${foldDiacritics(m)}`;
                        if (!seen.has(sig)) {
                            seen.add(sig);
                            orBranches.push({ departamento: d, municipio: m });
                            const flex = matchDeptMunPair(d, m);
                            if (flex) orBranches.push(flex);
                        }
                    }
                }
            }
            filter.$or = orBranches;
        }
    }

    return appendFechaCreacionToFilter(filter, fechaDesde, fechaHasta);
}

/** Consulta una tabla en lotes y reporta progreso */
async function collectTableData(model, filter, onProgress) {
    const total = await model.countDocuments(filter);
    onProgress(0, total);

    const rows      = [];
    const photoUrls = new Set();
    let skip = 0;

    while (true) {
        const batch = await model.find(filter).lean().skip(skip).limit(BATCH_READ);
        if (!batch.length) break;

        for (const rec of batch) {
            rows.push(serializeForExcel(rec));
            extractPhotoUrls(rec).forEach(u => photoUrls.add(u));
        }

        skip += batch.length;
        onProgress(skip, total);
        await sleep();
    }

    return { rows, photoUrls: Array.from(photoUrls), total };
}

/** Devuelve todos los archivos de un directorio recursivamente */
function getAllFiles(dir) {
    const result = [];
    if (!fs.existsSync(dir)) return result;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) result.push(...getAllFiles(full));
        else result.push(full);
    }
    return result;
}

/** Restaura ObjectIds y Dates en un objeto plano para re-insertar */
function restoreObjectIds(row) {
    const doc = { ...row };

    const OID_FIELDS = [
        '_id', 'idJornada', 'idViaTramo', 'idControSem', 'idEje',
        'zat', 'comuna', 'barrio', 'perfilEsquema',
        'obs1', 'obs2', 'obs3', 'obs4', 'obs5', 'obs6',
        'creadoPor', 'modificadoPor'
    ];
    for (const f of OID_FIELDS) {
        if (doc[f] && typeof doc[f] === 'string' && Types.ObjectId.isValid(doc[f])) {
            doc[f] = new Types.ObjectId(doc[f]);
        }
    }

    const DATE_FIELDS = [
        'fechaCreacion', 'fechaModificacion', 'fechaInv',
        'fechaInst', 'fechaAccion', 'fechaInicio',
        'fechaJornada', 'horaInicio', 'fechaClasificacion'
    ];
    for (const f of DATE_FIELDS) {
        if (doc[f] && typeof doc[f] === 'string') {
            const d = new Date(doc[f]);
            if (!isNaN(d.getTime())) doc[f] = d;
        }
    }

    return doc;
}

// ── Job de exportación ────────────────────────────────────────────────────────
async function runExportJob(jobId, tipoFiltro, valorFiltro, fechaDesde, fechaHasta, tablasSeleccionadas) {
    const job = jobs.get(jobId);
    if (!job) return;

    try {
        // Pre-calcular viaIds y ejeIds para filtros por dept/municipio/jornada
        const safe = escapeRegex(valorFiltro);
        let viaIds = null;
        let ejeIds = null;
        if (tipoFiltro === 'departamento' || tipoFiltro === 'municipio') {
            const geoFilter = tipoFiltro === 'departamento'
                ? { departamento: { $regex: new RegExp(`^${safe}$`, 'i') } }
                : { municipio:    { $regex: new RegExp(`^${safe}$`, 'i') } };
            if (fechaDesde || fechaHasta) {
                geoFilter.fechaCreacion = {};
                if (fechaDesde) geoFilter.fechaCreacion.$gte = new Date(fechaDesde);
                if (fechaHasta) geoFilter.fechaCreacion.$lte = new Date(fechaHasta + 'T23:59:59.999Z');
            }
                // viaIds: filtro geo directo en ViaTramo
            const vias = await ViaTramo.find(geoFilter).select('_id').lean();
            viaIds = vias.map(v => v._id);

            // ejeIds: buscar via Jornada para evitar inconsistencias en SincEje.departamento/municipio
            // Jornada usa 'dpto' para departamento (no 'departamento')
            const jorField = tipoFiltro === 'departamento' ? 'dpto' : 'municipio';
            const jorns = await Jornada.find({
                [jorField]: { $regex: new RegExp(`^${safe}$`, 'i') }
            }).select('_id').lean();
            const jorIds    = jorns.map(j => j._id);
            const jorStrIds = jorns.map(j => String(j._id));
            const ejes = await SincEje.find({
                $or: [{ idJornada: { $in: jorIds } }, { idJornada: { $in: jorStrIds } }]
            }).select('_id').lean();
            ejeIds = ejes.map(e => e._id);
            console.log(`[dt] viaIds:${viaIds.length} jorns:${jorns.length} ejeIds:${ejeIds.length}`);

        } else if (tipoFiltro === 'jornada' && Types.ObjectId.isValid(valorFiltro)) {
            const jid    = new Types.ObjectId(valorFiltro);
            const jidStr = String(jid);
            // idJornada en SincEje puede estar guardado como ObjectId o string
            const ejes = await SincEje.find({
                $or: [{ idJornada: jid }, { idJornada: jidStr }]
            }).select('_id').lean();
            ejeIds = ejes.map(e => e._id);
            console.log(`[data-transfer] jornada=${valorFiltro} → ejeIds: ${ejeIds.length}`);
        }

        const tablas = ALL_TABLES.filter(t => tablasSeleccionadas.includes(t.key));

        // Inicializar progreso
        for (const t of tablas) {
            job.tables[t.key] = { label: t.label, total: 0, current: 0, ok: 0, err: 0, status: 'pending' };
        }

        // Recopilar datos tabla por tabla
        const tableData   = {};
        const allPhotoSet = new Set();

        for (const t of tablas) {
            job.tables[t.key].status = 'running';

            const isCatalog = CATALOG_TABLES.some(c => c.key === t.key);
            const filter = isCatalog
                ? {}
                : await buildFilter(t.filterType, tipoFiltro, valorFiltro, viaIds, ejeIds, fechaDesde, fechaHasta);

            console.log(`[dt:export] tabla=${t.key} filterType=${t.filterType} filter=${filter === null ? 'NULL' : JSON.stringify(filter)}`);

            if (filter === null) {
                job.tables[t.key].status = 'done';
                tableData[t.key] = { rows: [] };
                continue;
            }

            const { rows, photoUrls, total } = await collectTableData(
                t.model,
                filter,
                (current, ttl) => {
                    job.tables[t.key].current = current;
                    job.tables[t.key].total   = ttl;
                    job.tables[t.key].ok      = current;
                }
            );

            tableData[t.key] = { rows };
            photoUrls.forEach(u => allPhotoSet.add(u));
            job.tables[t.key].ok     = total;
            job.tables[t.key].status = 'done';
        }

        // Construir XLSX en memoria
        const wb = XLSX.utils.book_new();
        for (const t of tablas) {
            const rows = tableData[t.key]?.rows || [];
            const ws   = rows.length > 0
                ? XLSX.utils.json_to_sheet(rows)
                : XLSX.utils.aoa_to_sheet([['Sin registros para este filtro']]);
            XLSX.utils.book_append_sheet(wb, ws, t.key.slice(0, 31));
        }
        const xlsxBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        // Construir ZIP con datos.xlsx + fotos
        const photoList = Array.from(allPhotoSet);
        job.photos.total = photoList.length;

        const zipName = `infravial-export-${Date.now()}.zip`;
        const zipPath = path.join(EXPORTS_DIR, zipName);

        await new Promise((resolve, reject) => {
            const output  = fs.createWriteStream(zipPath);
            const archive = archiver('zip', { zlib: { level: 6 } });

            output.on('close', resolve);
            archive.on('error', reject);
            archive.pipe(output);

            // Archivo Excel
            archive.append(xlsxBuffer, { name: 'datos.xlsx' });

            // Fotos
            let photoIdx = 0;
            for (const url of photoList) {
                // url = /uploads/fotos/via-tramos/xxx.jpg
                // → dentro del zip: uploads/fotos/via-tramos/xxx.jpg
                const relPath  = url.replace(/^\/uploads\//, '');
                const filePath = path.join(UPLOADS_DIR, relPath);
                if (fs.existsSync(filePath)) {
                    archive.file(filePath, { name: `uploads/${relPath}` });
                    job.photos.ok++;
                } else {
                    job.photos.err++;
                }
                photoIdx++;
                job.photos.current = photoIdx;
            }

            archive.finalize();
        });

        job.zipPath = zipPath;
        job.zipName = zipName;
        job.status  = 'done';

    } catch (err) {
        job.status = 'error';
        job.error  = err.message || String(err);
    }
}

// ── Job de importación ────────────────────────────────────────────────────────
async function runImportJob(jobId, zipPath, dryRun) {
    const job = jobs.get(jobId);
    if (!job) return;

    const extractDir = path.join(IMPORTS_TMP_DIR, jobId);

    try {
        await fs.promises.mkdir(extractDir, { recursive: true });

        // Extraer ZIP
        await new Promise((resolve, reject) => {
            fs.createReadStream(zipPath)
                .pipe(unzipper.Extract({ path: extractDir }))
                .on('close', resolve)
                .on('error', reject);
        });

        // Verificar que exista datos.xlsx
        const xlsxPath = path.join(extractDir, 'datos.xlsx');
        if (!fs.existsSync(xlsxPath)) {
            throw new Error('El ZIP no contiene datos.xlsx. Usa solo archivos exportados por InfraVial.');
        }

        const wb = XLSX.readFile(xlsxPath);

        // Ordenar hojas según el orden de dependencias de ALL_TABLES
        // (Jornadas → Catálogos → ViaTramos → Señales/Semáforos)
        const orderedKeys = ALL_TABLES.map(t => t.key).filter(k => wb.SheetNames.includes(k));

        // Inicializar progreso por hoja (en orden correcto)
        for (const sheetName of orderedKeys) {
            const conf = ALL_TABLES.find(t => t.key === sheetName);
            if (!conf) continue;
            const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName]);
            if (rows.length === 0 || (rows.length === 1 && rows[0]['Sin registros para este filtro'])) {
                continue;
            }
            job.tables[sheetName] = {
                label: conf.label, total: rows.length, current: 0, ok: 0, err: 0, status: 'pending'
            };
        }

        // Importar hoja por hoja EN ORDEN DE DEPENDENCIAS
        for (const sheetName of orderedKeys) {
            const conf = ALL_TABLES.find(t => t.key === sheetName);
            if (!conf || !job.tables[sheetName]) continue;

            const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName]);
            job.tables[sheetName].status = 'running';

            let ok = 0, err = 0;

            for (let i = 0; i < rows.length; i += BATCH_WRITE) {
                const batch = rows.slice(i, i + BATCH_WRITE);

                for (const row of batch) {
                    try {
                        if (!dryRun) {
                            const doc = restoreObjectIds(deserializeFromExcel(row));
                            await conf.model.create(doc).catch(e => {
                                if (e.code === 11000) return; // duplicado, saltar
                                const msg = e.message || String(e);
                                console.error(`[import][${sheetName}] create error: ${msg}`);
                                throw e;
                            });
                        }
                        ok++;
                    } catch (e) {
                        err++;
                    }
                }

                job.tables[sheetName].current = Math.min(i + BATCH_WRITE, rows.length);
                job.tables[sheetName].ok      = ok;
                job.tables[sheetName].err     = err;
                await sleep();
            }

            job.tables[sheetName].status = 'done';
        }

        // Copiar fotos
        const uploadsExtDir = path.join(extractDir, 'uploads');
        if (fs.existsSync(uploadsExtDir)) {
            const photoFiles = getAllFiles(uploadsExtDir);
            job.photos.total = photoFiles.length;

            for (let i = 0; i < photoFiles.length; i += 20) {
                const batch = photoFiles.slice(i, i + 20);
                for (const srcPath of batch) {
                    try {
                        const relPath = srcPath.replace(uploadsExtDir, '').replace(/\\/g, '/');
                        const destPath = path.join(UPLOADS_DIR, relPath);
                        const destDir  = path.dirname(destPath);
                        if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
                        if (!dryRun && !fs.existsSync(destPath)) {
                            fs.copyFileSync(srcPath, destPath);
                        }
                        job.photos.ok++;
                    } catch {
                        job.photos.err++;
                    }
                    job.photos.current++;
                }
                await sleep();
            }
        }

        job.status = 'done';

    } catch (err) {
        job.status = 'error';
        job.error  = err.message || String(err);
    } finally {
        // Limpiar archivos temporales
        try { fs.rmSync(extractDir, { recursive: true, force: true }); } catch { /* ignorar */ }
        try { fs.unlinkSync(zipPath); } catch { /* ignorar */ }
    }
}

// ── Multer para ZIP ───────────────────────────────────────────────────────────
const uploadZip = multer({
    dest: IMPORTS_TMP_DIR,
    fileFilter: (_req, file, cb) => {
        const ext = path.extname(file.originalname || '').toLowerCase();
        if (ext === '.zip') return cb(null, true);
        cb(new Error('Solo se permiten archivos ZIP exportados por InfraVial'));
    },
    limits: { fileSize: 500 * 1024 * 1024 }
});

// ── Handlers HTTP ─────────────────────────────────────────────────────────────
async function getOpciones(req, res) {
    try {
        const [departamentos, municipios, jornadas] = await Promise.all([
            ViaTramo.distinct('departamento'),
            ViaTramo.distinct('municipio'),
            Jornada.find({}).select('_id municipio dpto supervisor estado fechaInicio').sort({ fechaInicio: -1 }).lean()
        ]);
        res.json({
            departamentos: departamentos.filter(Boolean).sort(),
            municipios:    municipios.filter(Boolean).sort(),
            jornadas
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function startExport(req, res) {
    const { tipoFiltro, valorFiltro, fechaDesde, fechaHasta, tablas } = req.body;

    if (!tipoFiltro || !valorFiltro) {
        return res.status(400).json({ message: 'Debes seleccionar un tipo de filtro y su valor.' });
    }
    if (!Array.isArray(tablas) || !tablas.length) {
        return res.status(400).json({ message: 'Debes seleccionar al menos una tabla para exportar.' });
    }

    const jobId = createJob('export');
    runExportJob(jobId, tipoFiltro, valorFiltro, fechaDesde || null, fechaHasta || null, tablas);
    res.json({ jobId });
}

async function startImport(req, res) {
    if (!req.file?.path) {
        return res.status(400).json({ message: 'Debes adjuntar el archivo ZIP exportado.' });
    }
    const dryRun = req.body?.dryRun === 'true';
    const jobId  = createJob('import');
    runImportJob(jobId, req.file.path, dryRun);
    res.json({ jobId });
}

// SSE: token via query param (EventSource no soporta headers)
function getProgress(req, res) {
    const { token } = req.query;
    let user = null;
    try { user = token ? jwt.verify(token, process.env.SECRET_KEY) : null; } catch { /* ignore */ }
    if (!user || user.rol !== 'admin') {
        return res.status(403).json({ message: 'Sin autorización' });
    }

    const { jobId } = req.params;
    if (!jobs.has(jobId)) return res.status(404).json({ message: 'Job no encontrado' });

    res.setHeader('Content-Type',  'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection',    'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const send = (data) => {
        try { res.write(`data: ${JSON.stringify(data)}\n\n`); } catch { /* ignorar si cerró */ }
    };

    const interval = setInterval(() => {
        const j = jobs.get(jobId);
        if (!j) { clearInterval(interval); res.end(); return; }

        send({ type: 'snapshot', tables: j.tables, photos: j.photos, status: j.status, error: j.error });

        if (j.status === 'done') {
            send({ type: 'complete', jobId, jobType: j.type });
            clearInterval(interval);
            res.end();
        } else if (j.status === 'error') {
            clearInterval(interval);
            res.end();
        }
    }, 300);

    req.on('close', () => clearInterval(interval));
}

function downloadExport(req, res) {
    const { jobId } = req.params;
    const job = jobs.get(jobId);
    if (!job || job.type !== 'export' || job.status !== 'done') {
        return res.status(404).json({ message: 'Exportación no disponible o aún en proceso.' });
    }
    if (!job.zipPath || !fs.existsSync(job.zipPath)) {
        return res.status(404).json({ message: 'Archivo ZIP no encontrado en el servidor.' });
    }
    res.setHeader('Content-Disposition', `attachment; filename="${job.zipName}"`);
    res.setHeader('Content-Type', 'application/zip');
    res.sendFile(job.zipPath);
}

module.exports = {
    uploadZip,
    getOpciones,
    startExport,
    startImport,
    getProgress,
    downloadExport
};
