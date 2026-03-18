const ExistSenVert = require('../models/ExistSenVert');

async function getAll(filtros = {}) {
    return await ExistSenVert.find(filtros)
        .populate('idViaTramo', 'via nomenclatura municipio')
        .populate('obs1', 'observacion')
        .populate('obs2', 'observacion')
        .populate('obs3', 'observacion')
        .populate('obs4', 'observacion')
        .populate('obs5', 'observacion')
        .sort({ fechaCreacion: -1 });
}

async function getById(id) {
    return await ExistSenVert.findById(id)
        .populate('idViaTramo', 'via nomenclatura municipio')
        .populate('obs1', 'observacion')
        .populate('obs2', 'observacion')
        .populate('obs3', 'observacion')
        .populate('obs4', 'observacion')
        .populate('obs5', 'observacion');
}

async function create(data, creadoPor) {
    data.creadoPor     = creadoPor;
    data.fechaCreacion = new Date();
    const reg = new ExistSenVert(data);
    await reg.save();
    return reg;
}

async function update(id, data, modificadoPor) {
    data.modificadoPor     = modificadoPor;
    data.fechaModificacion = new Date();
    data.logUltimaMod      = `Actualizado por ${modificadoPor} el ${new Date().toISOString()}`;
    return await ExistSenVert.findByIdAndUpdate(id, data, { new: true });
}

async function remove(id) {
    return await ExistSenVert.findByIdAndDelete(id);
}

module.exports = { getAll, getById, create, update, remove };