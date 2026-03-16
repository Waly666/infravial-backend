const ExistSenVert = require('../models/ExistSenVert');

async function getAll(filtros = {}) {
    return await ExistSenVert.find(filtros)
        .populate('idJornada', 'municipio fechaJornada')
        .populate('idViaTramo', 'via nomenclatura')
        .populate('obs1').populate('obs2').populate('obs3')
        .populate('obs4').populate('obs5')
        .sort({ fechaCreacion: -1 });
}

async function getById(id) {
    return await ExistSenVert.findById(id)
        .populate('idJornada').populate('idViaTramo')
        .populate('obs1').populate('obs2').populate('obs3')
        .populate('obs4').populate('obs5');
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
    data.logUltimaMod      = JSON.stringify(data);
    return await ExistSenVert.findByIdAndUpdate(id, data, { new: true });
}

async function remove(id) {
    return await ExistSenVert.findByIdAndDelete(id);
}

module.exports = { getAll, getById, create, update, remove };