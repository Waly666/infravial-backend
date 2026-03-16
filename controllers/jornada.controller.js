const jornadaService = require('../services/jornada.service');

async function getAll(req, res) {
    try {
        const jornadas = await jornadaService.getAll();
        res.json({ message: 'Jornadas INFRAVIAL', jornadas });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function getActiva(req, res) {
    try {
        const jornada = await jornadaService.getActiva();
        if (!jornada) return res.status(404).json({ message: 'No hay jornada activa INFRAVIAL' });
        res.json({ message: 'Jornada activa INFRAVIAL', jornada });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function create(req, res) {
    try {
        const jornada = await jornadaService.create(req.body);
        res.status(201).json({ message: 'Jornada creada INFRAVIAL', jornada });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

async function finalizar(req, res) {
    try {
        const jornada = await jornadaService.finalizar(req.params.id);
        res.json({ message: 'Jornada finalizada INFRAVIAL', jornada });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

async function update(req, res) {
    try {
        const jornada = await jornadaService.update(req.params.id, req.body);
        res.json({ message: 'Jornada actualizada INFRAVIAL', jornada });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

module.exports = { getAll, getActiva, create, finalizar, update };