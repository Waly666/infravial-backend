const senHorService = require('../services/senHor.service');
const existSenHorEstadisticas = require('../services/existSenHor.estadisticas.service');

async function getEstadisticas(req, res) {
    try {
        const data = await existSenHorEstadisticas.getEstadisticas(req.query);
        res.json({ message: 'Estadísticas señales horizontales', ...data });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function getAll(req, res) {
    try {
        const registros = await senHorService.getAll(req.query);
        res.json({ message: 'Señales Horizontales INFRAVIAL', registros });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function getById(req, res) {
    try {
        const registro = await senHorService.getById(req.params.id);
        if (!registro) return res.status(404).json({ message: 'Registro no encontrado INFRAVIAL' });
        res.json({ message: 'Señal Horizontal INFRAVIAL', registro });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function create(req, res) {
    try {
        const registro = await senHorService.create(req.body, req.user.id);
        res.status(201).json({ message: 'Señal Horizontal creada INFRAVIAL', registro });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

async function update(req, res) {
    try {
        const registro = await senHorService.update(req.params.id, req.body, req.user.id);
        res.json({ message: 'Señal Horizontal actualizada INFRAVIAL', registro });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

async function remove(req, res) {
    try {
        await senHorService.remove(req.params.id);
        res.json({ message: 'Señal Horizontal eliminada INFRAVIAL' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

module.exports = { getEstadisticas, getAll, getById, create, update, remove };