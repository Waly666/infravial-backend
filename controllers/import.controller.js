const fs = require('fs');
const path = require('path');
const multer = require('multer');
const XLSX = require('xlsx');
const { spawn } = require('child_process');
const Jornada = require('../models/Jornada');
const Audit = require('../models/Audit');
const ViaTramo = require('../models/ViaTramo');
const ExistSenVert = require('../models/ExistSenVert');
const ExistSenHor = require('../models/ExistSenHor');

const IMPORTS_DIR = path.join(__dirname, '..', 'imports');
if (!fs.existsSync(IMPORTS_DIR)) fs.mkdirSync(IMPORTS_DIR, { recursive: true });

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, IMPORTS_DIR),
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname || '').toLowerCase() || '.xlsx';
        const base = path.basename(file.originalname || 'importacion', ext)
            .toLowerCase()
            .replace(/[^a-z0-9-_]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 60) || 'importacion';
        cb(null, `${base}-${Date.now()}${ext}`);
    }
});

const excelFilter = (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (ext === '.xlsx' || ext === '.xls') return cb(null, true);
    cb(new Error('Solo se permiten archivos Excel (.xlsx, .xls)'));
};

const uploadExcel = multer({
    storage,
    fileFilter: excelFilter,
    limits: { fileSize: 20 * 1024 * 1024 }
});

let importInProgress = false;
const importStatus = {
    running: false,
    startedAt: null,
    finishedAt: null,
    dryRun: true,
    archivo: null,
    municipio: null,
    jornadaActiva: null,
    currentModule: null,
    lastLine: '',
    via: { current: 0, total: 0, ok: 0, err: 0 },
    vert: { current: 0, total: 0, ok: 0, err: 0 },
    hor: { current: 0, total: 0, ok: 0, err: 0 }
};

function norm(v) {
    return String(v || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toUpperCase()
        .replace(/\s+/g, ' ');
}

function parseMunicipiosFromSheet(data, columnIdx) {
    const set = new Set();
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const val = row?.[columnIdx];
        if (val == null || val === '') continue;
        const n = norm(val);
        if (n) set.add(n);
    }
    return set;
}

function getMunicipiosFromExcel(filePath) {
    const wb = XLSX.readFile(filePath);
    const municipios = new Set();

    const viaSheet = wb.SheetNames.find(n => /via/i.test(n));
    if (viaSheet) {
        const viaRows = XLSX.utils.sheet_to_json(wb.Sheets[viaSheet], { header: 1, defval: '' });
        for (const m of parseMunicipiosFromSheet(viaRows, 2)) municipios.add(m);
    }

    const vertSheet = wb.SheetNames.find(n => /vert/i.test(n));
    if (vertSheet) {
        const vertRows = XLSX.utils.sheet_to_json(wb.Sheets[vertSheet], { header: 1, defval: '' });
        for (const m of parseMunicipiosFromSheet(vertRows, 1)) municipios.add(m);
    }

    const horSheet = wb.SheetNames.find(n => /hor/i.test(n));
    if (horSheet) {
        const horRows = XLSX.utils.sheet_to_json(wb.Sheets[horSheet], { header: 1, defval: '' });
        for (const m of parseMunicipiosFromSheet(horRows, 1)) municipios.add(m);
    }

    return Array.from(municipios);
}

function runImporter({ filePath, token, dryRun }) {
    return new Promise((resolve, reject) => {
        const base = process.env.IMPORT_API_BASE || `http://127.0.0.1:${process.env.PORT || 3000}`;
        const scriptPath = path.join(__dirname, '..', 'scripts', 'importar-excel.js');
        const args = [scriptPath, '--file', filePath, '--token', token, '--base', base];
        if (dryRun) args.push('--dry-run');

        const child = spawn(process.execPath, args, { cwd: path.join(__dirname, '..') });
        let stdout = '';
        let stderr = '';
        let pendingLine = '';

        const applyLineProgress = (line) => {
            if (!line) return;
            importStatus.lastLine = line;

            if (/── Importar vías/i.test(line)) importStatus.currentModule = 'via';
            else if (/── Importar señales verticales/i.test(line)) importStatus.currentModule = 'vert';
            else if (/── Importar señales horizontales/i.test(line)) importStatus.currentModule = 'hor';

            const filasMatch = line.match(/Filas:\s*(\d+)/i);
            if (filasMatch && importStatus.currentModule) {
                importStatus[importStatus.currentModule].total = Number(filasMatch[1]) || 0;
            }

            const progressMatch = line.match(/(?:…|\.\.\.)\s*(\d+)\/(\d+)\s*\(ok=(\d+),\s*err=(\d+)\)/i);
            if (progressMatch && importStatus.currentModule) {
                const block = importStatus[importStatus.currentModule];
                block.current = Number(progressMatch[1]) || 0;
                block.total = Number(progressMatch[2]) || block.total || 0;
                block.ok = Number(progressMatch[3]) || 0;
                block.err = Number(progressMatch[4]) || 0;
            }

            const viaMatch = line.match(/Vías:\s*(\d+)\s*OK,\s*(\d+)\s*err/i);
            if (viaMatch) {
                importStatus.via.ok = Number(viaMatch[1]) || 0;
                importStatus.via.err = Number(viaMatch[2]) || 0;
                importStatus.via.current = importStatus.via.total || (importStatus.via.ok + importStatus.via.err);
            }

            const vertMatch = line.match(/Sen vert:\s*(\d+)\s*OK,\s*(\d+)\s*err/i);
            if (vertMatch) {
                importStatus.vert.ok = Number(vertMatch[1]) || 0;
                importStatus.vert.err = Number(vertMatch[2]) || 0;
                importStatus.vert.current = importStatus.vert.total || (importStatus.vert.ok + importStatus.vert.err);
            }

            const horMatch = line.match(/Sen hor:\s*(\d+)\s*OK,\s*(\d+)\s*err/i);
            if (horMatch) {
                importStatus.hor.ok = Number(horMatch[1]) || 0;
                importStatus.hor.err = Number(horMatch[2]) || 0;
                importStatus.hor.current = importStatus.hor.total || (importStatus.hor.ok + importStatus.hor.err);
            }
        };

        child.stdout.on('data', chunk => {
            const text = String(chunk);
            stdout += text;
            pendingLine += text;
            const parts = pendingLine.split(/\r?\n/);
            pendingLine = parts.pop() || '';
            for (const line of parts) applyLineProgress(line.trim());
        });
        child.stderr.on('data', chunk => { stderr += String(chunk); });
        child.on('error', reject);
        child.on('close', code => {
            if (pendingLine.trim()) applyLineProgress(pendingLine.trim());
            if (code === 0) return resolve({ stdout, stderr });
            reject(new Error(stderr || stdout || `Importador finalizó con código ${code}`));
        });
    });
}

function extractSummary(output) {
    const parse = (re) => {
        const m = output.match(re);
        if (!m) return null;
        return { ok: Number(m[1] || 0), err: Number(m[2] || 0) };
    };
    return {
        viaTramos: parse(/Vía-tramos:\s+(\d+)\s+OK,\s+(\d+)\s+err/),
        senVert: parse(/Sen verticales:\s+(\d+)\s+OK,\s+(\d+)\s+err/),
        senHor: parse(/Sen horizontales:\s+(\d+)\s+OK,\s+(\d+)\s+err/),
        erroresTotales: Number((output.match(/Errores totales:\s+(\d+)/) || [])[1] || 0),
        archivoErrores: (output.match(/Archivo:\s+(.+)/) || [])[1]?.trim() || null
    };
}

function asBool(v) {
    if (typeof v === 'boolean') return v;
    const low = String(v || '').trim().toLowerCase();
    return low === '1' || low === 'true' || low === 'si' || low === 'sí' || low === 'yes';
}

function getReqIp(req) {
    const xff = req.headers['x-forwarded-for'];
    if (typeof xff === 'string' && xff.trim()) return xff.split(',')[0].trim();
    return req.ip;
}

async function writeImportAudit(req, status, payload) {
    try {
        await Audit.create({
            user: req.user?.id || null,
            metodo: req.method,
            ruta: req.originalUrl,
            ip: getReqIp(req),
            status,
            duracion: payload?.duracionMs || 0,
            userAgent: req.headers['user-agent'],
            fecha: new Date(),
            cambio: JSON.stringify(payload)
        });
    } catch {
        // El logger general ya guarda trazas; no interrumpir la importación por auditoría.
    }
}

async function importExcel(req, res) {
    const startedAt = new Date();
    if (importInProgress) {
        await writeImportAudit(req, 409, {
            tipo: 'import_excel',
            motivo: 'importacion_en_progreso'
        });
        return res.status(409).json({ message: 'Ya hay una importación en ejecución. Solo se permite una a la vez.' });
    }
    if (!req.file?.path) {
        await writeImportAudit(req, 400, {
            tipo: 'import_excel',
            motivo: 'archivo_no_enviado'
        });
        return res.status(400).json({ message: 'Debes adjuntar un archivo Excel en el campo "file".' });
    }

    try {
        const jornada = await Jornada.findOne({ estado: 'EN PROCESO' });
        const dryRun = asBool(req.body?.dryRun);
        if (!jornada) {
            await writeImportAudit(req, 400, {
                tipo: 'import_excel',
                dryRun,
                archivo: path.basename(req.file.path),
                motivo: 'sin_jornada_activa'
            });
            return res.status(400).json({ message: 'No hay jornada activa. Debes activar una jornada antes de importar.' });
        }

        const municipios = getMunicipiosFromExcel(req.file.path);
        if (municipios.length === 0) {
            await writeImportAudit(req, 400, {
                tipo: 'import_excel',
                dryRun,
                archivo: path.basename(req.file.path),
                jornadaActiva: jornada.municipio,
                motivo: 'municipio_no_detectado'
            });
            return res.status(400).json({ message: 'No se detectó municipio en el archivo Excel.' });
        }
        if (municipios.length > 1) {
            await writeImportAudit(req, 400, {
                tipo: 'import_excel',
                dryRun,
                archivo: path.basename(req.file.path),
                jornadaActiva: jornada.municipio,
                municipiosDetectados: municipios,
                motivo: 'multiples_municipios'
            });
            return res.status(400).json({
                message: 'El archivo contiene más de un municipio. Solo se permite importar un municipio por operación.',
                municipiosDetectados: municipios
            });
        }

        const municipioExcel = municipios[0];
        const municipioJornada = norm(jornada.municipio);
        if (municipioExcel !== municipioJornada) {
            await writeImportAudit(req, 400, {
                tipo: 'import_excel',
                dryRun,
                archivo: path.basename(req.file.path),
                municipioExcel,
                municipioJornada,
                motivo: 'municipio_no_coincide'
            });
            return res.status(400).json({
                message: `El municipio del archivo (${municipioExcel}) no coincide con la jornada activa (${municipioJornada}).`,
                municipioExcel,
                municipioJornada
            });
        }

        const auth = req.headers.authorization || '';
        const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
        if (!token) {
            await writeImportAudit(req, 401, {
                tipo: 'import_excel',
                dryRun,
                archivo: path.basename(req.file.path),
                municipio: municipioExcel,
                jornadaActiva: jornada.municipio,
                motivo: 'token_no_disponible'
            });
            return res.status(401).json({ message: 'Token no disponible para ejecutar la importación.' });
        }

        importInProgress = true;
        importStatus.running = true;
        importStatus.startedAt = startedAt;
        importStatus.finishedAt = null;
        importStatus.dryRun = dryRun;
        importStatus.archivo = path.basename(req.file.path);
        importStatus.municipio = municipioExcel;
        importStatus.jornadaActiva = jornada.municipio;
        importStatus.currentModule = null;
        importStatus.lastLine = 'Iniciando importación...';
        importStatus.via = { current: 0, total: 0, ok: 0, err: 0 };
        importStatus.vert = { current: 0, total: 0, ok: 0, err: 0 };
        importStatus.hor = { current: 0, total: 0, ok: 0, err: 0 };
        const { stdout } = await runImporter({ filePath: req.file.path, token, dryRun });
        const summary = extractSummary(stdout);
        const finishedAt = new Date();
        importStatus.running = false;
        importStatus.finishedAt = finishedAt;
        if (summary.viaTramos) {
            importStatus.via.ok = summary.viaTramos.ok;
            importStatus.via.err = summary.viaTramos.err;
            importStatus.via.current = importStatus.via.total || (summary.viaTramos.ok + summary.viaTramos.err);
        }
        if (summary.senVert) {
            importStatus.vert.ok = summary.senVert.ok;
            importStatus.vert.err = summary.senVert.err;
            importStatus.vert.current = importStatus.vert.total || (summary.senVert.ok + summary.senVert.err);
        }
        if (summary.senHor) {
            importStatus.hor.ok = summary.senHor.ok;
            importStatus.hor.err = summary.senHor.err;
            importStatus.hor.current = importStatus.hor.total || (summary.senHor.ok + summary.senHor.err);
        }
        importStatus.lastLine = 'Finalizado';
        await writeImportAudit(req, 200, {
            tipo: 'import_excel',
            dryRun,
            archivo: path.basename(req.file.path),
            idJornada: String(jornada._id),
            municipio: municipioExcel,
            jornadaActiva: jornada.municipio,
            startedAt: startedAt.toISOString(),
            finishedAt: finishedAt.toISOString(),
            resumen: summary,
            duracionMs: finishedAt.getTime() - startedAt.getTime()
        });

        return res.json({
            message: dryRun ? 'Dry-run ejecutado correctamente.' : 'Importación ejecutada correctamente.',
            archivo: path.basename(req.file.path),
            municipio: municipioExcel,
            jornadaActiva: jornada.municipio,
            dryRun,
            startedAt,
            finishedAt,
            resumen: summary,
            log: stdout
        });
    } catch (err) {
        importStatus.running = false;
        importStatus.finishedAt = new Date();
        importStatus.lastLine = `Error: ${err.message || String(err)}`;
        await writeImportAudit(req, 500, {
            tipo: 'import_excel',
            archivo: req.file?.path ? path.basename(req.file.path) : null,
            motivo: 'error_ejecucion',
            error: err.message || String(err)
        });
        return res.status(500).json({ message: err.message || 'Falló la importación del Excel.' });
    } finally {
        importInProgress = false;
    }
}

async function rollbackLastImport(req, res) {
    if (importInProgress) {
        return res.status(409).json({ message: 'Hay una importación en ejecución. No se puede hacer rollback ahora.' });
    }

    try {
        const lastImportAudit = await Audit.findOne({
            ruta: '/imports/excel',
            metodo: 'POST',
            status: 200,
            cambio: { $regex: '"tipo":"import_excel"' }
        }).sort({ fecha: -1 });

        if (!lastImportAudit) {
            return res.status(404).json({ message: 'No se encontró una importación previa para revertir.' });
        }

        let info;
        try {
            info = JSON.parse(lastImportAudit.cambio || '{}');
        } catch {
            return res.status(409).json({ message: 'No se pudo interpretar la metadata de la última importación.' });
        }

        if (info?.dryRun) {
            return res.status(409).json({ message: 'La última ejecución fue dry-run, no hay datos insertados para revertir.' });
        }

        if (!info?.idJornada || !info?.municipio || !info?.startedAt || !info?.finishedAt) {
            return res.status(409).json({
                message: 'La última importación no tiene metadata completa para rollback automático. Ejecuta rollback manual.'
            });
        }

        const alreadyRolledBack = await Audit.findOne({
            ruta: '/imports/rollback-last',
            metodo: 'POST',
            status: 200,
            cambio: { $regex: `"rollbackOf":"${String(lastImportAudit._id)}"` }
        });
        if (alreadyRolledBack) {
            return res.status(409).json({ message: 'La última importación ya fue revertida previamente.' });
        }

        const startedAt = new Date(info.startedAt);
        const finishedAt = new Date(info.finishedAt);
        if (Number.isNaN(startedAt.getTime()) || Number.isNaN(finishedAt.getTime())) {
            return res.status(409).json({ message: 'Fechas inválidas en metadata de importación. No se puede revertir automáticamente.' });
        }

        const userId = lastImportAudit.user || null;
        const windowStart = new Date(startedAt.getTime() - 5000);
        const windowEnd = new Date(finishedAt.getTime() + 5000);

        const viaFilter = {
            idJornada: info.idJornada,
            municipio: info.municipio,
            fechaCreacion: { $gte: windowStart, $lte: windowEnd }
        };
        if (userId) viaFilter.creadoPor = userId;

        const vias = await ViaTramo.find(viaFilter).select('_id');
        const viaIds = vias.map(v => v._id);
        if (!viaIds.length) {
            return res.status(404).json({
                message: 'No se encontraron registros de tramos de la última importación para revertir.'
            });
        }

        const delVert = await ExistSenVert.deleteMany({ idJornada: info.idJornada, idViaTramo: { $in: viaIds } });
        const delHor = await ExistSenHor.deleteMany({ idJornada: info.idJornada, idViaTramo: { $in: viaIds } });
        const delVia = await ViaTramo.deleteMany({ _id: { $in: viaIds } });

        await writeImportAudit(req, 200, {
            tipo: 'import_rollback',
            rollbackOf: String(lastImportAudit._id),
            idJornada: info.idJornada,
            municipio: info.municipio,
            borrado: {
                viaTramos: delVia.deletedCount || 0,
                senVert: delVert.deletedCount || 0,
                senHor: delHor.deletedCount || 0
            }
        });

        return res.json({
            message: 'Rollback de última importación ejecutado correctamente.',
            rollbackOf: String(lastImportAudit._id),
            municipio: info.municipio,
            idJornada: info.idJornada,
            borrado: {
                viaTramos: delVia.deletedCount || 0,
                senVert: delVert.deletedCount || 0,
                senHor: delHor.deletedCount || 0
            }
        });
    } catch (err) {
        await writeImportAudit(req, 500, {
            tipo: 'import_rollback',
            motivo: 'error_rollback',
            error: err.message || String(err)
        });
        return res.status(500).json({ message: err.message || 'Falló rollback de la última importación.' });
    }
}

function getImportStatus(_req, res) {
    res.json({ status: importStatus });
}

module.exports = {
    uploadExcel,
    importExcel,
    getImportStatus,
    rollbackLastImport
};
