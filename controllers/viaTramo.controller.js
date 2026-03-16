const viaTramoService = require('../services/viaTramo.service');

async function getAll(req, res) {
    try {
        const tramos = await viaTramoService.getAll(req.query);
        res.json({ message: 'Via Tramos INFRAVIAL', tramos });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function getById(req, res) {
    try {
        const tramo = await viaTramoService.getById(req.params.id);
        if (!tramo) return res.status(404).json({ message: 'Tramo no encontrado INFRAVIAL' });
        res.json({ message: 'Via Tramo INFRAVIAL', tramo });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function create(req, res) {
    try {
        const tramo = await viaTramoService.create(req.body, req.user.id);
        res.status(201).json({ message: 'Tramo creado INFRAVIAL', tramo });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

async function update(req, res) {
    try {
        const tramo = await viaTramoService.update(req.params.id, req.body, req.user.id);
        res.json({ message: 'Tramo actualizado INFRAVIAL', tramo });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

async function remove(req, res) {
    try {
        await viaTramoService.remove(req.params.id);
        res.json({ message: 'Tramo eliminado INFRAVIAL' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

module.exports = { getAll, getById, create, update, remove };