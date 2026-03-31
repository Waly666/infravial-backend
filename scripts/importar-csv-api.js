/**
 * Importa CSV de exports Access → API REST (JWT).
 * Uso (desde carpeta backend):
 *   npm run import:csv:api -- --user CEDULA --password SECRETO
 *     → por defecto: via-tramos → sen-verticales → sen-horizontales
 *   npm run import:csv:api:full -- ...  (igual que arriba, explícito con --all)
 *   npm run import:csv:api -- --user ... --password ... --include-via  (solo vías)
 *
 * Opciones:
 *   --base URL     (default IMPORT_API_BASE o http://127.0.0.1:3000)
 *   --dir RUTA     carpeta con los CSV (default ./imports)
 *   --all          secuencia completa (vías → verticales → horizontales)
 *   --dry-run      no hace POST, solo valida y cuenta
 *
 * Requisitos: API en marcha; usuario admin evita exigir jornada EN PROCESO.
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const DEFAULT_BASE = process.env.IMPORT_API_BASE || 'http://127.0.0.1:3000';
const IMPORTS_DIR = path.join(__dirname, '..', 'imports');
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/infravialDB';

function parseArgs() {
    const a = process.argv.slice(2);
    const o = {
        base: DEFAULT_BASE,
        dir: IMPORTS_DIR,
        user: null,
        password: null,
        includeVia: false,
        includeSenVert: false,
        includeSenHor: false,
        dryRun: false
    };
    for (let i = 0; i < a.length; i++) {
        if (a[i] === '--user') o.user = a[++i];
        else if (a[i] === '--password') o.password = a[++i];
        else if (a[i] === '--base') o.base = a[++i].replace(/\/$/, '');
        else if (a[i] === '--dir') o.dir = a[++i];
        else if (a[i] === '--include-via') o.includeVia = true;
        else if (a[i] === '--include-sen-vert') o.includeSenVert = true;
        else if (a[i] === '--include-sen-hor') o.includeSenHor = true;
        else if (a[i] === '--all' || a[i] === '--secuencia-completa') {
            o.includeVia = true;
            o.includeSenVert = true;
            o.includeSenHor = true;
        } else if (a[i] === '--dry-run') o.dryRun = true;
    }
    return o;
}

function normCell(s) {
    return String(s ?? '').replace(/\u00a0/g, ' ').trim();
}

function splitCsvLinesRespectingQuotes(text) {
    const lines = [];
    let cur = '';
    let inQ = false;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (c === '"') {
            inQ = !inQ;
            cur += c;
        } else if ((c === '\n' || c === '\r') && !inQ) {
            if (cur.length) lines.push(cur);
            cur = '';
            if (c === '\r' && text[i + 1] === '\n') i++;
        } else cur += c;
    }
    if (cur.length) lines.push(cur);
    return lines;
}

function parseSemicolonLine(line) {
    const cells = [];
    let cur = '';
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') inQ = !inQ;
        else if (c === ';' && !inQ) {
            cells.push(normCell(cur));
            cur = '';
        } else cur += c;
    }
    cells.push(normCell(cur));
    return cells;
}

function normHeaderKey(raw) {
    return normCell(raw)
        .toLowerCase()
        .replace(/:/g, '')
        .replace(/[^a-z0-9]/g, '');
}

const VIA_HEADER_MAP = {
    ahiaestizq: 'bahiaEstIzq',
    calzadaizq: 'calzadaIzq',
    separadorzonaverdeizq: 'separadorZonaVerdeIzq',
    disenogeometrico: 'disenioGeometrico',
    andenizq: 'andenIzq',
    andender: 'andenDer',
    sarddercalzb: 'sardDerCalzB',
    fotoizqu: 'fotoIzqu',
    fotocent: 'fotoCent',
    fotoder: 'fotoDer',
    obs1: 'obs1',
    obs2: 'obs2',
    obs3: 'obs3',
    obs4: 'obs4',
    obs5: 'obs5',
    obs6: 'obs6'
};

function headerToFieldVia(raw) {
    const nk = normHeaderKey(raw);
    if (VIA_HEADER_MAP[nk]) return VIA_HEADER_MAP[nk];
    const t = normCell(raw).replace(/\u00a0/g, ' ').trim();
    if (!t) return null;
    const cleaned = t.replace(/[^a-zA-Z0-9_]/g, '');
    if (!cleaned) return null;
    return cleaned.charAt(0).toLowerCase() + cleaned.slice(1);
}

function readCsvObjects(filePath) {
    const text = fs.readFileSync(filePath, 'utf8');
    const lines = splitCsvLinesRespectingQuotes(text).filter((l) => normCell(l).length);
    if (!lines.length) return { headers: [], rows: [] };
    const headerCells = parseSemicolonLine(lines[0]);
    const headers = headerCells.map((h) => headerToFieldVia(h)).filter(Boolean);
    const rows = [];
    for (let li = 1; li < lines.length; li++) {
        const cells = parseSemicolonLine(lines[li]);
        const row = {};
        const seen = new Set();
        headerCells.forEach((rawH, i) => {
            const field = headerToFieldVia(rawH);
            if (!field || seen.has(field)) return;
            seen.add(field);
            row[field] = cells[i] ?? '';
        });
        rows.push(row);
    }
    return { headers: headerCells, rows };
}

function parseNum(v) {
    if (v == null || v === '') return undefined;
    const x = String(v).replace(',', '.').trim();
    if (x === '') return undefined;
    const n = Number(x);
    return Number.isFinite(n) ? n : undefined;
}

function isOid(s) {
    return typeof s === 'string' && /^[a-f0-9]{24}$/i.test(s.trim());
}

function parseFechaInv(s) {
    if (!s) return undefined;
    const p = String(s).trim().split(/[-/]/);
    const meses = { ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5, jul: 6, ago: 7, sep: 8, oct: 9, nov: 10, dic: 11 };
    if (p.length === 3) {
        const d = parseInt(p[0], 10);
        const mk = p[1]?.toLowerCase().slice(0, 3);
        const mo = meses[mk];
        let y = parseInt(p[2], 10);
        if (y < 100) y += 2000;
        if (mo !== undefined && !Number.isNaN(d)) return new Date(y, mo, d);
    }
    const t = Date.parse(s);
    return Number.isNaN(t) ? undefined : new Date(t);
}

function mapSentidoVial(v) {
    const x = normCell(v).toLowerCase();
    if (!x) return undefined;
    if (x.includes('reversible')) return 'Reversible';
    if (x.includes('contraflujo') || x.includes('contra flujo')) return 'Contraflujo';
    if (x.includes('ciclo') || x.includes('ciclov')) return 'Ciclo vía';
    if (x.includes('doble') || x.includes('bidireccional')) return 'Doble Sentido';
    if (x.includes('uni') || x.includes('un sentido')) return 'Un sentido';
    if (x.includes('sin defin')) return 'Sin_Definir';
    return undefined;
}

function titleCase(s) {
    if (!s) return s;
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

const ENUM_MAPS = {
    calzada: { una: 'Una', dos: 'Dos', tres: 'Tres' },
    tipoVia: { urbana: 'Urbana', rural: 'Rural' },
    disenioGeometrico: { curva: 'Curva', recta: 'Recta' },
    inclinacionVia: { plano: 'Plano', pendiente: 'Pendiente' },
    estadoVia: { bueno: 'Bueno', regular: 'Regular', malo: 'Malo' },
    visibilidad: { normal: 'Normal', disminuida: 'Disminuida' },
    estadoIluminacion: { bueno: 'Bueno', malo: 'Malo' }
};

function mapEnum(field, raw) {
    const v = normCell(raw);
    if (!v) return undefined;
    const map = ENUM_MAPS[field];
    if (!map) return v;
    return map[v.toLowerCase()] || v;
}

async function apiFetch(base, pathUrl, { method = 'GET', token, body } = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    let lastErr;
    for (let attempt = 0; attempt < 6; attempt++) {
        try {
            const r = await fetch(`${base}${pathUrl}`, {
                method,
                headers,
                body: body !== undefined ? JSON.stringify(body) : undefined
            });
            const txt = await r.text();
            let json;
            try {
                json = txt ? JSON.parse(txt) : {};
            } catch {
                json = { message: txt };
            }
            return { ok: r.ok, status: r.status, json };
        } catch (e) {
            lastErr = e;
            const wait = Math.min(2000, 500 * (attempt + 1));
            await new Promise((res) => setTimeout(res, wait));
        }
    }
    throw lastErr;
}

let _tokenState = { token: null, base: null, user: null, password: null };

async function refreshToken() {
    const { base, user, password } = _tokenState;
    const res = await apiFetch(base, '/auth/login', {
        method: 'POST',
        body: { user, password }
    });
    if (res.ok && res.json.accessToken) {
        _tokenState.token = res.json.accessToken;
        return _tokenState.token;
    }
    throw new Error('No se pudo re-autenticar');
}

async function apiPost(pathUrl, body) {
    let res = await apiFetch(_tokenState.base, pathUrl, {
        method: 'POST',
        token: _tokenState.token,
        body
    });
    if (res.status === 403 || res.status === 401) {
        await refreshToken();
        res = await apiFetch(_tokenState.base, pathUrl, {
            method: 'POST',
            token: _tokenState.token,
            body
        });
    }
    return res;
}

function fixShiftedViaRow(row) {
    const bm = normCell(row.bermaDer);
    const cd = normCell(row.calzadaDer);
    const ap = normCell(row.anchoTotalPerfil);

    const bermaDerIsShift = /^V\d+$/i.test(bm);
    const calzaDerIsShift = /^(Recta|Curva)$/i.test(cd);
    const anchoPerIsShift = /^(Plano|Pendiente)$/i.test(ap);

    if (bermaDerIsShift || calzaDerIsShift || anchoPerIsShift) {
        const saved = {
            clasNacional:      row.bermaDer,
            disenioGeometrico: row.calzadaDer,
            inclinacionVia:    row.anchoTotalPerfil,
            sentidoVial:       row.clasNacional,
            carriles:          row.disenioGeometrico,
            capaRodadura:      row.inclinacionVia,
            estadoVia:         row.sentidoVial,
            visibilidad:       row.carriles,
            fotoIzqu:          row.capaRodadura,
            fotoCent:          row.estadoVia,
            fotoDer:           row.visibilidad,
            obs1:              row.fotoIzqu,
            obs2:              row.fotoCent,
            obs3:              row.fotoDer,
            obs4:              row.obs1,
            obs5:              row.obs2,
            obs6:              row.obs3
        };
        row.bermaDer          = '';
        row.calzadaDer        = '';
        row.anchoTotalPerfil  = '';
        Object.assign(row, saved);
        return true;
    }
    return false;
}

function buildViaBody(row, esquemaByCod) {
    const fieldCount = Object.keys(row).filter(k => normCell(row[k]) !== '').length;
    if (fieldCount < 10) return { error: `Fila con muy pocos campos (${fieldCount}), posiblemente corrupta` };

    fixShiftedViaRow(row);
    const latI = parseNum(row.lat_inicio);
    const lngI = parseNum(row.lng_inicio);
    const latF = parseNum(row.lat_fin);
    const lngF = parseNum(row.lng_fin);

    let coordinates;
    if (latI != null && lngI != null && latF != null && lngF != null) {
        coordinates = [
            [lngI, latI],
            [lngF, latF]
        ];
    } else if (latI != null && lngI != null) {
        coordinates = [
            [lngI, latI],
            [lngI + 0.00001, latI + 0.00001]
        ];
    } else return { error: 'Sin coordenadas válidas (lat/lng inicio-fin).' };

    if (coordinates[0][0] === coordinates[1][0] && coordinates[0][1] === coordinates[1][1]) {
        coordinates[1] = [coordinates[1][0] + 0.00001, coordinates[1][1] + 0.00001];
    }

    const codEsq = normCell(row.perfilEsquema);
    const perfilId = codEsq && esquemaByCod.get(codEsq);
    if (codEsq && !perfilId) return { error: `perfilEsquema desconocido: "${codEsq}"` };

    const medidas = [
        'anteJardinIzq', 'andenIzq', 'zonaVerdeIzq', 'areaServIzq', 'sardIzqCalzA', 'cicloRutaIzq',
        'bahiaEstIzq', 'sardDerCalzA', 'cunetaIzq', 'bermaIzq', 'calzadaIzq',
        'separadorZonaVerdeIzq', 'separadorPeatonal', 'separadorCicloRuta', 'separadorZonaVerdeDer',
        'anteJardinDer', 'andenDer', 'zonaVerdeDer', 'areaServDer', 'sardDerCalzB', 'cicloRutaDer',
        'bahiaEstDer', 'sardIzqCalzB', 'cunetaDer', 'bermaDer', 'calzadaDer', 'anchoTotalPerfil'
    ];

    const idAccess = normCell(row.idViaTramoAccess);

    const body = {
        idJornada: normCell(row.idJornada),
        idViaTramoAccess: idAccess || undefined,
        via: normCell(row.via) || undefined,
        departamento: normCell(row.departamento) || undefined,
        municipio: normCell(row.municipio) || undefined,
        localidad: normCell(row.localidad) || undefined,
        ubicacion: { type: 'LineString', coordinates },
        longitud_m: parseNum(row.longitud_m),
        altitud: parseNum(row.altitud),
        entidadVia: normCell(row.entidadVia) || undefined,
        respVia: normCell(row.respVia) || undefined,
        encuestador: normCell(row.encuestador) || undefined,
        supervisor: normCell(row.supervisor) || undefined,
        ubiCicloRuta: normCell(row.ubiCicloRuta) || undefined,
        sentidoCardinal: normCell(row.sentidoCardinal) || undefined,
        calzada: mapEnum('calzada', row.calzada),
        tipoVia: mapEnum('tipoVia', row.tipoVia),
        claseVia: normCell(row.claseVia) || undefined,
        perfilEsquema: perfilId || undefined,
        nomenclatura: normCell(row.nomenclatura) ? { completa: normCell(row.nomenclatura) } : undefined,
        disenioGeometrico: mapEnum('disenioGeometrico', row.disenioGeometrico),
        inclinacionVia: mapEnum('inclinacionVia', row.inclinacionVia),
        carriles: parseNum(row.carriles),
        capaRodadura: normCell(row.capaRodadura) || undefined,
        estadoVia: mapEnum('estadoVia', row.estadoVia),
        visibilidad: mapEnum('visibilidad', row.visibilidad),
        clasNacional: normCell(row.clasNacional) || undefined
    };

    const sv = mapSentidoVial(row.sentidoVial);
    if (sv) body.sentidoVial = sv;

    const fi = parseFechaInv(row.fechaInv);
    if (fi) body.fechaInv = fi.toISOString();

    for (const m of medidas) {
        const n = parseNum(row[m]);
        if (n !== undefined) body[m] = n;
    }

    if (isOid(row.zat)) body.zat = row.zat.trim();
    if (isOid(row.comuna)) body.comuna = row.comuna.trim();
    if (isOid(row.barrio)) body.barrio = row.barrio.trim();

    const fotos = [row.fotoIzqu, row.fotoCent, row.fotoDer].map(normCell).filter(Boolean);
    if (fotos.length) body.fotos = fotos;

    const accessKey = `${normCell(row.idJornada)}|${normCell(row.idViaTramoAccess)}`;
    return { body, accessKey };
}

function buildSenVertBody(row, tramoMap) {
    const key = `${normCell(row.idJornada)}|${normCell(row.idViaTramoAccess)}`;
    const idViaTramo = tramoMap.get(key);
    if (!idViaTramo) return { error: `No se encontró idViaTramo para llave: ${key}` };

    const lat = parseNum(row.latitud);
    const lng = parseNum(row.longitud);
    if (lat == null || lng == null) return { error: 'Sen vert: sin lat/lng' };

    const body = {
        idJornada: normCell(row.idJornada),
        idViaTramo,
        ubicacion: { type: 'Point', coordinates: [lng, lat] },
        codSe: normCell(row.codSe) || undefined,
        estado: normCell(row.estado) || undefined,
        matPlaca: normCell(row.matPlaca) || undefined,
        ubicEspacial: normCell(row.ubicEspacial) || undefined,
        obstruccion: normCell(row.obstruccion) || undefined,
        forma: normCell(row.forma) || undefined,
        orientacion: normCell(row.orientacion) || undefined,
        reflecOptima: normCell(row.reflecOptima) || undefined,
        dimTablero: normCell(row.dimTablero) || undefined,
        ubicPerVial: normCell(row.ubicPerfVial || row.ubicPerVial) || undefined,
        fase: normCell(row.fase) || undefined,
        accion: normCell(row.accion) || undefined,
        ubicLateral: parseNum(row.ubicLateral),
        diagUbicLat: normCell(row.diagUbicLat) || undefined,
        altura: parseNum(row.altura),
        diagAltura: normCell(row.diagAltura) || undefined,
        banderas: normCell(row.banderas) || undefined,
        leyendas: normCell(row.leyendas) || undefined,
        falla1: normCell(row.falla1) || undefined,
        falla2: normCell(row.falla2) || undefined,
        falla3: normCell(row.falla3) || undefined,
        falla4: normCell(row.falla4) || undefined,
        falla5: normCell(row.falla5) || undefined,
        tipoSoporte: normCell(row.tipoSoporte) || undefined,
        sistemaSoporte: normCell(row.sistemaSoporte) || undefined,
        estadoSoporte: normCell(row.estadoSoporte) || undefined,
        estadoAnclaje: normCell(row.estadoAnclaje) || undefined,
        urlFotoSenVert: normCell(row.urlFotoSenVert) || undefined
    };
    return { body };
}

function normHeaderKeySen(raw) {
    return normCell(raw)
        .toLowerCase()
        .replace(/:/g, '')
        .replace(/[^a-z0-9]/g, '');
}

function headerToFieldSenVert(raw) {
    const nk = normHeaderKeySen(raw);
    if (nk === 'sistemasoporte') return 'sistemaSoporte';
    if (nk === 'ubicperfvial') return 'ubicPerfVial';
    const t = normCell(raw).replace(/\u00a0/g, ' ').trim();
    if (!t) return null;
    const cleaned = t.replace(/[^a-zA-Z0-9_]/g, '');
    if (!cleaned) return null;
    return cleaned.charAt(0).toLowerCase() + cleaned.slice(1);
}

function readSenVertRows(filePath) {
    const text = fs.readFileSync(filePath, 'utf8');
    const lines = splitCsvLinesRespectingQuotes(text).filter((l) => normCell(l).length);
    if (!lines.length) return [];
    const headerCells = parseSemicolonLine(lines[0]);
    const rows = [];
    for (let li = 1; li < lines.length; li++) {
        const cells = parseSemicolonLine(lines[li]);
        const row = {};
        const seen = new Set();
        headerCells.forEach((rawH, i) => {
            const field = headerToFieldSenVert(rawH);
            if (!field || seen.has(field)) return;
            seen.add(field);
            row[field] = cells[i] ?? '';
        });
        rows.push(row);
    }
    return rows;
}

function buildSenHorBody(row, tramoMap) {
    const key = `${normCell(row.idJornada)}|${normCell(row.idTramoAccess || row.idViaTramoAccess)}`;
    const idViaTramo = tramoMap.get(key);
    if (!idViaTramo) return { error: `No se encontró idViaTramo para llave: ${key}` };

    const lat = parseNum(row.latitud);
    const lng = parseNum(row.longitud);
    if (lat == null || lng == null) return { error: 'Sen hor: sin lat/lng' };

    const body = {
        idJornada: normCell(row.idJornada),
        idViaTramo,
        ubicacion: { type: 'Point', coordinates: [lng, lat] },
        codSeHor: normCell(row.codSeHor) || undefined,
        tipoDem: normCell(row.tipoDem) || undefined,
        estadoDem: normCell(row.estadoDem) || undefined,
        tipoPintura: normCell(row.tipoPintura) || undefined,
        material: normCell(row.material) || undefined,
        fase: normCell(row.fase) || undefined,
        accion: normCell(row.accion) || undefined,
        ubicResTramo: normCell(row.ubicResTramo) || undefined,
        reflectOptima: normCell(row.reflectOptima) || undefined,
        retroreflectividad: normCell(row.retroreflectividad) || undefined,
        color: normCell(row.color) || undefined,
        claseDemLinea: normCell(row.claseDemLinea) || undefined,
        claseDemPunto: normCell(row.claseDemPunto) || undefined,
        notas: normCell(row.notas) || undefined,
        urlFotoSH: normCell(row.urlFotoSH) || undefined
    };
    return { body };
}

function readSenHorRows(filePath) {
    const text = fs.readFileSync(filePath, 'utf8');
    const lines = splitCsvLinesRespectingQuotes(text).filter((l) => normCell(l).length);
    if (!lines.length) return [];
    const headerCells = parseSemicolonLine(lines[0]);
    const rows = [];
    for (let li = 1; li < lines.length; li++) {
        const cells = parseSemicolonLine(lines[li]);
        const row = {};
        const seen = new Set();
        headerCells.forEach((rawH, i) => {
            const field = headerToFieldSenVert(rawH);
            if (!field || seen.has(field)) return;
            seen.add(field);
            row[field] = cells[i] ?? '';
        });
        rows.push(row);
    }
    return rows;
}

async function ensureJornadasFromCSV(csvDir) {
    console.log('Conectando a MongoDB para verificar/crear jornadas…');
    await mongoose.connect(MONGO_URI);
    const Jornada = require('../models/Jornada');

    const csvFiles = ['via-tramos.csv', 'sen-verticales.csv', 'sen-horizontales.csv'];
    const jornadaInfo = new Map();

    for (const file of csvFiles) {
        const fp = path.join(csvDir, file);
        if (!fs.existsSync(fp)) continue;
        const text = fs.readFileSync(fp, 'utf8');
        const lines = splitCsvLinesRespectingQuotes(text).filter(l => normCell(l).length);
        if (lines.length < 2) continue;
        const hdrs = parseSemicolonLine(lines[0]);
        const idxJornada = hdrs.findIndex(h => normHeaderKey(h) === 'idjornada');
        const idxDepto = hdrs.findIndex(h => normHeaderKey(h) === 'departamento');
        const idxMun = hdrs.findIndex(h => normHeaderKey(h) === 'municipio');
        const idxSup = hdrs.findIndex(h => normHeaderKey(h) === 'supervisor');
        const idxEnt = hdrs.findIndex(h => normHeaderKey(h) === 'entidadvia');
        const idxFecha = hdrs.findIndex(h => normHeaderKey(h) === 'fechainv');
        if (idxJornada < 0) continue;

        for (let li = 1; li < lines.length; li++) {
            const cells = parseSemicolonLine(lines[li]);
            const jid = normCell(cells[idxJornada] || '');
            if (!jid || jid.length !== 24 || jornadaInfo.has(jid)) continue;
            jornadaInfo.set(jid, {
                dpto: normCell(cells[idxDepto] || ''),
                municipio: normCell(cells[idxMun] || ''),
                supervisor: normCell(cells[idxSup] || ''),
                entidadResVia: normCell(cells[idxEnt] || ''),
                fechaStr: normCell(cells[idxFecha] || '')
            });
        }
    }

    console.log(`  Jornadas únicas encontradas en CSV: ${jornadaInfo.size}`);
    let created = 0, existing = 0;

    for (const [jid, info] of jornadaInfo) {
        const exists = await Jornada.findById(jid);
        if (exists) {
            existing++;
            continue;
        }
        const fecha = parseFechaInv(info.fechaStr) || new Date();
        const doc = new Jornada({
            _id: new mongoose.Types.ObjectId(jid),
            dpto: info.dpto,
            municipio: info.municipio,
            supervisor: info.supervisor,
            entidadResVia: info.entidadResVia,
            contratante: info.entidadResVia,
            fechaJornada: fecha,
            horaInicio: fecha,
            estado: 'FINALIZADO'
        });
        await doc.save();
        created++;
        console.log(`  ✓ Jornada creada: ${jid} → ${info.municipio} (${info.dpto})`);
    }

    console.log(`  Jornadas: ${created} creadas, ${existing} ya existían`);
    await mongoose.disconnect();
}

async function main() {
    const args = parseArgs();
    if (!args.user || !args.password) {
        console.error('Uso: npm run import:csv:api -- --user CEDULA --password ...');
        console.error('  (por defecto: vías → señales verticales → horizontales; usa --include-via solo, etc., para acotar)');
        process.exit(1);
    }
    if (!args.includeVia && !args.includeSenVert && !args.includeSenHor) {
        args.includeVia = true;
        args.includeSenVert = true;
        args.includeSenHor = true;
        console.log('Secuencia completa: via-tramos → sen-verticales → sen-horizontales (por defecto).\n');
    }

    const tramoMap = new Map();
    const errores = [];

    // Paso 0: crear jornadas del CSV en MongoDB si no existen
    await ensureJornadasFromCSV(args.dir);

    _tokenState.base = args.base;
    _tokenState.user = args.user;
    _tokenState.password = args.password;

    console.log('Login…', args.base);
    const loginRes = await apiFetch(args.base, '/auth/login', {
        method: 'POST',
        body: { user: args.user, password: args.password }
    });
    if (!loginRes.ok) {
        console.error('Login falló:', loginRes.status, loginRes.json);
        process.exit(1);
    }
    _tokenState.token = loginRes.json.accessToken;
    if (!_tokenState.token) {
        console.error('Sin accessToken en respuesta');
        process.exit(1);
    }

    const esquemaByCod = new Map();
    const esqRes = await apiFetch(args.base, '/catalogos/esquema-perfil', { token: _tokenState.token });
    if (esqRes.ok && Array.isArray(esqRes.json.datos)) {
        for (const e of esqRes.json.datos) {
            if (e.codEsquema) esquemaByCod.set(normCell(e.codEsquema), e._id);
        }
    }

    const throttle = async (i) => {
        if ((i + 1) % 50 === 0) await new Promise(r => setTimeout(r, 100));
        if ((i + 1) % 200 === 0) await new Promise(r => setTimeout(r, 500));
        if ((i + 1) % 1000 === 0) {
            console.log('    (pausa 3s para aliviar servidor)');
            await new Promise(r => setTimeout(r, 3000));
        }
    };

    async function loadExistingTramos() {
        console.log('Cargando tramos existentes del API…');
        const res = await apiFetch(args.base, '/via-tramos', { token: _tokenState.token });
        if (!res.ok) {
            console.warn('No se pudieron cargar tramos existentes');
            return;
        }
        const tramos = res.json.tramos || [];
        for (const t of tramos) {
            if (t.idViaTramoAccess && t.idJornada) {
                const jId = typeof t.idJornada === 'object' ? t.idJornada._id : t.idJornada;
                const key = `${jId}|${t.idViaTramoAccess}`;
                tramoMap.set(key, t._id);
            }
        }
        console.log(`  Tramos cargados al mapa: ${tramoMap.size}`);
    }

    if (!args.includeVia && (args.includeSenVert || args.includeSenHor)) {
        await loadExistingTramos();
    }

    if (args.includeVia) {
        const fp = path.join(args.dir, 'via-tramos.csv');
        if (!fs.existsSync(fp)) {
            console.error('No existe:', fp);
            process.exit(1);
        }
        const { rows } = readCsvObjects(fp);
        console.log(`Vía-tramos: ${rows.length} filas`);
        let ok = 0;
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const fila = i + 2;
            const built = buildViaBody(row, esquemaByCod);
            if (built.error) {
                errores.push({ modulo: 'via-tramos', fila, error: built.error });
                continue;
            }
            if (args.dryRun) {
                ok++;
                tramoMap.set(built.accessKey, 'dry');
                continue;
            }
            const res = await apiPost('/via-tramos', built.body);
            if (!res.ok) {
                const msg = res.json?.message || JSON.stringify(res.json);
                if (errores.filter((e) => e.modulo === 'via-tramos').length === 0) {
                    console.error(`  ✖ Primer error via-tramos (fila ${fila}): ${msg}`);
                    console.error('    Body enviado:', JSON.stringify(built.body).slice(0, 300));
                }
                errores.push({ modulo: 'via-tramos', fila, error: msg });
                continue;
            }
            const id = res.json.tramo?._id;
            if (id) tramoMap.set(built.accessKey, id);
            ok++;
            if ((i + 1) % 200 === 0) console.log(`  … ${i + 1}/${rows.length}`);
            await throttle(i, 'via');
        }
        console.log(`Vía-tramos OK: ${ok}, errores: ${errores.filter((e) => e.modulo === 'via-tramos').length}`);
    }

    if (args.includeSenVert) {
        if (!tramoMap.size && !args.dryRun) {
            console.warn('⚠ Sen vert: tramoMap vacío — todas las señales darán error de idViaTramo.');
        }
        const fp = path.join(args.dir, 'sen-verticales.csv');
        if (!fs.existsSync(fp)) {
            console.error('No existe:', fp);
            process.exit(1);
        }
        const rows = readSenVertRows(fp);
        console.log(`Sen vert: ${rows.length} filas`);
        let ok = 0;
        for (let i = 0; i < rows.length; i++) {
            const fila = i + 2;
            const built = buildSenVertBody(rows[i], tramoMap);
            if (built.error) {
                errores.push({ modulo: 'sen-vert', fila, error: built.error });
                continue;
            }
            if (args.dryRun) {
                ok++;
                continue;
            }
            const res = await apiPost('/sen-vert', built.body);
            if (!res.ok) {
                errores.push({
                    modulo: 'sen-vert',
                    fila,
                    error: res.json?.message || JSON.stringify(res.json)
                });
                continue;
            }
            ok++;
            if ((i + 1) % 500 === 0) console.log(`  … ${i + 1}/${rows.length}`);
            await throttle(i, 'sen-vert');
        }
        console.log(`Sen vert OK: ${ok}, errores: ${errores.filter((e) => e.modulo === 'sen-vert').length}`);
    }

    if (args.includeSenHor) {
        if (!tramoMap.size && !args.dryRun) {
            console.warn('⚠ Sen hor: tramoMap vacío — todas las señales darán error de idViaTramo.');
        }
        const fp = path.join(args.dir, 'sen-horizontales.csv');
        if (!fs.existsSync(fp)) {
            console.error('No existe:', fp);
            process.exit(1);
        }
        const rows = readSenHorRows(fp);
        console.log(`Sen hor: ${rows.length} filas`);
        let ok = 0;
        for (let i = 0; i < rows.length; i++) {
            const fila = i + 2;
            const built = buildSenHorBody(rows[i], tramoMap);
            if (built.error) {
                errores.push({ modulo: 'sen-hor', fila, error: built.error });
                continue;
            }
            if (args.dryRun) {
                ok++;
                continue;
            }
            const res = await apiPost('/sen-hor', built.body);
            if (!res.ok) {
                errores.push({
                    modulo: 'sen-hor',
                    fila,
                    error: res.json?.message || JSON.stringify(res.json)
                });
                continue;
            }
            ok++;
            if ((i + 1) % 500 === 0) console.log(`  … ${i + 1}/${rows.length}`);
            await throttle(i, 'sen-hor');
        }
        console.log(`Sen hor OK: ${ok}, errores: ${errores.filter((e) => e.modulo === 'sen-hor').length}`);
    }

    if (errores.length) {
        const out = path.join(args.dir, `errores-importacion-${Date.now()}.json`);
        fs.writeFileSync(out, JSON.stringify(errores, null, 2), 'utf8');
        console.log(`Errores guardados: ${out} (${errores.length})`);
    } else console.log('Sin errores registrados.');
}

main().catch((e) => {
    console.error('ERROR FATAL:', e.message || e);
    try {
        const out = path.join(IMPORTS_DIR, `errores-importacion-${Date.now()}.json`);
        fs.writeFileSync(out, JSON.stringify([{ modulo: 'FATAL', error: String(e) }], null, 2), 'utf8');
        console.error('Archivo de error guardado:', out);
    } catch { /* no-op */ }
    process.exit(1);
});
