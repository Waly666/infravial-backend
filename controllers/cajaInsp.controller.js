const cajaInspService = require('../services/cajaInsp.service');

async function getAll(req, res) {
    try {
        const registros = await cajaInspService.getAll(req.query);
        res.json({ message: 'Cajas de Inspección INFRAVIAL', registros });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function getById(req, res) {
    try {
        const registro = await cajaInspService.getById(req.params.id);
        if (!registro) return res.status(404).json({ message: 'Caja no encontrada INFRAVIAL' });
        res.json({ message: 'Caja de Inspección INFRAVIAL', registro });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function create(req, res) {
    try {
        const registro = await cajaInspService.create(req.body, req.user.id);
        res.status(201).json({ message: 'Caja creada INFRAVIAL', registro });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

async function update(req, res) {
    try {
        const registro = await cajaInspService.update(req.params.id, req.body, req.user.id);
        res.json({ message: 'Caja actualizada INFRAVIAL', registro });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

async function remove(req, res) {
    try {
        await cajaInspService.remove(req.params.id);
        res.json({ message: 'Caja eliminada INFRAVIAL' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

module.exports = { getAll, getById, create, update, remove };