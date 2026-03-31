const fs = require('fs');
const path = require('path');
const os = require('os');
const zlib = require('zlib');
const crypto = require('crypto');
const mongoose = require('mongoose');
const { EJSON } = require('bson');
const archiver = require('archiver');
const unzipper = require('unzipper');
const BackupEvent = require('../models/BackupEvent');
require('../models/_register');

const BACKUP_DIR = process.env.BACKUP_DIR || path.join(__dirname, '../backups');
const UPLOADS_DIR = path.join(__dirname, '../uploads');

const BACKUP_FILE_RE = /^infravial-backup-.+\.json\.gz$/;
const BACKUP_ZIP_RE = /^infravial-full-backup-.+\.zip$/;

/** Grupos de purga → nombres de modelo Mongoose */
const PURGE_GROUPS = {
    inventario: [
        'ViaTramo',
        'ExistSenVert',
        'ExistSenHor',
        'Semaforo',
        'ControlSemaforo',
        'CajaInspeccion',
        'ObservacionSV',
        'ObservacionSH',
        'ObsSemaforo',
        'ObservacionVia',
        'RespuestaEncVia',
        'PreguntaEncVia'
    ],
    catalogos: ['SenVert', 'EsquemaPerfil', 'UbicSenHor', 'Demarcacion'],
    geograficos: ['Zat', 'Comuna', 'Barrio'],
    jornadas: ['Jornada'],
    divipol: ['Divipol'],
    auditoria: ['Audit'],
    respaldos_log: ['BackupEvent'],
    usuarios_otros: ['User']
};

function ensureBackupDir() {
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
}

function nowStamp() {
    return new Date().toISOString().replace(/[:.]/g, '-');
}

function sha256Buffer(buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex');
}

function sha256File(filePath) {
    const hash = crypto.createHash('sha256');
    hash.update(fs.readFileSync(filePath));
    return hash.digest('hex');
}

function isZipBuffer(buf) {
    return buf && buf.length >= 4 && buf[0] === 0x50 && buf[1] === 0x4b;
}

function isGzipBuffer(buf) {
    return buf && buf.length >= 2 && buf[0] === 0x1f && buf[1] === 0x8b;
}

function resolveServerBackupPath(fileName) {
    const base = path.basename(fileName || '');
    if (BACKUP_ZIP_RE.test(base)) {
        const filePath = path.join(BACKUP_DIR, base);
        if (!fs.existsSync(filePath)) {
            throw new Error('El archivo de backup no existe en el servidor.');
        }
        return { filePath, fileName: base, kind: 'zip' };
    }
    if (BACKUP_FILE_RE.test(base)) {
        const filePath = path.join(BACKUP_DIR, base);
        if (!fs.existsSync(filePath)) {
            throw new Error('El archivo de backup no existe en el servidor.');
        }
        return { filePath, fileName: base, kind: 'gzip' };
    }
    throw new Error(
        'Nombre no valido. Use infravial-full-backup-*.zip (recomendado) o infravial-backup-*.json.gz (solo BD).'
    );
}

function getBackupDownloadPath(fileName) {
    return resolveServerBackupPath(fileName);
}

/**
 * Sustituye el contenido de uploads/ por el del backup.
 * En Docker, /app/uploads suele ser volumen montado: no se puede borrar el directorio raíz (EBUSY);
 * solo se vacían hijos y se copian los archivos del ZIP.
 */
function replaceUploadsDir(uploadsSrcInExtract) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    if (fs.existsSync(UPLOADS_DIR)) {
        for (const name of fs.readdirSync(UPLOADS_DIR)) {
            const p = path.join(UPLOADS_DIR, name);
            fs.rmSync(p, { recursive: true, force: true });
        }
    }
    if (fs.existsSync(uploadsSrcInExtract)) {
        fs.cpSync(uploadsSrcInExtract, UPLOADS_DIR, { recursive: true });
    }
}

async function extractZipFileSafely(zipPath, destDir) {
    fs.mkdirSync(destDir, { recursive: true });
    const directory = await unzipper.Open.file(zipPath);
    const rootResolved = path.resolve(destDir);

    for (const entry of directory.files) {
        const entryPath = entry.path.replace(/\\/g, '/');
        if (
            entryPath.startsWith('/') ||
            entryPath.includes('..') ||
            entryPath.startsWith('..')
        ) {
            continue;
        }
        const destPath = path.join(destDir, entryPath);
        const resolved = path.resolve(destPath);
        if (!resolved.startsWith(rootResolved)) {
            continue;
        }
        if (entry.type === 'Directory') {
            fs.mkdirSync(resolved, { recursive: true });
            continue;
        }
        fs.mkdirSync(path.dirname(resolved), { recursive: true });
        await new Promise((resolve, reject) => {
            entry.stream()
                .pipe(fs.createWriteStream(resolved))
                .on('finish', resolve)
                .on('error', reject);
        });
    }
}

/**
 * Restaura BD desde database.json.gz dentro del ZIP y luego reemplaza uploads/.
 */
async function restoreFromFullZipFile(
    zipPath,
    logicalName,
    rutaArchivoLog,
    actor,
    userId
) {
    const extractRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'infravial-ex-'));
    try {
        await extractZipFileSafely(zipPath, extractRoot);
        const dbPath = path.join(extractRoot, 'database.json.gz');
        if (!fs.existsSync(dbPath)) {
            throw new Error(
                'El ZIP no contiene database.json.gz. Use un backup generado por INFRAVIAL (completo).'
            );
        }
        const gz = fs.readFileSync(dbPath);
        const result = await applyRestoreFromZippedBuffer(
            gz,
            logicalName,
            rutaArchivoLog,
            actor,
            userId
        );
        const uploadsSrc = path.join(extractRoot, 'uploads');
        replaceUploadsDir(uploadsSrc);
        await BackupEvent.findByIdAndUpdate(result.eventId, {
            $set: {
                detalle: `${result.detalleBase} | Carpeta uploads/ reemplazada desde el ZIP.`
            }
        });
        return { ...result, uploadsRestored: true };
    } finally {
        fs.rmSync(extractRoot, { recursive: true, force: true });
    }
}

function writeFullBackupZip(outPath, dbGzBuffer, uploadsRoot) {
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(outPath);
        const archive = archiver('zip', { zlib: { level: 6 } });
        output.on('close', () => resolve());
        archive.on('error', reject);
        archive.pipe(output);
        const manifest = {
            version: 2,
            format: 'infravial-full',
            dbFile: 'database.json.gz',
            createdAt: new Date().toISOString(),
            note: 'Restaurar con INFRAVIAL: reemplaza MongoDB y la carpeta uploads/ del servidor.'
        };
        archive.append(JSON.stringify(manifest, null, 2), { name: 'manifest.json' });
        archive.append(dbGzBuffer, { name: 'database.json.gz' });
        if (fs.existsSync(uploadsRoot)) {
            archive.directory(uploadsRoot, 'uploads');
        }
        archive.finalize();
    });
}

async function applyRestoreFromZippedBuffer(
    zipped,
    logicalFileName,
    rutaArchivoLog,
    actor,
    userId
) {
    const fechaInicio = new Date();
    const hash = sha256Buffer(zipped);
    let raw;
    try {
        raw = zlib.gunzipSync(zipped).toString('utf8');
    } catch (_e) {
        throw new Error('No se pudo descomprimir database.json.gz.');
    }
    const data = EJSON.parse(raw, { relaxed: false });

    if (!data?.collections || typeof data.collections !== 'object') {
        throw new Error('Formato de backup invalido.');
    }

    const conn = mongoose.connection.db;
    const collectionNames = Object.keys(data.collections).filter(
        (n) => !n.startsWith('system.')
    );

    let totalRegistros = 0;
    for (const collName of collectionNames) {
        const docs = Array.isArray(data.collections[collName])
            ? data.collections[collName]
            : [];
        await conn.collection(collName).deleteMany({});
        if (docs.length) await conn.collection(collName).insertMany(docs);
        totalRegistros += docs.length;
    }

    const detalleBase = `Restore BD (${logicalFileName}) sobre ${collectionNames.length} colecciones, ${totalRegistros} documentos`;

    const event = await BackupEvent.create({
        tipo: 'restore',
        estado: 'success',
        actor,
        user: userId,
        archivo: logicalFileName,
        rutaArchivo: rutaArchivoLog || logicalFileName,
        sha256: hash,
        tamanoBytes: zipped.length,
        colecciones: collectionNames.length,
        registros: totalRegistros,
        detalle: detalleBase,
        fechaInicio,
        fechaFin: new Date()
    });

    return {
        eventId: event._id,
        archivo: logicalFileName,
        sha256: hash,
        tamanoBytes: zipped.length,
        colecciones: collectionNames.length,
        registros: totalRegistros,
        fecha: event.fechaFin,
        detalle: event.detalle,
        detalleBase
    };
}

async function createBackup(actor = 'system', userId = null) {
    ensureBackupDir();
    const fechaInicio = new Date();
    const conn = mongoose.connection.db;
    const collectionsMeta = await conn.listCollections().toArray();
    const collections = collectionsMeta
        .map((c) => c.name)
        .filter((n) => !n.startsWith('system.'));

    const payload = {
        version: 1,
        generatedAt: fechaInicio.toISOString(),
        dbName: conn.databaseName,
        collections: {}
    };

    let totalRegistros = 0;

    for (const collName of collections) {
        const docs = await conn.collection(collName).find({}).toArray();
        payload.collections[collName] = docs;
        totalRegistros += docs.length;
    }

    const raw = Buffer.from(EJSON.stringify(payload, { relaxed: false }));
    const gz = zlib.gzipSync(raw, { level: 9 });

    const zipName = `infravial-full-backup-${nowStamp()}.zip`;
    const zipPath = path.join(BACKUP_DIR, zipName);

    await writeFullBackupZip(zipPath, gz, UPLOADS_DIR);

    const zipSize = fs.statSync(zipPath).size;
    const zipHash = sha256File(zipPath);

    const event = await BackupEvent.create({
        tipo: 'backup',
        estado: 'success',
        actor,
        user: userId,
        archivo: zipName,
        rutaArchivo: zipPath,
        sha256: zipHash,
        tamanoBytes: zipSize,
        colecciones: collections.length,
        registros: totalRegistros,
        detalle: `Backup completo ZIP: MongoDB (${conn.databaseName}) + carpeta uploads/`,
        fechaInicio,
        fechaFin: new Date()
    });

    return {
        eventId: event._id,
        archivo: zipName,
        sha256: zipHash,
        tamanoBytes: zipSize,
        colecciones: collections.length,
        registros: totalRegistros,
        fecha: event.fechaFin
    };
}

async function listBackups() {
    ensureBackupDir();
    const events = await BackupEvent.find({})
        .populate('user', 'nombres apellidos user')
        .sort({ fechaInicio: -1 })
        .limit(300);

    return events;
}

async function restoreBackup(fileName, actor = 'system', userId = null) {
    ensureBackupDir();
    const { filePath, fileName: base, kind } = resolveServerBackupPath(fileName);
    if (kind === 'zip') {
        return restoreFromFullZipFile(filePath, base, filePath, actor, userId);
    }
    const zipped = fs.readFileSync(filePath);
    return applyRestoreFromZippedBuffer(zipped, base, filePath, actor, userId);
}

async function restoreFromUploadDiskPath(filePath, originalName, actor, userId) {
    try {
        const stat = fs.statSync(filePath);
        if (stat.size < 4) {
            throw new Error('Archivo demasiado pequeño.');
        }
        const fd = fs.openSync(filePath, 'r');
        const head = Buffer.alloc(4);
        fs.readSync(fd, head, 0, 4, 0);
        fs.closeSync(fd);

        const base = path
            .basename(originalName || 'backup')
            .replace(/[^\w.\-]/g, '_');

        /**
         * Hay que await a restore/apply: si solo se hace `return restoreFromFullZipFile(...)`,
         * el `finally` corre enseguida y borra el ZIP con unlink mientras unzipper aún lee el archivo → ENOENT / restore fallido.
         */
        if (isZipBuffer(head)) {
            return await restoreFromFullZipFile(
                filePath,
                base,
                `(upload) ${base}`,
                actor,
                userId
            );
        }
        if (isGzipBuffer(head)) {
            const gz = fs.readFileSync(filePath);
            return await applyRestoreFromZippedBuffer(
                gz,
                base.endsWith('.gz') ? base : `${base}.json.gz`,
                `(upload) ${originalName}`,
                actor,
                userId
            );
        }
        throw new Error(
            'Formato no reconocido. Suba un .zip (BD + fotos) o .json.gz (solo BD).'
        );
    } finally {
        try {
            fs.unlinkSync(filePath);
        } catch (_e) {
            /* ignore */
        }
    }
}

async function purgeCollections(grupos, currentUserId, actor, userId) {
    if (!Array.isArray(grupos) || !grupos.length) {
        throw new Error('Selecciona al menos un grupo a borrar.');
    }
    const allowed = new Set(Object.keys(PURGE_GROUPS));
    const requested = [...new Set(grupos.filter((g) => allowed.has(g)))];
    if (!requested.length) {
        throw new Error('Grupos no validos.');
    }

    const deletedByCollection = {};
    let totalRemoved = 0;

    const addDeleted = (collName, n) => {
        deletedByCollection[collName] =
            (deletedByCollection[collName] || 0) + n;
        totalRemoved += n;
    };

    if (requested.includes('usuarios_otros')) {
        if (!currentUserId) {
            throw new Error('No se pudo identificar el usuario actual.');
        }
        const col = mongoose.model('User').collection;
        const oid = new mongoose.Types.ObjectId(String(currentUserId));
        const r = await col.deleteMany({ _id: { $ne: oid } });
        addDeleted(col.collectionName, r.deletedCount);
    }

    for (const g of requested) {
        if (g === 'usuarios_otros') continue;
        for (const modelName of PURGE_GROUPS[g]) {
            const col = mongoose.model(modelName).collection;
            const r = await col.deleteMany({});
            addDeleted(col.collectionName, r.deletedCount);
        }
    }

    await BackupEvent.create({
        tipo: 'purge',
        estado: 'success',
        actor: actor || 'admin',
        user: userId,
        archivo: '(purge)',
        rutaArchivo: '',
        sha256: '',
        tamanoBytes: 0,
        colecciones: Object.keys(deletedByCollection).length,
        registros: totalRemoved,
        detalle: `PURGA datos: ${requested.join(', ')} — documentos eliminados: ${totalRemoved}`,
        fechaInicio: new Date(),
        fechaFin: new Date()
    });

    return {
        grupos: requested,
        totalRemoved,
        deletedByCollection
    };
}

module.exports = {
    createBackup,
    listBackups,
    restoreBackup,
    restoreFromUploadDiskPath,
    purgeCollections,
    getBackupDownloadPath,
    BACKUP_DIR,
    UPLOADS_DIR,
    PURGE_GROUPS
};
