const senVertService = require('../services/senVert.service');

async function getAll(req, res) {
    try {
        const registros = await senVertService.getAll(req.query);
        res.json({ message: 'Señales Verticales INFRAVIAL', registros });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function getById(req, res) {
    try {
        const registro = await senVertService.getById(req.params.id);
        if (!registro) return res.status(404).json({ message: 'Registro no encontrado INFRAVIAL' });
        res.json({ message: 'Señal Vertical INFRAVIAL', registro });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function create(req, res) {
    try {
        const registro = await senVertService.create(req.body, req.user.id);
        res.status(201).json({ message: 'Señal Vertical creada INFRAVIAL', registro });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

async function update(req, res) {
    try {
        const registro = await senVertService.update(req.params.id, req.body, req.user.id);
        res.json({ message: 'Señal Vertical actualizada INFRAVIAL', registro });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

async function remove(req, res) {
    try {
        await senVertService.remove(req.params.id);
        res.json({ message: 'Señal Vertical eliminada INFRAVIAL' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

module.exports = { getAll, getById, create, update, remove };