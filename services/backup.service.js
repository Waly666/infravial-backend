const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const mongoose = require('mongoose');
const { EJSON } = require('bson');
const BackupEvent = require('../models/BackupEvent');

const BACKUP_DIR = process.env.BACKUP_DIR || path.join(__dirname, '../backups');

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

async function createBackup(actor = 'system', userId = null) {
    ensureBackupDir();
    const fechaInicio = new Date();
    const conn = mongoose.connection.db;
    const collectionsMeta = await conn.listCollections().toArray();
    const collections = collectionsMeta
        .map(c => c.name)
        .filter(n => !n.startsWith('system.'));

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
    const hash = sha256Buffer(gz);
    const fileName = `infravial-backup-${nowStamp()}.json.gz`;
    const filePath = path.join(BACKUP_DIR, fileName);
    fs.writeFileSync(filePath, gz);

    const event = await BackupEvent.create({
        tipo: 'backup',
        estado: 'success',
        actor,
        user: userId,
        archivo: fileName,
        rutaArchivo: filePath,
        sha256: hash,
        tamanoBytes: gz.length,
        colecciones: collections.length,
        registros: totalRegistros,
        detalle: `Backup completo de ${conn.databaseName}`,
        fechaInicio,
        fechaFin: new Date()
    });

    return {
        eventId: event._id,
        archivo: fileName,
        sha256: hash,
        tamanoBytes: gz.length,
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
    const fechaInicio = new Date();
    const filePath = path.join(BACKUP_DIR, fileName);
    if (!fs.existsSync(filePath)) {
        throw new Error('El archivo de backup no existe.');
    }

    const zipped = fs.readFileSync(filePath);
    const hash = sha256Buffer(zipped);
    const raw = zlib.gunzipSync(zipped).toString('utf8');
    const data = EJSON.parse(raw, { relaxed: false });

    if (!data?.collections || typeof data.collections !== 'object') {
        throw new Error('Formato de backup invalido.');
    }

    const conn = mongoose.connection.db;
    const collectionNames = Object.keys(data.collections).filter(n => !n.startsWith('system.'));

    let totalRegistros = 0;
    for (const collName of collectionNames) {
        const docs = Array.isArray(data.collections[collName]) ? data.collections[collName] : [];
        await conn.collection(collName).deleteMany({});
        if (docs.length) await conn.collection(collName).insertMany(docs);
        totalRegistros += docs.length;
    }

    const event = await BackupEvent.create({
        tipo: 'restore',
        estado: 'success',
        actor,
        user: userId,
        archivo: fileName,
        rutaArchivo: filePath,
        sha256: hash,
        tamanoBytes: zipped.length,
        colecciones: collectionNames.length,
        registros: totalRegistros,
        detalle: `Restore aplicado sobre ${collectionNames.length} colecciones`,
        fechaInicio,
        fechaFin: new Date()
    });

    return {
        eventId: event._id,
        archivo: fileName,
        sha256: hash,
        tamanoBytes: zipped.length,
        colecciones: collectionNames.length,
        registros: totalRegistros,
        fecha: event.fechaFin
    };
}

module.exports = { createBackup, listBackups, restoreBackup, BACKUP_DIR };
