const ControlSemaforo = require('../models/ControlSemaforo');

async function getAll(filtros = {}) {
    return await ControlSemaforo.find(filtros)
        .populate('idJornada', 'municipio fechaJornada')
        .populate('idViaTramo', 'via nomenclatura')
        .sort({ fechaCreacion: -1 });
}

async function getById(id) {
    return await ControlSemaforo.findById(id)
        .populate('idJornada').populate('idViaTramo');
}

async function create(data, creadoPor) {
    data.creadoPor     = creadoPor;
    data.fechaCreacion = new Date();
    const reg = new ControlSemaforo(data);
    await reg.save();
    return reg;
}

async function update(id, data, modificadoPor) {
    data.modificadoPor     = modificadoPor;
    data.fechaModificacion = new Date();
    data.logUltimaMod      = JSON.stringify(data);
    return await ControlSemaforo.findByIdAndUpdate(id, data, { new: true });
}

async function remove(id) {
    return await ControlSemaforo.findByIdAndDelete(id);
}

module.exports = { getAll, getById, create, update, remove };