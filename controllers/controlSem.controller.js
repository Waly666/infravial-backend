const controlSemService = require('../services/controlSem.service');

async function getAll(req, res) {
    try {
        const registros = await controlSemService.getAll(req.query);
        res.json({ message: 'Controladores Semafóricos INFRAVIAL', registros });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function getById(req, res) {
    try {
        const registro = await controlSemService.getById(req.params.id);
        if (!registro) return res.status(404).json({ message: 'Controlador no encontrado INFRAVIAL' });
        res.json({ message: 'Controlador Semafórico INFRAVIAL', registro });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function create(req, res) {
    try {
        const registro = await controlSemService.create(req.body, req.user.id);
        res.status(201).json({ message: 'Controlador creado INFRAVIAL', registro });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

async function update(req, res) {
    try {
        const registro = await controlSemService.update(req.params.id, req.body, req.user.id);
        res.json({ message: 'Controlador actualizado INFRAVIAL', registro });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

async function remove(req, res) {
    try {
        await controlSemService.remove(req.params.id);
        res.json({ message: 'Controlador eliminado INFRAVIAL' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

module.exports = { getAll, getById, create, update, remove };