const ExistSenHor = require('../models/ExistSenHor');

async function getAll(filtros = {}) {
    return await ExistSenHor.find(filtros)
        .populate('idJornada', 'municipio fechaJornada')
        .populate('idViaTramo', 'via nomenclatura')
        .populate('ubicResTramo')
        .populate('obs1').populate('obs2').populate('obs3')
        .populate('obs4').populate('obs5').populate('obs6')
        .sort({ fechaCreacion: -1 });
}

async function getById(id) {
    return await ExistSenHor.findById(id)
        .populate('idJornada').populate('idViaTramo')
        .populate('ubicResTramo')
        .populate('obs1').populate('obs2').populate('obs3')
        .populate('obs4').populate('obs5').populate('obs6');
}

async function create(data, creadoPor) {
    data.creadoPor     = creadoPor;
    data.fechaCreacion = new Date();
    const reg = new ExistSenHor(data);
    await reg.save();
    return reg;
}

async function update(id, data, modificadoPor) {
    data.modificadoPor     = modificadoPor;
    data.fechaModificacion = new Date();
    data.logUltimaMod      = JSON.stringify(data);
    return await ExistSenHor.findByIdAndUpdate(id, data, { new: true });
}

async function remove(id) {
    return await ExistSenHor.findByIdAndDelete(id);
}

module.exports = { getAll, getById, create, update, remove };