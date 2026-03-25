const backupService = require('../services/backup.service');

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

module.exports = { createBackup, listBackups, restoreBackup };
