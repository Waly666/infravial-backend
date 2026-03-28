/**
 * Importa Excel de un municipio → API REST.
 * La API recalcula anchoTotalPerfil, clasNacional, clasPrelacion.
 * Relaciona señales a tramos por nomenclatura + coordenadas.
 *
 * Uso:
 *   node scripts/importar-excel.js --user CEDULA --password CLAVE --file imports/castillalanueva.xlsx
 *   node scripts/importar-excel.js --user ... --password ... --file ... --dry-run
 *   node scripts/importar-excel.js --user ... --password ... --file ... --only via
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const XLSX = require('xlsx');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/infravialDB';
const DEFAULT_BASE = process.env.IMPORT_API_BASE || 'http://127.0.0.1:3000';

const Jornada = require('../models/Jornada');
const EsquemaPerfil = require('../models/EsquemaPerfil');
const Zat = require('../models/Zat');
const Barrio = require('../models/Barrio');
const ObservacionVia = require('../models/ObservacionVia');

/* ── helpers ─────────────────────────────────────────────────── */

function s(v) {
    if (v == null || v === '') return undefined;
    return String(v).trim() || undefined;
}

function n(v) {
    if (v == null || v === '') return undefined;
    const x = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'));
    return Number.isFinite(x) ? x : undefined;
}

function isBlankRow(row) {
    if (!Array.isArray(row) || row.length === 0) return true;
    return row.every(v => v == null || (typeof v === 'string' && v.trim() === ''));
}

function excelDate(v) {
    if (v == null || v === '') return undefined;
    if (v instanceof Date) return v;
    if (typeof v === 'number') return new Date(Math.round((v - 25569) * 86400000));
    const t = Date.parse(String(v));
    return Number.isNaN(t) ? undefined : new Date(t);
}

const ENUM_CALZADA = { una: 'Una', dos: 'Dos', tres: 'Tres' };
const ENUM_DISENO = { recta: 'Recta', curva: 'Curva' };
const ENUM_INCLINACION = { plano: 'Plano', pendiente: 'Pendiente' };
const ENUM_ESTADO_VIA = { bueno: 'Bueno', regular: 'Regular', malo: 'Malo' };
const ENUM_VISIBILIDAD = { normal: 'Normal', disminuida: 'Disminuida' };

function mapE(map, v) {
    const x = s(v);
    if (!x) return undefined;
    return map[x.toLowerCase()] || x;
}

function mapSentido(v) {
    const x = s(v);
    if (!x) return undefined;
    const low = x.toLowerCase();
    if (low.includes('doble') || low.includes('bidireccional')) return 'Bidireccional';
    if (low.includes('un sentido') || low.includes('unidireccional') || low.includes('uni')) return 'Unidireccional';
    if (low.includes('sin')) return 'Sin_Definir';
    return x;
}

function normNom(v) {
    if (!v) return '';
    return String(v).trim().toUpperCase().replace(/\s+/g, ' ');
}

function dist(lat1, lng1, lat2, lng2) {
    const dlat = lat1 - lat2;
    const dlng = lng1 - lng2;
    return dlat * dlat + dlng * dlng;
}

/* ── API fetch ───────────────────────────────────────────────── */

let _tok = { token: null, base: null, user: null, pw: null };

async function apiFetch(pathUrl, { method = 'GET', body } = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (_tok.token) headers.Authorization = `Bearer ${_tok.token}`;
    let lastErr;
    for (let attempt = 0; attempt < 6; attempt++) {
        try {
            const r = await fetch(`${_tok.base}${pathUrl}`, {
                method, headers,
                body: body !== undefined ? JSON.stringify(body) : undefined
            });
            const txt = await r.text();
            let json;
            try { json = txt ? JSON.parse(txt) : {}; } catch { json = { message: txt }; }
            return { ok: r.ok, status: r.status, json };
        } catch (e) {
            lastErr = e;
            const wait = Math.min(3000, 500 * (attempt + 1));
            console.log(`    retry ${attempt + 1}/6 (${e.code || e.message})…`);
            await new Promise(res => setTimeout(res, wait));
        }
    }
    throw lastErr;
}

async function refreshToken() {
    if (!_tok.user || !_tok.pw) throw new Error('Token expirado y no hay credenciales para renovar');
    const res = await apiFetch('/auth/login', {
        method: 'POST', body: { user: _tok.user, password: _tok.pw }
    });
    if (res.ok && res.json.accessToken) { _tok.token = res.json.accessToken; return; }
    throw new Error('No se pudo re-autenticar');
}

async function apiPost(pathUrl, body) {
    let res = await apiFetch(pathUrl, { method: 'POST', body });
    if (res.status === 401 || res.status === 403) {
        await refreshToken();
        res = await apiFetch(pathUrl, { method: 'POST', body });
    }
    return res;
}

async function throttle(i) {
    if ((i + 1) % 50 === 0) await new Promise(r => setTimeout(r, 80));
    if ((i + 1) % 200 === 0) await new Promise(r => setTimeout(r, 400));
    if ((i + 1) % 500 === 0) {
        console.log('    (pausa 2s)');
        await new Promise(r => setTimeout(r, 2000));
    }
}

/* ── main ────────────────────────────────────────────────────── */

async function main() {
    const args = process.argv.slice(2);
    let filePath = null;
    let dryRun = false;
    let only = null;
    _tok.base = DEFAULT_BASE;

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--file') filePath = args[++i];
        else if (args[i] === '--base') _tok.base = args[++i].replace(/\/$/, '');
        else if (args[i] === '--user') _tok.user = args[++i];
        else if (args[i] === '--password') _tok.pw = args[++i];
        else if (args[i] === '--token') _tok.token = args[++i];
        else if (args[i] === '--only') only = args[++i]?.toLowerCase();
        else if (args[i] === '--dry-run') dryRun = true;
    }

    if (!filePath) { console.error('Falta --file RUTA.xlsx'); process.exit(1); }
    if (!dryRun && !_tok.token && (!_tok.user || !_tok.pw)) {
        console.error('Uso: node scripts/importar-excel.js --user CEDULA --password CLAVE --file RUTA.xlsx');
        console.error('   o: node scripts/importar-excel.js --token JWT --file RUTA.xlsx');
        process.exit(1);
    }
    if (!fs.existsSync(filePath)) { console.error(`Archivo no encontrado: ${filePath}`); process.exit(1); }

    const doVia = !only || only === 'via' || only === 'vias';
    const doVert = !only || only === 'vert' || only === 'verticales';
    const doHor = !only || only === 'hor' || only === 'horizontales';

    console.log(`Leyendo: ${filePath}`);
    const wb = XLSX.readFile(filePath);
    console.log(`Hojas: ${wb.SheetNames.join(', ')}`);

    /* ── MongoDB: jornada, esquemas, zats, barrios, obs ─────── */
    console.log('\nConectando a MongoDB…');
    await mongoose.connect(MONGO_URI);

    const jornadaActiva = await Jornada.findOne({ estado: 'EN PROCESO' });
    if (!jornadaActiva) { console.error('No hay jornada activa (EN PROCESO)'); process.exit(1); }
    const idJornada = String(jornadaActiva._id);
    const munName = jornadaActiva.municipio || '';
    console.log(`Jornada activa: ${munName} (${idJornada})`);

    const esquemaMap = new Map();
    for (const e of await EsquemaPerfil.find({})) esquemaMap.set(e.codEsquema, String(e._id));
    console.log(`EsquemaPerfil: ${esquemaMap.size}`);

    // Zat lookup: zatNumero → _id (scoped by municipality)
    const zatMap = new Map();
    for (const z of await Zat.find({})) {
        zatMap.set(`${(z.munNombre || '').toUpperCase()}|${z.zatNumero}`, String(z._id));
    }

    // Barrio lookup: nombre → _id
    const barrioMap = new Map();
    for (const b of await Barrio.find({})) {
        barrioMap.set(`${(b.munNombre || '').toUpperCase()}|${(b.nombre || '').toUpperCase()}`, String(b._id));
    }

    // Pre-scan Excel to create missing Zats, Barrios
    const viaSheetPre = wb.SheetNames.find(nm => /via/i.test(nm));
    if (viaSheetPre) {
        const preData = XLSX.utils.sheet_to_json(wb.Sheets[viaSheetPre], { header: 1, defval: '' });
        const seenZats = new Set();
        const seenBarrios = new Set();
        for (let i = 1; i < preData.length; i++) {
            const r = preData[i];
            const mun = s(r[2]) || munName;
            const zatNum = n(r[12]);
            const barrio = s(r[13]);
            if (zatNum != null) seenZats.add(`${mun.toUpperCase()}|${zatNum}`);
            if (barrio) seenBarrios.add(`${mun.toUpperCase()}|${barrio.toUpperCase()}`);
        }
        for (const key of seenZats) {
            if (!zatMap.has(key)) {
                const [mun, num] = key.split('|');
                const doc = await Zat.create({ zatNumero: parseInt(num), munNombre: mun });
                zatMap.set(key, String(doc._id));
            }
        }
        for (const key of seenBarrios) {
            if (!barrioMap.has(key)) {
                const [mun, nombre] = key.split('|');
                const doc = await Barrio.create({ nombre, munNombre: mun });
                barrioMap.set(key, String(doc._id));
            }
        }
    }
    console.log(`Zats: ${zatMap.size}`);
    console.log(`Barrios: ${barrioMap.size}`);

    // ObservacionVia lookup: txtObs → _id
    const obsViaMap = new Map();
    for (const o of await ObservacionVia.find({})) {
        obsViaMap.set(o.txtObs, String(o._id));
    }
    // Pre-scan obs in Excel and create missing ones
    if (viaSheetPre) {
        const preData = XLSX.utils.sheet_to_json(wb.Sheets[viaSheetPre], { header: 1, defval: '' });
        for (let i = 1; i < preData.length; i++) {
            for (let c = 29; c <= 34; c++) {
                const txt = s(preData[i][c]);
                if (txt && !obsViaMap.has(txt)) {
                    const doc = await ObservacionVia.create({ txtObs: txt });
                    obsViaMap.set(txt, String(doc._id));
                }
            }
        }
    }
    console.log(`ObservacionVia: ${obsViaMap.size}`);

    await mongoose.disconnect();

    /* ── Login API ───────────────────────────────────────────── */
    if (!dryRun && !_tok.token) {
        console.log(`\nLogin → ${_tok.base}`);
        const loginRes = await apiFetch('/auth/login', { method: 'POST', body: { user: _tok.user, password: _tok.pw } });
        if (!loginRes.ok) { console.error('Login falló:', loginRes.json); process.exit(1); }
        _tok.token = loginRes.json.accessToken;
        console.log('OK');
    } else if (!dryRun && _tok.token) {
        console.log(`\nImportación con token admin → ${_tok.base}`);
    }
    console.log('');

    const errores = [];
    const stats = { via: { ok: 0, err: 0 }, vert: { ok: 0, err: 0 }, hor: { ok: 0, err: 0 } };

    // Tramos importados: { _id, nomenclatura, zat, lat, lng }
    const tramosIndex = [];

    /* ═══════════════════════════════════════════════════════════
     *  VÍA-TRAMOS
     * ═══════════════════════════════════════════════════════════ */
    const viaSheet = wb.SheetNames.find(n => /via/i.test(n));
    if (doVia && viaSheet) {
        console.log('── Importar vías ──');
        const data = XLSX.utils.sheet_to_json(wb.Sheets[viaSheet], { header: 1, defval: '' });
        const total = data.length - 1;
        console.log(`  Filas: ${total}`);

        for (let i = 1; i < data.length; i++) {
            const r = data[i];
            if (isBlankRow(r)) continue;
            const fila = i + 1;
            const lat = n(r[6]);
            const lng = n(r[7]);

            if (lat == null || lng == null) {
                errores.push({ mod: 'via', fila, error: 'Sin coordenadas' });
                stats.via.err++;
                continue;
            }

            let coords = [[lng, lat], [lng + 0.00001, lat + 0.00001]];

            const codEsq = s(r[19]);
            const perfilId = codEsq ? esquemaMap.get(codEsq) : undefined;

            const mun = s(r[2]) || munName;
            const zatNum = n(r[12]);
            const zatKey = zatNum != null ? `${mun.toUpperCase()}|${zatNum}` : null;
            const barrioTxt = s(r[13]);
            const barrioKey = barrioTxt ? `${mun.toUpperCase()}|${barrioTxt.toUpperCase()}` : null;

            const body = {
                idJornada,
                tipoUbic: 'Tramo',
                fechaInv: excelDate(r[0])?.toISOString(),
                departamento: s(r[1]),
                municipio: mun,
                via: s(r[3]),
                localidad: s(r[4]),
                tipoLocalidad: s(r[5]),
                ubicacion: { type: 'LineString', coordinates: coords },
                entidadVia: s(r[8]),
                respVia: s(r[9]),
                encuestador: s(r[10]),
                supervisor: s(r[11]),
                zat: zatKey ? zatMap.get(zatKey) : undefined,
                barrio: barrioKey ? barrioMap.get(barrioKey) : undefined,
                ubiCicloRuta: s(r[14]),
                sentidoCardinal: s(r[15]),
                calzada: mapE(ENUM_CALZADA, r[16]),
                tipoVia: s(r[17]),
                claseVia: s(r[18]),
                nomenclatura: s(r[20]) ? { completa: s(r[20]) } : undefined,
                disenioGeometrico: mapE(ENUM_DISENO, r[22]),
                inclinacionVia: mapE(ENUM_INCLINACION, r[23]),
                sentidoVial: mapSentido(r[24]),
                carriles: n(r[25]),
                capaRodadura: s(r[26]),
                estadoVia: mapE(ENUM_ESTADO_VIA, r[27]),
                visibilidad: mapE(ENUM_VISIBILIDAD, r[28]),
                obs1: obsViaMap.get(s(r[29])) || undefined,
                obs2: obsViaMap.get(s(r[30])) || undefined,
                obs3: obsViaMap.get(s(r[31])) || undefined,
                obs4: obsViaMap.get(s(r[32])) || undefined,
                obs5: obsViaMap.get(s(r[33])) || undefined,
                obs6: obsViaMap.get(s(r[34])) || undefined,
                anteJardinIzq: n(r[35]) ?? 0,
                andenIzq: n(r[36]) ?? 0,
                zonaVerdeIzq: n(r[37]) ?? 0,
                areaServIzq: n(r[38]) ?? 0,
                sardIzqCalzA: n(r[39]) ?? 0,
                cicloRutaIzq: n(r[40]) ?? 0,
                bahiaEstIzq: n(r[41]) ?? 0,
                sardDerCalzA: n(r[42]) ?? 0,
                cunetaIzq: n(r[43]) ?? 0,
                bermaIzq: n(r[44]) ?? 0,
                calzadaIzq: n(r[45]) ?? 0,
                separadorZonaVerdeIzq: n(r[46]) ?? 0,
                anteJardinDer: n(r[47]) ?? 0,
                andenDer: n(r[48]) ?? 0,
                zonaVerdeDer: n(r[49]) ?? 0,
                areaServDer: n(r[50]) ?? 0,
                sardDerCalzB: n(r[51]) ?? 0,
                cicloRutaDer: n(r[52]) ?? 0,
                bahiaEstDer: n(r[53]) ?? 0,
                sardIzqCalzB: n(r[54]) ?? 0,
                cunetaDer: n(r[55]) ?? 0,
                bermaDer: n(r[56]) ?? 0,
                calzadaDer: n(r[57]) ?? 0
            };

            if (perfilId) body.perfilEsquema = perfilId;

            if (dryRun) {
                tramosIndex.push({ _id: `dry-${i}`, nom: normNom(r[20]), zat: s(r[12]), lat, lng });
                stats.via.ok++;
                continue;
            }

            const res = await apiPost('/via-tramos', body);
            if (!res.ok) {
                const msg = res.json?.message || JSON.stringify(res.json);
                if (stats.via.err === 0) {
                    console.error(`  ✖ Primer error (fila ${fila}): ${msg}`);
                    console.error('    Body:', JSON.stringify(body).slice(0, 400));
                }
                errores.push({ mod: 'via', fila, error: msg });
                stats.via.err++;
            } else {
                const id = res.json.tramo?._id;
                if (id) {
                    tramosIndex.push({ _id: id, nom: normNom(r[20]), zat: s(r[12]), lat, lng });
                }
                stats.via.ok++;
            }

            if ((i) % 100 === 0) console.log(`  … ${i}/${total} (ok=${stats.via.ok}, err=${stats.via.err})`);
            await throttle(i);
        }
        console.log(`  Vías: ${stats.via.ok} OK, ${stats.via.err} err`);
        console.log(`  Tramos indexados: ${tramosIndex.length}\n`);
    }

    /* ── Load existing tramos if skipped vías ────────────────── */
    if (!doVia && (doVert || doHor) && tramosIndex.length === 0) {
        console.log('  Cargando tramos existentes de la API…');
        const res = await apiFetch('/via-tramos');
        if (res.ok) {
            const tramos = res.json.tramos || [];
            for (const t of tramos) {
                const coords = t.ubicacion?.coordinates;
                const lat = coords?.[0]?.[1];
                const lng = coords?.[0]?.[0];
                const nom = t.nomenclatura?.completa || '';
                tramosIndex.push({ _id: t._id, nom: normNom(nom), zat: '', lat: lat || 0, lng: lng || 0 });
            }
        }
        console.log(`  Tramos cargados: ${tramosIndex.length}\n`);
    }

    /* ── Función para encontrar tramo más cercano ────────────── */
    function findTramo(nom, zat, lat, lng) {
        const normN = normNom(nom);

        // 1) Match exacto por nomenclatura
        const exactMatches = tramosIndex.filter(t => t.nom === normN);
        if (exactMatches.length === 1) return exactMatches[0]._id;
        if (exactMatches.length > 1) {
            const sameZat = exactMatches.find(t => t.zat === zat);
            if (sameZat) return sameZat._id;
            return exactMatches[0]._id;
        }

        // 2) Match parcial (nomenclatura contiene o está contenida)
        if (normN) {
            const partial = tramosIndex.filter(t => t.nom && (t.nom.includes(normN) || normN.includes(t.nom)));
            if (partial.length === 1) return partial[0]._id;
            if (partial.length > 1) {
                const sameZat = partial.find(t => t.zat === zat);
                if (sameZat) return sameZat._id;
            }
        }

        // 3) Más cercano por coordenadas en mismo ZAT
        if (lat != null && lng != null) {
            const sameZat = tramosIndex.filter(t => t.zat === zat);
            if (sameZat.length > 0) {
                let best = sameZat[0], bestD = dist(lat, lng, best.lat, best.lng);
                for (let j = 1; j < sameZat.length; j++) {
                    const d = dist(lat, lng, sameZat[j].lat, sameZat[j].lng);
                    if (d < bestD) { bestD = d; best = sameZat[j]; }
                }
                return best._id;
            }

            // 4) Más cercano global
            let best = tramosIndex[0], bestD = dist(lat, lng, best.lat, best.lng);
            for (let j = 1; j < tramosIndex.length; j++) {
                const d = dist(lat, lng, tramosIndex[j].lat, tramosIndex[j].lng);
                if (d < bestD) { bestD = d; best = tramosIndex[j]; }
            }
            return best._id;
        }

        return null;
    }

    /* ═══════════════════════════════════════════════════════════
     *  SEÑALES VERTICALES
     * ═══════════════════════════════════════════════════════════ */
    const vertSheet = wb.SheetNames.find(n => /vert/i.test(n));
    if (doVert && vertSheet) {
        console.log('── Importar señales verticales ──');
        const data = XLSX.utils.sheet_to_json(wb.Sheets[vertSheet], { header: 1, defval: '' });
        const total = data.length - 1;
        console.log(`  Filas: ${total}`);

        let matched = 0, noMatch = 0;

        for (let i = 1; i < data.length; i++) {
            const r = data[i];
            if (isBlankRow(r)) continue;
            const fila = i + 1;
            const mun = s(r[1]);
            if (!mun) continue;

            const lat = n(r[4]);
            const lng = n(r[5]);
            if (lat == null || lng == null) {
                errores.push({ mod: 'vert', fila, error: 'Sin coordenadas' });
                stats.vert.err++;
                continue;
            }

            const nom = s(r[2]);
            const zat = s(r[3]);
            const idViaTramo = findTramo(nom, zat, lat, lng);
            if (!idViaTramo) {
                errores.push({ mod: 'vert', fila, error: `Sin tramo para: nom="${nom}" zat=${zat}` });
                stats.vert.err++;
                noMatch++;
                continue;
            }
            matched++;

            const body = {
                idJornada,
                idViaTramo,
                ubicacion: { type: 'Point', coordinates: [lng, lat] },
                codSe: s(r[6]),
                estado: s(r[7]),
                matPlaca: s(r[8]),
                ubicEspacial: s(r[9]),
                obstruccion: s(r[10]),
                forma: s(r[12]),
                orientacion: s(r[13]),
                reflecOptima: s(r[14]),
                dimTablero: s(r[15]),
                ubicPerVial: s(r[16]),
                fase: s(r[17]),
                accion: s(r[18]),
                ubicLateral: n(r[19]),
                diagUbicLat: s(r[20]),
                altura: n(r[21]),
                diagAltura: s(r[22]),
                banderas: s(r[23]),
                leyendas: s(r[24]),
                falla1: s(r[25]),
                falla2: s(r[26]),
                falla3: s(r[27]),
                falla4: s(r[28]),
                falla5: s(r[29]),
                tipoSoporte: s(r[30]),
                sistemaSoporte: s(r[31]),
                estadoSoporte: s(r[32]),
                estadoAnclaje: s(r[33]),
                notas: s(r[34])
            };

            const fi = excelDate(r[11]);
            if (fi) body.fechaInst = fi.toISOString();

            if (dryRun) { stats.vert.ok++; continue; }

            const res = await apiPost('/sen-vert', body);
            if (!res.ok) {
                errores.push({ mod: 'vert', fila, error: res.json?.message || JSON.stringify(res.json) });
                stats.vert.err++;
            } else {
                stats.vert.ok++;
            }

            if ((i) % 200 === 0) console.log(`  … ${i}/${total} (ok=${stats.vert.ok}, err=${stats.vert.err})`);
            await throttle(i);
        }
        console.log(`  Sen vert: ${stats.vert.ok} OK, ${stats.vert.err} err (match=${matched}, noMatch=${noMatch})`);
    }

    /* ═══════════════════════════════════════════════════════════
     *  SEÑALES HORIZONTALES
     * ═══════════════════════════════════════════════════════════ */
    const horSheet = wb.SheetNames.find(n => /hor/i.test(n));
    if (doHor && horSheet) {
        console.log('\n── Importar señales horizontales ──');
        const data = XLSX.utils.sheet_to_json(wb.Sheets[horSheet], { header: 1, defval: '' });
        const total = data.length - 1;
        console.log(`  Filas: ${total}`);

        let matched = 0, noMatch = 0;

        for (let i = 1; i < data.length; i++) {
            const r = data[i];
            if (isBlankRow(r)) continue;
            const fila = i + 1;
            const mun = s(r[1]);
            if (!mun) continue;

            const lat = n(r[4]);
            const lng = n(r[5]);
            if (lat == null || lng == null) {
                errores.push({ mod: 'hor', fila, error: 'Sin coordenadas' });
                stats.hor.err++;
                continue;
            }

            const nom = s(r[2]);
            const zat = s(r[3]);
            const idViaTramo = findTramo(nom, zat, lat, lng);
            if (!idViaTramo) {
                errores.push({ mod: 'hor', fila, error: `Sin tramo para: nom="${nom}" zat=${zat}` });
                stats.hor.err++;
                noMatch++;
                continue;
            }
            matched++;

            const body = {
                idJornada,
                idViaTramo,
                ubicacion: { type: 'Point', coordinates: [lng, lat] },
                codSeHor: s(r[6]),
                tipoDem: s(r[7]),
                estadoDem: s(r[8]),
                tipoPintura: s(r[9]),
                material: s(r[10]),
                fase: s(r[12]),
                accion: s(r[13]),
                ubicResTramo: s(r[15]),
                reflectOptima: s(r[16]),
                color: s(r[17]),
                claseDemLinea: s(r[18]),
                claseDemPunto: s(r[19]),
                notas: s(r[25])
            };

            const fi = excelDate(r[11]);
            if (fi) body.fechaInst = fi.toISOString();
            const fa = excelDate(r[14]);
            if (fa) body.fechaAccion = fa.toISOString();

            if (dryRun) { stats.hor.ok++; continue; }

            const res = await apiPost('/sen-hor', body);
            if (!res.ok) {
                errores.push({ mod: 'hor', fila, error: res.json?.message || JSON.stringify(res.json) });
                stats.hor.err++;
            } else {
                stats.hor.ok++;
            }

            if ((i) % 200 === 0) console.log(`  … ${i}/${total} (ok=${stats.hor.ok}, err=${stats.hor.err})`);
            await throttle(i);
        }
        console.log(`  Sen hor: ${stats.hor.ok} OK, ${stats.hor.err} err (match=${matched}, noMatch=${noMatch})`);
    }

    /* ── Resumen ─────────────────────────────────────────────── */
    console.log('\n══════════════════════════════════════');
    console.log('RESUMEN:');
    if (doVia)  console.log(`  Vía-tramos:       ${stats.via.ok} OK, ${stats.via.err} err`);
    if (doVert) console.log(`  Sen verticales:   ${stats.vert.ok} OK, ${stats.vert.err} err`);
    if (doHor)  console.log(`  Sen horizontales: ${stats.hor.ok} OK, ${stats.hor.err} err`);
    console.log(`  Errores totales: ${errores.length}`);

    if (errores.length) {
        const outPath = path.join(__dirname, '..', 'imports', `errores-${Date.now()}.json`);
        fs.writeFileSync(outPath, JSON.stringify(errores, null, 2), 'utf8');
        console.log(`  Archivo: ${outPath}`);
    }

    if (dryRun) console.log('\n  (DRY-RUN: no se insertó nada)');
    console.log('\nFinalizado.');
}

main().catch(async (e) => {
    console.error('\nERROR FATAL:', e.message || e);
    console.error(e.stack);
    try {
        fs.writeFileSync(
            path.join(__dirname, '..', 'imports', `errores-${Date.now()}.json`),
            JSON.stringify([{ mod: 'FATAL', error: String(e) }], null, 2), 'utf8'
        );
    } catch { /* noop */ }
    process.exit(1);
});
