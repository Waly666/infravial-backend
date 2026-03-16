const dashboardService = require('../services/dashboard.service');

async function getStats(req, res) {
    try {
        const stats = await dashboardService.getStats();
        res.json({ message: 'Estadísticas INFRAVIAL', stats });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

module.exports = { getStats };