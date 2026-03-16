const auditService = require('../services/audit.service');

async function getAll(req, res) {
    try {
        const logs = await auditService.getAll(req.query);
        res.json({ message: 'Logs de auditoría INFRAVIAL', logs });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function getByUser(req, res) {
    try {
        const logs = await auditService.getByUser(req.params.userId);
        res.json({ message: 'Logs del usuario INFRAVIAL', logs });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

module.exports = { getAll, getByUser };