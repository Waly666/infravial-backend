const userService = require('../services/user.service');

async function getAll(req, res) {
    try {
        const users = await userService.getAll();
        res.json({ message: 'Usuarios INFRAVIAL', users });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function getById(req, res) {
    try {
        const user = await userService.getById(req.params.id);
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado INFRAVIAL' });
        res.json({ message: 'Usuario INFRAVIAL', user });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function create(req, res) {
    try {
        const user = await userService.create(req.body, req.user.id);
        res.status(201).json({ message: 'Usuario creado INFRAVIAL', user });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

async function update(req, res) {
    try {
        const user = await userService.update(req.params.id, req.body, req.user.id);
        res.json({ message: 'Usuario actualizado INFRAVIAL', user });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

async function remove(req, res) {
    try {
        await userService.remove(req.params.id);
        res.json({ message: 'Usuario eliminado INFRAVIAL' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

module.exports = { getAll, getById, create, update, remove };