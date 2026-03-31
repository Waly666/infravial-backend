const fs = require('fs');
const path = require('path');
const multer = require('multer');
const backupService = require('../services/backup.service');

/** Misma base que backup.service (evita /tmp: en VPS a veces se borra o no persiste). */
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(__dirname, '../backups');

const uploadRestore = multer({
    storage: multer.diskStorage({
        destination: (_req, _file, cb) => {
            const dir = path.join(BACKUP_DIR, '.restore-incoming');
            try {
                fs.mkdirSync(dir, { recursive: true });
            } catch (e) {
                return cb(e);
            }
            cb(null, dir);
        },
        filename: (_req, file, cb) => {
            const base = path
                .basename(file.originalname || 'backup')
                .replace(/[^\w.\-]/g, '_');
            cb(null, `restore-${Date.now()}-${base}`);
        }
    }),
    limits: { fileSize: 5 * 1024 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const n = (file.originalname || '').toLowerCase();
        if (n.endsWith('.zip') || n.endsWith('.gz') || n.endsWith('.json.gz')) {
            cb(null, true);
        } else {
            cb(new Error('Solo archivos .zip (completo) o .json.gz (solo base de datos)'));
        }
    }
});

async function createBackup(req, res) {
    try {
        const actor = req.user?.user || req.user?.rol || 'admin';
        const result = await backupService.createBackup(actor, req.user?.id || null);
        res.json({ message: 'Backup generado correctamente', backup: result });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function listBackups(req, res) {
    try {
        const logs = await backupService.listBackups();
        res.json({ message: 'Historial de respaldos', logs });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function restoreBackup(req, res) {
    try {
        const { archivo } = req.body || {};
        if (!archivo) return res.status(400).json({ message: 'archivo es requerido' });
        const actor = req.user?.user || req.user?.rol || 'admin';
        const result = await backupService.restoreBackup(archivo, actor, req.user?.id || null);
        res.json({ message: 'Restore aplicado correctamente', restore: result });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

function downloadBackup(req, res) {
    try {
        const raw = req.params.archivo || '';
        const { filePath, fileName } = backupService.getBackupDownloadPath(raw);
        res.download(path.resolve(filePath), fileName, (err) => {
            if (err && !res.headersSent) {
                res.status(500).json({ message: err.message || 'Error al descargar' });
            }
        });
    } catch (err) {
        res.status(404).json({ message: err.message });
    }
}

async function restoreBackupUpload(req, res) {
    const tmpPath = req.file?.path;
    try {
        if (!tmpPath) {
            return res.status(400).json({ message: 'Adjunta un archivo .zip o .json.gz' });
        }
        if (!fs.existsSync(tmpPath)) {
            return res.status(400).json({
                message:
                    'No se encontró el archivo en el servidor tras la subida. Suele deberse a: límite de tamaño en Nginx (client_max_body_size), timeout de proxy, o disco lleno. Sube de nuevo o copia el ZIP a la carpeta backups del servidor y restaura por nombre (infravial-full-backup-….zip).'
            });
        }
        const actor = req.user?.user || req.user?.rol || 'admin';
        const result = await backupService.restoreFromUploadDiskPath(
            tmpPath,
            req.file.originalname,
            actor,
            req.user?.id || null
        );
        res.json({ message: 'Restore aplicado correctamente', restore: result });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function purgeDatabase(req, res) {
    try {
        const { grupos, confirmacion } = req.body || {};
        if (confirmacion !== 'BORRAR') {
            return res
                .status(400)
                .json({ message: 'Escribe la palabra BORRAR en mayusculas para confirmar.' });
        }
        const actor = req.user?.user || req.user?.rol || 'admin';
        const result = await backupService.purgeCollections(
            grupos,
            req.user?.id,
            actor,
            req.user?.id || null
        );
        res.json({ message: 'Purge aplicado', purge: result });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

module.exports = {
    createBackup,
    listBackups,
    restoreBackup,
    downloadBackup,
    restoreBackupUpload,
    purgeDatabase,
    uploadRestore
};
