const Semaforo = require('../models/Semaforo');

async function getAll(filtros = {}) {
    return await Semaforo.find(filtros)
        .populate('idJornada', 'municipio fechaJornada')
        .populate('idViaTramo', 'via nomenclatura')
        .populate('obs1').populate('obs2').populate('obs3')
        .populate('obs4').populate('obs5').populate('obs6')
        .sort({ fechaCreacion: -1 });
}

async function getById(id) {
    return await Semaforo.findById(id)
        .populate('idJornada').populate('idViaTramo')
        .populate('idControSem')
        .populate('obs1').populate('obs2').populate('obs3')
        .populate('obs4').populate('obs5').populate('obs6');
}

async function create(data, creadoPor) {
    data.creadoPor     = creadoPor;
    data.fechaCreacion = new Date();
    const reg = new Semaforo(data);
    await reg.save();
    return reg;
}

async function update(id, data, modificadoPor) {
    data.modificadoPor     = modificadoPor;
    data.fechaModificacion = new Date();
    data.logUltimaMod      = JSON.stringify(data);
    return await Semaforo.findByIdAndUpdate(id, data, { new: true });
}

async function remove(id) {
    return await Semaforo.findByIdAndDelete(id);
}

module.exports = { getAll, getById, create, update, remove };