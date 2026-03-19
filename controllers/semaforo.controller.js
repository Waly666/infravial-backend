const semaforoService = require('../services/semaforo.service');

async function getAll(req, res) {
    try {
        const registros = await semaforoService.getAll(req.query);
        res.json({ message: 'Semáforos INFRAVIAL', registros });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function getById(req, res) {
    try {
        const registro = await semaforoService.getById(req.params.id);
        if (!registro) return res.status(404).json({ message: 'Semáforo no encontrado INFRAVIAL' });
        res.json({ message: 'Semáforo INFRAVIAL', registro });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function create(req, res) {
    try {
        const registro = await semaforoService.create(req.body, req.user.id);
        res.status(201).json({ message: 'Semáforo creado INFRAVIAL', registro });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

async function update(req, res) {
    try {
        console.log('UPDATE ID:', req.params.id);
        console.log('UPDATE BODY KEYS:', Object.keys(req.body));
        console.log('UPDATE CARAS:', JSON.stringify(req.body.caras?.map(c => c.urlFotoCara)));
        const registro = await semaforoService.update(req.params.id, req.body, req.user.id);
        if (!registro) return res.status(404).json({ message: 'Semáforo no encontrado INFRAVIAL' });
        res.json({ message: 'Semáforo actualizado INFRAVIAL', registro });
    } catch (err) {
        console.error('ERROR UPDATE SEMAFORO:', err.message);
        res.status(500).json({ message: err.message });
    }
}

async function remove(req, res) {
    try {
        await semaforoService.remove(req.params.id);
        res.json({ message: 'Semáforo eliminado INFRAVIAL' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function updateCaras(req, res) {
    try {
        console.log('UPDATING CARAS:', req.body.caras?.map(c => c.urlFotoCara));
        const registro = await semaforoService.updateCaras(req.params.id, req.body.caras);
        res.json({ message: 'Caras actualizadas INFRAVIAL', registro });
    } catch (err) {
        console.error('ERROR CARAS:', err.message);
        res.status(500).json({ message: err.message });
    }
}

module.exports = { getAll, getById, create, update, updateCaras, remove };