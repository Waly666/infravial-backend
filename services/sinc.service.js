const SincEje                = require('../models/SincEje');
const SincFotoEje            = require('../models/SincFotoEje');
const SincPrs                = require('../models/SincPrs');
const SincPropiedades        = require('../models/SincPropiedades');
const SincPuente             = require('../models/SincPuente');
const SincMuro               = require('../models/SincMuro');
const SincTunel              = require('../models/SincTunel');
const SincSitioCritico       = require('../models/SincSitioCritico');
const SincObraDrenaje        = require('../models/SincObraDrenaje');
// Nivel Detallado Mc (17 capas)
const { MC_REGISTRY, ...SincMcModels } = require('../models/SincMc');

// ─── EJE ────────────────────────────────────────────────────────────────────

async function getAllEjes(filtros = {}) {
    const query = {};
    if (filtros.idJornada) query.idJornada = filtros.idJornada;
    if (filtros.tipoRed)   query.tipoRed   = filtros.tipoRed;
    if (filtros.codigoVia) query.codigoVia = new RegExp(filtros.codigoVia, 'i');
    return await SincEje.find(query)
        .populate('idJornada', 'municipio dpto fechaJornada estado')
        .populate('creadoPor', 'nombre')
        .sort({ fechaCreacion: -1 });
}

async function getEjeById(id) {
    return await SincEje.findById(id)
        .populate('idJornada', 'municipio dpto codMunicipio codDepto fechaJornada estado')
        .populate('creadoPor', 'nombre')
        .populate('modificadoPor', 'nombre');
}

async function createEje(data, userId) {
    const eje = new SincEje({ ...data, creadoPor: userId, fechaCreacion: new Date() });
    return await eje.save();
}

async function updateEje(id, data, userId) {
    data.modificadoPor     = userId;
    data.fechaModificacion = new Date();
    return await SincEje.findByIdAndUpdate(id, data, { new: true, runValidators: true });
}

async function removeEje(id) {
    // Eliminar en cascada todos los elementos del eje (básico + detallado)
    await Promise.all([
        SincFotoEje.deleteMany({ idEje: id }),
        SincPrs.deleteMany({ idEje: id }),
        SincPropiedades.deleteMany({ idEje: id }),
        SincPuente.deleteMany({ idEje: id }),
        SincMuro.deleteMany({ idEje: id }),
        SincTunel.deleteMany({ idEje: id }),
        SincSitioCritico.deleteMany({ idEje: id }),
        SincObraDrenaje.deleteMany({ idEje: id }),
        // Nivel Detallado Mc (17 capas)
        ...Object.values(MC_REGISTRY).map(M => M.deleteMany({ idEje: id }))
    ]);
    return await SincEje.findByIdAndDelete(id);
}

// ─── FOTO EJE ────────────────────────────────────────────────────────────────

async function getFotosByEje(idEje) {
    return await SincFotoEje.find({ idEje }).sort({ numPr: 1 });
}

async function createFotoEje(data, userId) {
    return await new SincFotoEje({ ...data, creadoPor: userId }).save();
}

async function updateFotoEje(id, data, userId) {
    data.modificadoPor = userId; data.fechaModificacion = new Date();
    return await SincFotoEje.findByIdAndUpdate(id, data, { new: true, runValidators: true });
}

async function removeFotoEje(id) {
    return await SincFotoEje.findByIdAndDelete(id);
}

// ─── PRS ────────────────────────────────────────────────────────────────────

async function getPrsByEje(idEje) {
    return await SincPrs.find({ idEje }).sort({ abscisa: 1 });
}

async function createPrs(data, userId) {
    return await new SincPrs({ ...data, creadoPor: userId }).save();
}

async function updatePrs(id, data, userId) {
    data.modificadoPor = userId; data.fechaModificacion = new Date();
    return await SincPrs.findByIdAndUpdate(id, data, { new: true, runValidators: true });
}

async function removePrs(id) {
    return await SincPrs.findByIdAndDelete(id);
}

// ─── PROPIEDADES ─────────────────────────────────────────────────────────────

/** GeoJSON LineString válido para índice 2dsphere (≥ 2 posiciones [lng,lat]). */
function sanitizeSincPropiedadesUbicacion(doc) {
    const u = doc.ubicacion;
    if (u === undefined) return;
    if (u === null || typeof u !== 'object') {
        delete doc.ubicacion;
        return;
    }
    const coords = u.coordinates;
    const ok =
        u.type === 'LineString' &&
        Array.isArray(coords) &&
        coords.length >= 2 &&
        coords.every(
            (p) =>
                Array.isArray(p) &&
                p.length >= 2 &&
                Number.isFinite(Number(p[0])) &&
                Number.isFinite(Number(p[1]))
        );
    if (!ok) delete doc.ubicacion;
}

/** Validación Tabla 5 — Capa PROPIEDADES (SINC v5). */
function validateSincPropiedadesTabla5(doc) {
    const err = (m) => {
        throw new Error(m);
    };
    const isInt = (n) => {
        const x = Number(n);
        return Number.isFinite(x) && Math.floor(x) === x;
    };

    const cv = String(doc.codigoVia ?? '').trim();
    if (cv.length < 4 || cv.length > 25) {
        err('CODIGOVIA: texto de 4 a 25 caracteres (Tabla 5).');
    }

    if (doc.fecha == null || doc.fecha === '') {
        err('FECHA: obligatoria (AAAA-MM-DD).');
    }
    const fd = doc.fecha instanceof Date ? doc.fecha : new Date(doc.fecha);
    if (Number.isNaN(fd.getTime())) {
        err('FECHA: fecha inválida.');
    }

    const L = Number(doc.longitud);
    if (!Number.isFinite(L) || L < 1 || L > 250000) {
        err('LONGITUD: número entre 1 y 250 000 m (longitud verdadera).');
    }

    const tt = Number(doc.tipoTerr);
    if (!isInt(tt) || tt < 1 || tt > 4) {
        err('TIPOTERR: entero entre 1 y 4.');
    }

    const pend = Number(doc.pendiente);
    if (!Number.isFinite(pend) || pend < -45 || pend > 45) {
        err('PENDIENTE: entre −45 y 45 grados sexagesimales.');
    }

    const ts = Number(doc.tipoSuperf);
    if (!isInt(ts) || ts < 1 || ts > 8) {
        err('TIPOSUPERF: entero entre 1 y 8.');
    }

    const es = Number(doc.estado);
    if (!isInt(es) || es < 1 || es > 5) {
        err('ESTADO: entero entre 1 y 5.');
    }

    const nc = Number(doc.numCarr);
    if (!isInt(nc) || nc < 1 || nc > 10) {
        err('NUMCARR: entero entre 1 y 10.');
    }

    const ac = Number(doc.ancoCarr);
    if (!Number.isFinite(ac) || ac < 1 || ac > 5) {
        err('ANCOCARR: entre 1 y 5 m.');
    }

    const ab = Number(doc.anchoBer);
    if (!Number.isFinite(ab) || ab < 0 || ab > 6) {
        err('ANCHOBERMA: entre 0 y 6 m; 0 si no existe.');
    }
    if (ab > 0 && ab < 0.4) {
        err('ANCHOBERMA: si hay berma, mínimo 0,4 m; si no hay, use 0.');
    }

    const acu = Number(doc.anchoCunt);
    if (!Number.isFinite(acu) || acu < 0 || acu > 4) {
        err('ANCHOCUNT: entre 0 y 4 m; 0 si no existe.');
    }
    if (acu > 0 && acu < 0.1) {
        err('ANCHOCUNT: si hay cuneta, mínimo 0,1 m; si no hay, use 0.');
    }

    const asep = Number(doc.anchoSepar);
    if (!Number.isFinite(asep) || asep < 0 || asep > 50) {
        err('ANCHOSEPAR: entre 0 y 50 m; 0 si no existe.');
    }
    if (asep > 0 && asep < 0.1) {
        err('ANCHOSEPAR: si hay separador en la calzada, mínimo 0,1 m; si no hay, use 0.');
    }

    const cm = Number(doc.codMunicipio);
    const cd = Number(doc.codDepartamento);
    if (!isInt(cm) || cm < 1) {
        err('COD_MUNICIPIO: código DANE obligatorio.');
    }
    if (!isInt(cd) || cd < 1 || cd > 999) {
        err('COD_DEPARTAMENTO: código DANE obligatorio.');
    }

    const mu = String(doc.municipio ?? '').trim();
    const de = String(doc.departamento ?? '').trim();
    if (mu.length < 4 || mu.length > 25) {
        err('MUNICIPIO: texto de 4 a 25 caracteres.');
    }
    if (de.length < 4 || de.length > 25) {
        err('DEPARTAMENTO: texto de 4 a 25 caracteres.');
    }

    const obs = doc.obs;
    if (obs != null && String(obs).trim() !== '') {
        const o = String(obs).trim();
        if (o.length < 10 || o.length > 250) {
            err('OBS: si se diligencia, entre 10 y 250 caracteres.');
        }
    }

    if (doc.abscisaIni != null || doc.abscisaFin != null) {
        const ai = doc.abscisaIni != null ? Number(doc.abscisaIni) : null;
        const af = doc.abscisaFin != null ? Number(doc.abscisaFin) : null;
        if (ai != null && (!Number.isFinite(ai) || ai < 0)) {
            err('ABSCISAI: número ≥ 0 (km sobre el eje).');
        }
        if (af != null && (!Number.isFinite(af) || af < 0)) {
            err('ABSCISAF: número ≥ 0 (km sobre el eje).');
        }
        if (ai != null && af != null && af < ai) {
            err('ABSCISAF debe ser mayor o igual que ABSCISAI.');
        }
    }
}

async function getPropiedadesByEje(idEje) {
    return await SincPropiedades.find({ idEje }).sort({ abscisaIni: 1 });
}

async function createPropiedades(data, userId) {
    const doc = { ...data, creadoPor: userId };
    validateSincPropiedadesTabla5(doc);
    sanitizeSincPropiedadesUbicacion(doc);
    return await new SincPropiedades(doc).save();
}

async function updatePropiedades(id, data, userId) {
    const hadUbicacion = Object.prototype.hasOwnProperty.call(data, 'ubicacion');
    const doc = { ...data, modificadoPor: userId, fechaModificacion: new Date() };
    validateSincPropiedadesTabla5(doc);
    sanitizeSincPropiedadesUbicacion(doc);
    if (hadUbicacion && doc.ubicacion === undefined) {
        const { ubicacion: _u, ...rest } = doc;
        return await SincPropiedades.findByIdAndUpdate(
            id,
            { $set: rest, $unset: { ubicacion: '' } },
            { new: true, runValidators: true }
        );
    }
    return await SincPropiedades.findByIdAndUpdate(id, doc, { new: true, runValidators: true });
}

async function removePropiedades(id) {
    return await SincPropiedades.findByIdAndDelete(id);
}

// ─── PUENTES ─────────────────────────────────────────────────────────────────

/** GeoJSON Point válido para índice 2dsphere (Tabla 7 — inicio del puente). */
function sanitizeSincPuenteUbicacion(doc) {
    const u = doc.ubicacion;
    if (u === undefined) return;
    if (u === null || typeof u !== 'object') {
        delete doc.ubicacion;
        return;
    }
    const c = u.coordinates;
    const ok =
        u.type === 'Point' &&
        Array.isArray(c) &&
        c.length >= 2 &&
        Number.isFinite(Number(c[0])) &&
        Number.isFinite(Number(c[1]));
    if (!ok) delete doc.ubicacion;
}

/** Validación Tabla 7 — Capa PUENTES (SINC v5). */
function validateSincPuenteTabla7(doc) {
    const err = (m) => {
        throw new Error(m);
    };
    const isInt = (n) => {
        const x = Number(n);
        return Number.isFinite(x) && Math.floor(x) === x;
    };

    const cv = String(doc.codigoVia ?? '').trim();
    if (cv.length < 4 || cv.length > 25) {
        err('CODIGOVIA: texto de 4 a 25 caracteres (Tabla 7).');
    }

    if (doc.fecha == null || doc.fecha === '') {
        err('FECHA: obligatoria (AAAA-MM-DD).');
    }
    const fd = doc.fecha instanceof Date ? doc.fecha : new Date(doc.fecha);
    if (Number.isNaN(fd.getTime())) {
        err('FECHA: fecha inválida.');
    }

    const lon = Number(doc.longitud);
    if (!Number.isFinite(lon) || lon < 1 || lon > 4000) {
        err('LONGITUD: número entre 1 y 4 000 m (longitud verdadera del puente).');
    }

    const di = Number(doc.distIni);
    if (!Number.isFinite(di) || di < 0 || di > 250000) {
        err('DISTINI: distancia desde el inicio de la vía hasta el inicio del puente, entre 0 y 250 000 m.');
    }

    const nom = String(doc.nombre ?? '').trim();
    if (nom.length < 3 || nom.length > 100) {
        err('NOMBRE: texto de 3 a 100 caracteres.');
    }

    const at = Number(doc.anchoTable);
    if (!Number.isFinite(at) || at < 2 || at > 30) {
        err('ANCHOTABLE: ancho del tablero entre 2 y 30 m.');
    }

    const nl = Number(doc.numLuces);
    if (!isInt(nl) || nl < 0 || nl > 20) {
        err('NUMLUCES: entero entre 0 y 20.');
    }

    const es = Number(doc.estadoSup);
    if (!isInt(es) || es < 1 || es > 4) {
        err('Estado superficie (ESTADOSUP): entero 1–4 (1 Bueno · 2 Regular · 3 Malo · 4 Intransitable).');
    }

    const ee = Number(doc.estadoEst);
    if (!isInt(ee) || ee < 1 || ee > 4) {
        err('Estado estructura (ESTADOEST): entero 1–4 (1 Bueno · 2 Regular · 3 Malo · 4 No funcional).');
    }

    const foto = String(doc.foto ?? '').trim();
    const rf = String(doc.rutaFoto ?? '').trim();
    const sinFoto = foto.length === 0 && rf.length === 0;
    if (!sinFoto) {
        if (foto.length < 4 || foto.length > 50) {
            err('FOTO: entre 4 y 50 caracteres, o deje FOTO y RUTAFOTO vacíos para agregar la imagen después.');
        }
        if (rf.length < 10 || rf.length > 250) {
            err('RUTAFOTO: entre 10 y 250 caracteres, o deje ambos vacíos para agregar la imagen después.');
        }
    }

    const cm = Number(doc.codMunicipio);
    const cd = Number(doc.codDepartamento);
    if (!isInt(cm) || cm < 1) {
        err('COD_MUNICIPIO: código DANE obligatorio (DmMunicipio).');
    }
    if (!isInt(cd) || cd < 1 || cd > 999) {
        err('COD_DEPARTAMENTO: código DANE obligatorio (DmDepartamento).');
    }

    const mu = String(doc.municipio ?? '').trim();
    const de = String(doc.departamento ?? '').trim();
    if (mu.length < 4 || mu.length > 25) {
        err('MUNICIPIO: texto de 4 a 25 caracteres.');
    }
    if (de.length < 4 || de.length > 25) {
        err('DEPARTAMENTO: texto de 4 a 25 caracteres.');
    }

    const u = doc.ubicacion;
    if (!u || typeof u !== 'object' || u.type !== 'Point') {
        err('Geometría: se requiere un punto (inicio del puente en sentido del abscisado).');
    }
    const c = u.coordinates;
    if (!Array.isArray(c) || c.length < 2 || !Number.isFinite(Number(c[0])) || !Number.isFinite(Number(c[1]))) {
        err('Geometría: coordenadas del punto inválidas.');
    }

    const obs = doc.obs;
    if (obs != null && String(obs).trim() !== '') {
        const o = String(obs).trim();
        if (o.length < 10 || o.length > 250) {
            err('OBS: si se diligencia, entre 10 y 250 caracteres.');
        }
    }
}

async function getPuentesByEje(idEje) {
    return await SincPuente.find({ idEje }).sort({ distIni: 1 });
}

async function getPuenteById(id) {
    return await SincPuente.findById(id).populate('idEje', 'codigoVia nombreVia');
}

async function createPuente(data, userId) {
    const doc = { ...data, creadoPor: userId };
    sanitizeSincPuenteUbicacion(doc);
    validateSincPuenteTabla7(doc);
    return await new SincPuente(doc).save();
}

async function updatePuente(id, data, userId) {
    const hadUbicacion = Object.prototype.hasOwnProperty.call(data, 'ubicacion');
    const doc = { ...data, modificadoPor: userId, fechaModificacion: new Date() };
    sanitizeSincPuenteUbicacion(doc);
    validateSincPuenteTabla7(doc);
    if (hadUbicacion && doc.ubicacion === undefined) {
        const { ubicacion: _u, ...rest } = doc;
        return await SincPuente.findByIdAndUpdate(
            id,
            { $set: rest, $unset: { ubicacion: '' } },
            { new: true, runValidators: true }
        );
    }
    return await SincPuente.findByIdAndUpdate(id, doc, { new: true, runValidators: true });
}

async function removePuente(id) {
    return await SincPuente.findByIdAndDelete(id);
}

// ─── MUROS ───────────────────────────────────────────────────────────────────

function sanitizeSincMuroUbicacion(doc) {
    const u = doc.ubicacion;
    if (u === undefined) return;
    if (u === null || typeof u !== 'object') {
        delete doc.ubicacion;
        return;
    }
    const c = u.coordinates;
    const ok =
        u.type === 'Point' &&
        Array.isArray(c) &&
        c.length >= 2 &&
        Number.isFinite(Number(c[0])) &&
        Number.isFinite(Number(c[1]));
    if (!ok) delete doc.ubicacion;
}

/** Tabla 8 — Capa MUROS (SINC v5). FOTO/RUTAFOTO opcionales. */
function validateSincMuroTabla8(doc) {
    const err = (m) => {
        throw new Error(m);
    };
    const isInt = (n) => {
        const x = Number(n);
        return Number.isFinite(x) && Math.floor(x) === x;
    };

    const cv = String(doc.codigoVia ?? '').trim();
    if (cv.length < 4 || cv.length > 25) {
        err('CODIGOVIA: texto de 4 a 25 caracteres (Tabla 8).');
    }

    if (doc.fecha == null || doc.fecha === '') {
        err('FECHA: obligatoria (AAAA-MM-DD).');
    }
    const fd = doc.fecha instanceof Date ? doc.fecha : new Date(doc.fecha);
    if (Number.isNaN(fd.getTime())) {
        err('FECHA: fecha inválida.');
    }

    const lon = Number(doc.longitud);
    if (!Number.isFinite(lon) || lon < 2 || lon > 500) {
        err('LONGITUD: número entre 2 y 500 m (longitud verdadera del muro).');
    }

    const di = Number(doc.distIni);
    if (!Number.isFinite(di) || di < 0 || di > 250000) {
        err('DISTINI: distancia desde el inicio de la vía hasta el inicio del muro, entre 0 y 250 000 m.');
    }

    const ld = Number(doc.lado);
    if (!isInt(ld) || ld < 1 || ld > 2) {
        err('LADO: 1 = sentido A→B · 2 = sentido B→A.');
    }

    const ac = Number(doc.anchoCor);
    if (!Number.isFinite(ac) || ac < 0.1 || ac > 20) {
        err('ANCHOCOR: ancho en corona entre 0,1 y 20 m.');
    }

    const al = Number(doc.altura);
    if (!Number.isFinite(al) || al < 0.1 || al > 50) {
        err('ALTURA: entre 0,1 y 50 m.');
    }

    const foto = String(doc.foto ?? '').trim();
    const rf = String(doc.rutaFoto ?? '').trim();
    const sinFoto = foto.length === 0 && rf.length === 0;
    if (!sinFoto) {
        if (foto.length < 4 || foto.length > 50) {
            err('FOTO: entre 4 y 50 caracteres, o deje FOTO y RUTAFOTO vacíos para agregar la imagen después.');
        }
        if (rf.length < 10 || rf.length > 250) {
            err('RUTAFOTO: entre 10 y 250 caracteres, o deje ambos vacíos.');
        }
    }

    const cm = Number(doc.codMunicipio);
    const cd = Number(doc.codDepartamento);
    if (!isInt(cm) || cm < 1) {
        err('COD_MUNICIPIO: código DANE obligatorio (DmMunicipio).');
    }
    if (!isInt(cd) || cd < 1 || cd > 999) {
        err('COD_DEPARTAMENTO: código DANE obligatorio (DmDepartamento).');
    }

    const mu = String(doc.municipio ?? '').trim();
    const de = String(doc.departamento ?? '').trim();
    if (mu.length < 4 || mu.length > 25) {
        err('MUNICIPIO: texto de 4 a 25 caracteres.');
    }
    if (de.length < 4 || de.length > 25) {
        err('DEPARTAMENTO: texto de 4 a 25 caracteres.');
    }

    const u = doc.ubicacion;
    if (!u || typeof u !== 'object' || u.type !== 'Point') {
        err('Geometría: punto obligatorio al inicio del muro (sentido del abscisado).');
    }
    const c = u.coordinates;
    if (!Array.isArray(c) || c.length < 2 || !Number.isFinite(Number(c[0])) || !Number.isFinite(Number(c[1]))) {
        err('Geometría: coordenadas del punto inválidas.');
    }

    const obs = doc.obs;
    if (obs != null && String(obs).trim() !== '') {
        const o = String(obs).trim();
        if (o.length < 10 || o.length > 250) {
            err('OBS: si se diligencia, entre 10 y 250 caracteres.');
        }
    }
}

async function getMurosByEje(idEje) {
    return await SincMuro.find({ idEje }).sort({ distIni: 1 });
}

async function createMuro(data, userId) {
    const doc = { ...data, creadoPor: userId };
    sanitizeSincMuroUbicacion(doc);
    validateSincMuroTabla8(doc);
    return await new SincMuro(doc).save();
}

async function updateMuro(id, data, userId) {
    const hadUbicacion = Object.prototype.hasOwnProperty.call(data, 'ubicacion');
    const doc = { ...data, modificadoPor: userId, fechaModificacion: new Date() };
    sanitizeSincMuroUbicacion(doc);
    validateSincMuroTabla8(doc);
    if (hadUbicacion && doc.ubicacion === undefined) {
        const { ubicacion: _u, ...rest } = doc;
        return await SincMuro.findByIdAndUpdate(
            id,
            { $set: rest, $unset: { ubicacion: '' } },
            { new: true, runValidators: true }
        );
    }
    return await SincMuro.findByIdAndUpdate(id, doc, { new: true, runValidators: true });
}

async function removeMuro(id) {
    return await SincMuro.findByIdAndDelete(id);
}

// ─── TUNELES ─────────────────────────────────────────────────────────────────

function sanitizeSincTunelUbicacion(doc) {
    const u = doc.ubicacion;
    if (u === undefined) return;
    if (u === null || typeof u !== 'object') {
        delete doc.ubicacion;
        return;
    }
    const c = u.coordinates;
    const ok =
        u.type === 'Point' &&
        Array.isArray(c) &&
        c.length >= 2 &&
        Number.isFinite(Number(c[0])) &&
        Number.isFinite(Number(c[1]));
    if (!ok) delete doc.ubicacion;
}

/** Capa TUNELES (manual SINC): Tabla de campos básicos. */
function validateSincTunelTabla(doc) {
    const err = (m) => {
        throw new Error(m);
    };
    const isInt = (n) => {
        const x = Number(n);
        return Number.isFinite(x) && Math.floor(x) === x;
    };

    const cv = String(doc.codigoVia ?? '').trim();
    if (cv.length < 4 || cv.length > 25) {
        err('CODIGOVIA: texto de 4 a 25 caracteres.');
    }

    if (doc.fecha == null || doc.fecha === '') {
        err('FECHA: obligatoria (AAAA-MM-DD).');
    }
    const fd = doc.fecha instanceof Date ? doc.fecha : new Date(doc.fecha);
    if (Number.isNaN(fd.getTime())) {
        err('FECHA: fecha inválida.');
    }

    const lon = Number(doc.longitud);
    if (!Number.isFinite(lon) || lon < 2 || lon > 10000) {
        err('LONGITUD: número entre 2 y 10 000 m (longitud verdadera del túnel).');
    }

    const di = Number(doc.distIni);
    if (!Number.isFinite(di) || di < 0 || di > 250000) {
        err('DISTINI: distancia desde el inicio de la vía hasta el inicio del túnel, entre 0 y 250 000 m.');
    }

    const nom = String(doc.nombre ?? '').trim();
    if (nom.length < 3 || nom.length > 100) {
        err('NOMBRE: texto de 3 a 100 caracteres.');
    }

    const nc = Number(doc.numCarr);
    if (!isInt(nc) || nc < 1 || nc > 10) {
        err('NUMCARR: entero entre 1 y 10.');
    }

    const ac = Number(doc.ancoCarr);
    if (!Number.isFinite(ac) || ac < 1 || ac > 5) {
        err('ANCOCARR: ancho promedio de carriles entre 1 y 5 m.');
    }

    const es = Number(doc.estado);
    if (!isInt(es) || es < 1 || es > 3) {
        err('ESTADO: 1 = Bueno · 2 = Regular · 3 = Malo.');
    }

    const cm = Number(doc.codMunicipio);
    const cd = Number(doc.codDepartamento);
    if (!isInt(cm) || cm < 1) {
        err('COD_MUNICIPIO: código DANE obligatorio (DmMunicipio).');
    }
    if (!isInt(cd) || cd < 1 || cd > 999) {
        err('COD_DEPARTAMENTO: código DANE obligatorio (DmDepartamento).');
    }

    const mu = String(doc.municipio ?? '').trim();
    const de = String(doc.departamento ?? '').trim();
    if (mu.length < 4 || mu.length > 25) {
        err('MUNICIPIO: texto de 4 a 25 caracteres.');
    }
    if (de.length < 4 || de.length > 25) {
        err('DEPARTAMENTO: texto de 4 a 25 caracteres.');
    }

    const u = doc.ubicacion;
    if (!u || typeof u !== 'object' || u.type !== 'Point') {
        err('Geometría: punto obligatorio al inicio del túnel (sentido del abscisado).');
    }
    const c = u.coordinates;
    if (!Array.isArray(c) || c.length < 2 || !Number.isFinite(Number(c[0])) || !Number.isFinite(Number(c[1]))) {
        err('Geometría: coordenadas del punto inválidas.');
    }

    const obs = doc.obs;
    if (obs != null && String(obs).trim() !== '') {
        const o = String(obs).trim();
        if (o.length < 10 || o.length > 250) {
            err('OBS: si se diligencia, entre 10 y 250 caracteres.');
        }
    }
}

async function getTunelesByEje(idEje) {
    return await SincTunel.find({ idEje }).sort({ distIni: 1 });
}

async function createTunel(data, userId) {
    const doc = { ...data, creadoPor: userId };
    sanitizeSincTunelUbicacion(doc);
    validateSincTunelTabla(doc);
    return await new SincTunel(doc).save();
}

async function updateTunel(id, data, userId) {
    const hadUbicacion = Object.prototype.hasOwnProperty.call(data, 'ubicacion');
    const doc = { ...data, modificadoPor: userId, fechaModificacion: new Date() };
    sanitizeSincTunelUbicacion(doc);
    validateSincTunelTabla(doc);
    if (hadUbicacion && doc.ubicacion === undefined) {
        const { ubicacion: _u, ...rest } = doc;
        return await SincTunel.findByIdAndUpdate(
            id,
            { $set: rest, $unset: { ubicacion: '' } },
            { new: true, runValidators: true }
        );
    }
    return await SincTunel.findByIdAndUpdate(id, doc, { new: true, runValidators: true });
}

async function removeTunel(id) {
    return await SincTunel.findByIdAndDelete(id);
}

// ─── SITIOS CRÍTICOS ─────────────────────────────────────────────────────────

function sanitizeSincSitioUbicacion(doc) {
    const u = doc.ubicacion;
    if (u === undefined) return;
    if (u === null || typeof u !== 'object') {
        delete doc.ubicacion;
        return;
    }
    const c = u.coordinates;
    const ok =
        u.type === 'Point' &&
        Array.isArray(c) &&
        c.length >= 2 &&
        Number.isFinite(Number(c[0])) &&
        Number.isFinite(Number(c[1]));
    if (!ok) delete doc.ubicacion;
}

/** Tabla 10 — SITIOSCRITICOS. FOTO/RUTAFOTO opcionales si ambos vacíos. */
function validateSincSitioTabla10(doc) {
    const err = (m) => {
        throw new Error(m);
    };
    const isInt = (n) => {
        const x = Number(n);
        return Number.isFinite(x) && Math.floor(x) === x;
    };

    const cv = String(doc.codigoVia ?? '').trim();
    if (cv.length < 4 || cv.length > 25) {
        err('CODIGOVIA: texto de 4 a 25 caracteres.');
    }

    if (doc.fecha == null || doc.fecha === '') {
        err('FECHA: obligatoria (AAAA-MM-DD).');
    }
    const fd = doc.fecha instanceof Date ? doc.fecha : new Date(doc.fecha);
    if (Number.isNaN(fd.getTime())) {
        err('FECHA: fecha inválida.');
    }

    const ld = Number(doc.lado);
    if (!isInt(ld) || ld < 1 || ld > 2) {
        err('LADO: 1 = sentido A→B · 2 = sentido B→A.');
    }

    const tp = Number(doc.tipo);
    if (!isInt(tp) || tp < 1 || tp > 9) {
        err('TIPO: entero entre 1 y 9 (tipo de sitio crítico, Tabla 10).');
    }

    const sev = Number(doc.severidad);
    if (!isInt(sev) || sev < 1 || sev > 4) {
        err('SEVERIDAD: 1 a 4 según grado de severidad del manual.');
    }

    const foto = String(doc.foto ?? '').trim();
    const rf = String(doc.rutaFoto ?? '').trim();
    const sinFoto = foto.length === 0 && rf.length === 0;
    if (!sinFoto) {
        if (foto.length < 4 || foto.length > 50) {
            err('FOTO: entre 4 y 50 caracteres, o deje FOTO y RUTAFOTO vacíos para agregar la imagen después.');
        }
        if (rf.length < 10 || rf.length > 250) {
            err('RUTAFOTO: entre 10 y 250 caracteres, o deje ambos vacíos.');
        }
    }

    const cm = Number(doc.codMunicipio);
    const cd = Number(doc.codDepartamento);
    if (!isInt(cm) || cm < 1) {
        err('COD_MUNICIPIO: código DANE obligatorio (DmMunicipio).');
    }
    if (!isInt(cd) || cd < 1 || cd > 999) {
        err('COD_DEPARTAMENTO: código DANE obligatorio (DmDepartamento).');
    }

    const mu = String(doc.municipio ?? '').trim();
    const de = String(doc.departamento ?? '').trim();
    if (mu.length < 4 || mu.length > 25) {
        err('MUNICIPIO: texto de 4 a 25 caracteres.');
    }
    if (de.length < 4 || de.length > 25) {
        err('DEPARTAMENTO: texto de 4 a 25 caracteres.');
    }

    const u = doc.ubicacion;
    if (!u || typeof u !== 'object' || u.type !== 'Point') {
        err('Geometría: punto obligatorio al inicio del sitio crítico (sentido del abscisado).');
    }
    const c = u.coordinates;
    if (!Array.isArray(c) || c.length < 2 || !Number.isFinite(Number(c[0])) || !Number.isFinite(Number(c[1]))) {
        err('Geometría: coordenadas del punto inválidas.');
    }

    const obs = doc.obs;
    if (obs != null && String(obs).trim() !== '') {
        const o = String(obs).trim();
        if (o.length < 10 || o.length > 250) {
            err('OBS: si se diligencia, entre 10 y 250 caracteres.');
        }
    }
}

async function getSitiosByEje(idEje) {
    return await SincSitioCritico.find({ idEje }).sort({ fecha: 1, fechaCreacion: 1 });
}

async function createSitio(data, userId) {
    const doc = { ...data, creadoPor: userId };
    sanitizeSincSitioUbicacion(doc);
    validateSincSitioTabla10(doc);
    return await new SincSitioCritico(doc).save();
}

async function updateSitio(id, data, userId) {
    const hadUbicacion = Object.prototype.hasOwnProperty.call(data, 'ubicacion');
    const doc = { ...data, modificadoPor: userId, fechaModificacion: new Date() };
    sanitizeSincSitioUbicacion(doc);
    validateSincSitioTabla10(doc);
    if (hadUbicacion && doc.ubicacion === undefined) {
        const { ubicacion: _u, ...rest } = doc;
        return await SincSitioCritico.findByIdAndUpdate(
            id,
            { $set: rest, $unset: { ubicacion: '' } },
            { new: true, runValidators: true }
        );
    }
    return await SincSitioCritico.findByIdAndUpdate(id, doc, { new: true, runValidators: true });
}

async function removeSitio(id) {
    return await SincSitioCritico.findByIdAndDelete(id);
}

// ─── OBRAS DRENAJE ───────────────────────────────────────────────────────────

function sanitizeSincObraUbicacion(doc) {
    const u = doc.ubicacion;
    if (u === undefined) return;
    if (u === null || typeof u !== 'object') {
        delete doc.ubicacion;
        return;
    }
    const c = u.coordinates;
    const ok =
        u.type === 'Point' &&
        Array.isArray(c) &&
        c.length >= 2 &&
        Number.isFinite(Number(c[0])) &&
        Number.isFinite(Number(c[1]));
    if (!ok) delete doc.ubicacion;
}

/** Tabla 12 — OBRASDRENAJE. FOTO/RUTAFOTO opcionales si ambos vacíos. FECHA no exigida por Tabla 12. */
function validateSincObraTabla12(doc) {
    const err = (m) => {
        throw new Error(m);
    };
    const isInt = (n) => {
        const x = Number(n);
        return Number.isFinite(x) && Math.floor(x) === x;
    };

    const cv = String(doc.codigoVia ?? '').trim();
    if (cv.length < 4 || cv.length > 25) {
        err('CODIGOVIA: texto de 4 a 25 caracteres.');
    }

    if (doc.fecha != null && doc.fecha !== '') {
        const fd = doc.fecha instanceof Date ? doc.fecha : new Date(doc.fecha);
        if (Number.isNaN(fd.getTime())) {
            err('FECHA: fecha inválida.');
        }
    }

    const tp = Number(doc.tipo);
    if (!isInt(tp) || tp < 1 || tp > 5) {
        err('TIPO: entero entre 1 y 5 (Tabla 12).');
    }

    const mat = Number(doc.material);
    if (!isInt(mat) || mat < 1 || mat > 5) {
        err('MATERIAL: entero entre 1 y 5.');
    }

    const es = Number(doc.estadoServ);
    if (!isInt(es) || es < 1 || es > 3) {
        err('Estado de servicio (ESTADOSERV): 1 = Colmatada · 2 = Medianamente colmatada · 3 = Limpia.');
    }

    const eg = Number(doc.estadoGen);
    if (!isInt(eg) || eg < 1 || eg > 4) {
        err('ESTADOGEN: 1 = Bueno · 2 = Regular · 3 = Malo · 4 = No funcional.');
    }

    const lon = Number(doc.longitud);
    if (!Number.isFinite(lon) || lon < 1 || lon > 1000) {
        err('LONGITUD: entre 1 y 1 000 m.');
    }

    const ns = Number(doc.numSecc);
    if (!isInt(ns) || ns < 1 || ns > 10) {
        err('NUMSECC: entero entre 1 y 10.');
    }

    const an = Number(doc.ancho);
    if (!Number.isFinite(an) || an < 0.1 || an > 10) {
        err('ANCHO: ancho o diámetro entre 0,1 y 10 m.');
    }

    const foto = String(doc.foto ?? '').trim();
    const rf = String(doc.rutaFoto ?? '').trim();
    const sinFoto = foto.length === 0 && rf.length === 0;
    if (!sinFoto) {
        if (foto.length < 4 || foto.length > 50) {
            err('FOTO: entre 4 y 50 caracteres, o deje FOTO y RUTAFOTO vacíos para agregar la imagen después.');
        }
        if (rf.length < 10 || rf.length > 250) {
            err('RUTAFOTO: entre 10 y 250 caracteres, o deje ambos vacíos.');
        }
    }

    const cm = Number(doc.codMunicipio);
    const cd = Number(doc.codDepartamento);
    if (!isInt(cm) || cm < 1) {
        err('COD_MUNICIPIO: código DANE obligatorio (DmMunicipio).');
    }
    if (!isInt(cd) || cd < 1 || cd > 999) {
        err('COD_DEPARTAMENTO: código DANE obligatorio (DmDepartamento).');
    }

    const mu = String(doc.municipio ?? '').trim();
    const de = String(doc.departamento ?? '').trim();
    if (mu.length < 4 || mu.length > 25) {
        err('MUNICIPIO: texto de 4 a 25 caracteres.');
    }
    if (de.length < 4 || de.length > 25) {
        err('DEPARTAMENTO: texto de 4 a 25 caracteres.');
    }

    const u = doc.ubicacion;
    if (!u || typeof u !== 'object' || u.type !== 'Point') {
        err('Geometría: punto obligatorio en el inicio de la obra de drenaje (sobre el eje).');
    }
    const c = u.coordinates;
    if (!Array.isArray(c) || c.length < 2 || !Number.isFinite(Number(c[0])) || !Number.isFinite(Number(c[1]))) {
        err('Geometría: coordenadas del punto inválidas.');
    }

    const obs = doc.obs;
    if (obs != null && String(obs).trim() !== '') {
        const o = String(obs).trim();
        if (o.length < 10 || o.length > 250) {
            err('OBS: si se diligencia, entre 10 y 250 caracteres.');
        }
    }
}

async function getObrasByEje(idEje) {
    return await SincObraDrenaje.find({ idEje }).sort({ fechaCreacion: 1 });
}

async function createObra(data, userId) {
    const doc = { ...data, creadoPor: userId };
    sanitizeSincObraUbicacion(doc);
    validateSincObraTabla12(doc);
    return await new SincObraDrenaje(doc).save();
}

async function updateObra(id, data, userId) {
    const hadUbicacion = Object.prototype.hasOwnProperty.call(data, 'ubicacion');
    const doc = { ...data, modificadoPor: userId, fechaModificacion: new Date() };
    sanitizeSincObraUbicacion(doc);
    validateSincObraTabla12(doc);
    if (hadUbicacion && doc.ubicacion === undefined) {
        const { ubicacion: _u, ...rest } = doc;
        return await SincObraDrenaje.findByIdAndUpdate(
            id,
            { $set: rest, $unset: { ubicacion: '' } },
            { new: true, runValidators: true }
        );
    }
    return await SincObraDrenaje.findByIdAndUpdate(id, doc, { new: true, runValidators: true });
}

async function removeObra(id) {
    return await SincObraDrenaje.findByIdAndDelete(id);
}

// ─── NIVEL DETALLADO Mc — CRUD GENÉRICO ─────────────────────────────────────

async function getMcByEje(capa, idEje) {
    const Model = MC_REGISTRY[capa];
    if (!Model) throw new Error('Capa Mc no válida: ' + capa);
    let sort;
    if (
        capa === 'mc-berma' || capa === 'mc-calzada' || capa === 'mc-cco' || capa === 'mc-cicloruta' ||
        capa === 'mc-cuneta' || capa === 'mc-defensa-vial' || capa === 'mc-drenaje' || capa === 'mc-muro'
    ) {
        sort = { puntoInicial: 1, fechaInicioOperacion: -1, _id: -1 };
    } else if (capa === 'mc-dispositivo-its') {
        sort = { punto: 1, fechaInicioOperacion: -1, _id: -1 };
    } else if (capa === 'mc-luminaria') {
        sort = { punto: 1, fechaInicioOperacion: -1, _id: -1 };
    } else if (
        capa === 'mc-estacion-peaje' || capa === 'mc-estacion-pesaje' || capa === 'mc-separador' ||
        capa === 'mc-tunel' || capa === 'mc-zona-servicio' || capa === 'mc-puente'
    ) {
        sort = { puntoInicial: 1, fechaInicioOperacion: -1, _id: -1 };
    } else if (capa === 'mc-senal-vertical') {
        sort = { codPr: 1, fecInstal: -1, _id: -1 };
    } else {
        sort = { abscisaIni: 1, numPr: 1, fecha: -1 };
    }
    return await Model.find({ idEje }).sort(sort);
}

async function createMc(capa, data, userId) {
    const Model = MC_REGISTRY[capa];
    if (!Model) throw new Error('Capa Mc no válida: ' + capa);
    const doc = { ...data, creadoPor: userId };
    if (capa === 'mc-senal-vertical') {
        delete doc.codMunicipio;
    }
    if (capa === 'mc-separador') {
        delete doc.codDepto;
        delete doc.codMunicipio;
    }
    const m = new Model(doc);
    if (capa === 'mc-berma' && !m.idBerma) {
        m.idBerma = 'BER-' + m._id.toString().slice(-10).toUpperCase();
    }
    if (capa === 'mc-calzada' && !m.idCalzada) {
        m.idCalzada = 'CAL-' + m._id.toString().slice(-10).toUpperCase();
    }
    if (capa === 'mc-cco' && !m.idCco) {
        m.idCco = 'CCO-' + m._id.toString().slice(-10).toUpperCase();
    }
    if (capa === 'mc-cicloruta' && !m.idCicloruta) {
        m.idCicloruta = 'CIC-' + m._id.toString().slice(-10).toUpperCase();
    }
    if (capa === 'mc-cuneta' && !m.idCuneta) {
        m.idCuneta = 'CUN-' + m._id.toString().slice(-10).toUpperCase();
    }
    if (capa === 'mc-defensa-vial' && !m.idDefensaVial) {
        m.idDefensaVial = 'DEF-' + m._id.toString().slice(-10).toUpperCase();
    }
    if (capa === 'mc-dispositivo-its' && !m.idDispositivo) {
        m.idDispositivo = 'ITS-' + m._id.toString().slice(-10).toUpperCase();
    }
    if (capa === 'mc-drenaje' && !m.idDrenaje) {
        m.idDrenaje = 'DRE-' + m._id.toString().slice(-10).toUpperCase();
    }
    if (capa === 'mc-estacion-peaje' && !m.idPeaje) {
        m.idPeaje = 'PEA-' + m._id.toString().slice(-10).toUpperCase();
    }
    if (capa === 'mc-estacion-pesaje' && !m.idEstacionPesaje) {
        m.idEstacionPesaje = 'PES-' + m._id.toString().slice(-10).toUpperCase();
    }
    if (capa === 'mc-luminaria' && !m.idLuminaria) {
        m.idLuminaria = 'LUM-' + m._id.toString().slice(-10).toUpperCase();
    }
    if (capa === 'mc-muro' && !m.idMuro) {
        m.idMuro = 'MUR-' + m._id.toString().slice(-10).toUpperCase();
    }
    if (capa === 'mc-puente' && !m.idPuente) {
        m.idPuente = 'PUE-' + m._id.toString().slice(-10).toUpperCase();
    }
    if (capa === 'mc-senal-vertical' && !m.idSenalVertical) {
        m.idSenalVertical = 'SEV-' + m._id.toString().slice(-10).toUpperCase();
    }
    if (capa === 'mc-separador' && !m.idSeparador) {
        m.idSeparador = 'SEP-' + m._id.toString().slice(-10).toUpperCase();
    }
    if (capa === 'mc-tunel' && !m.idTunel) {
        m.idTunel = 'TUN-' + m._id.toString().slice(-10).toUpperCase();
    }
    if (capa === 'mc-zona-servicio' && !m.idZonaServicio) {
        m.idZonaServicio = 'ZON-' + m._id.toString().slice(-10).toUpperCase();
    }
    return await m.save();
}

async function updateMc(capa, id, data, userId) {
    const Model = MC_REGISTRY[capa];
    if (!Model) throw new Error('Capa Mc no válida: ' + capa);
    data.modificadoPor = userId; data.fechaModificacion = new Date();
    if (capa === 'mc-senal-vertical') {
        delete data.codMunicipio;
    }
    if (capa === 'mc-separador') {
        delete data.codDepto;
        delete data.codMunicipio;
    }
    let update;
    if (capa === 'mc-senal-vertical') {
        update = { $set: data, $unset: { codMunicipio: '' } };
    } else if (capa === 'mc-separador') {
        update = { $set: data, $unset: { codDepto: '', codMunicipio: '' } };
    } else {
        update = data;
    }
    return await Model.findByIdAndUpdate(id, update, { new: true, runValidators: true });
}

async function removeMc(capa, id) {
    const Model = MC_REGISTRY[capa];
    if (!Model) throw new Error('Capa Mc no válida: ' + capa);
    return await Model.findByIdAndDelete(id);
}

// ─── RESUMEN DEL EJE (para panel lateral) ────────────────────────────────────

async function getResumenEje(idEje) {
    const mcSlugs = Object.keys(MC_REGISTRY);
    const [fotos, prs, props, puentes, muros, tuneles, sitios, obras, ...mcCounts] = await Promise.all([
        SincFotoEje.countDocuments({ idEje }),
        SincPrs.countDocuments({ idEje }),
        SincPropiedades.countDocuments({ idEje }),
        SincPuente.countDocuments({ idEje }),
        SincMuro.countDocuments({ idEje }),
        SincTunel.countDocuments({ idEje }),
        SincSitioCritico.countDocuments({ idEje }),
        SincObraDrenaje.countDocuments({ idEje }),
        ...mcSlugs.map(slug => MC_REGISTRY[slug].countDocuments({ idEje }))
    ]);
    const mc = {};
    mcSlugs.forEach((slug, i) => { mc[slug] = mcCounts[i]; });
    return {
        fotos, prs, propiedades: props, puentes, muros, tuneles,
        sitiosCriticos: sitios, obrasDrenaje: obras,
        ...mc
    };
}

module.exports = {
    // Ejes
    getAllEjes, getEjeById, createEje, updateEje, removeEje,
    // FotoEje
    getFotosByEje, createFotoEje, updateFotoEje, removeFotoEje,
    // PRS
    getPrsByEje, createPrs, updatePrs, removePrs,
    // Propiedades
    getPropiedadesByEje, createPropiedades, updatePropiedades, removePropiedades,
    // Puentes
    getPuentesByEje, getPuenteById, createPuente, updatePuente, removePuente,
    // Muros
    getMurosByEje, createMuro, updateMuro, removeMuro,
    // Túneles
    getTunelesByEje, createTunel, updateTunel, removeTunel,
    // Sitios críticos
    getSitiosByEje, createSitio, updateSitio, removeSitio,
    // Obras drenaje
    getObrasByEje, createObra, updateObra, removeObra,
    // Nivel Detallado Mc — genérico
    getMcByEje, createMc, updateMc, removeMc,
    // Resumen
    getResumenEje
};
