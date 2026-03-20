const Audit = require('../models/Audit');

async function getAll(filtros = {}) {
    return await Audit.find(filtros)
        .populate('user', 'nombres apellidos user')
        .sort({ fecha: -1 })
        .limit(500);
}

async function getByUser(userId) {
    return await Audit.find({ user: userId })
        .populate('user', 'nombres apellidos user')
        .sort({ fecha: -1 })
        .limit(100);
}

module.exports = { getAll, getByUser };