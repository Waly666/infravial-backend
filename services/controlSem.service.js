const ControlSemaforo = require('../models/ControlSemaforo');

async function getAll(filtros = {}) {
    return await ControlSemaforo.find(filtros)
        .populate('idViaTramo', 'via nomenclatura municipio')
        .sort({ fechaCreacion: -1 });
}

async function getById(id) {
    return await ControlSemaforo.findById(id)
        .populate('idViaTramo', 'via nomenclatura municipio');
}

async function getByTramo(idViaTramo) {
    return await ControlSemaforo.findOne({ idViaTramo });
}

async function create(data, creadoPor) {
    // Verificar que no exista ya un control para ese tramo
    const existe = await ControlSemaforo.findOne({ idViaTramo: data.idViaTramo });
    if (existe) throw new Error('Ya existe un control semafórico para este tramo');
    data.creadoPor     = creadoPor;
    data.fechaCreacion = new Date();
    const reg = new ControlSemaforo(data);
    await reg.save();
    return reg;
}

async function update(id, data, modificadoPor) {
    data.modificadoPor     = modificadoPor;
    data.fechaModificacion = new Date();
    data.logUltimaMod      = `Actualizado por ${modificadoPor} el ${new Date().toISOString()}`;
    return await ControlSemaforo.findByIdAndUpdate(id, data, { new: true });
}

async function remove(id) {
    return await ControlSemaforo.findByIdAndDelete(id);
}

module.exports = { getAll, getById, getByTramo, create, update, remove };