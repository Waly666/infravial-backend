const Semaforo = require('../models/Semaforo');

async function getAll(filtros = {}) {
    return await Semaforo.find(filtros)
        .populate('idViaTramo', 'via nomenclatura municipio')
        .populate('idControSem', 'numExterno tipoControlador')
        .populate('obs1', 'textoObs')
        .populate('obs2', 'textoObs')
        .populate('obs3', 'textoObs')
        .populate('obs4', 'textoObs')
        .populate('obs5', 'textoObs')
        .populate('obs6', 'textoObs')
        .sort({ fechaCreacion: -1 });
}

async function getById(id) {
    return await Semaforo.findById(id)
        .populate('idViaTramo', 'via nomenclatura municipio')
        .populate('idControSem', 'numExterno tipoControlador')
        .populate('obs1', 'textoObs')
        .populate('obs2', 'textoObs')
        .populate('obs3', 'textoObs')
        .populate('obs4', 'textoObs')
        .populate('obs5', 'textoObs')
        .populate('obs6', 'textoObs');
}

async function getByControl(idControSem) {
    return await Semaforo.find({ idControSem })
        .populate('idViaTramo', 'via nomenclatura');
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
    data.logUltimaMod      = `Actualizado por ${modificadoPor} el ${new Date().toISOString()}`;
    return await Semaforo.findByIdAndUpdate(
        id, 
        { $set: data }, 
        { new: true, runValidators: false }
    );
}

async function remove(id) {
    return await Semaforo.findByIdAndDelete(id);
}

async function updateCaras(id, caras) {
    console.log('SERVICE UPDATE CARAS ID:', id);
    console.log('SERVICE CARAS URLs:', caras?.map(c => c.urlFotoCara));
    const result = await Semaforo.findByIdAndUpdate(
        id,
        { $set: { caras: caras } },
        { new: true, runValidators: false }
    );
    console.log('RESULT CARAS:', result?.caras?.map(c => c.urlFotoCara));
    return result;
}

module.exports = { getAll, getById, getByControl, create, update, updateCaras, remove };