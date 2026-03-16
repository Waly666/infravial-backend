const CajaInspeccion = require('../models/CajaInspeccion');

async function getAll(filtros = {}) {
    return await CajaInspeccion.find(filtros)
        .populate('idJornada', 'municipio fechaJornada')
        .populate('idViaTramo', 'via nomenclatura')
        .sort({ fechaCreacion: -1 });
}

async function getById(id) {
    return await CajaInspeccion.findById(id)
        .populate('idJornada').populate('idViaTramo');
}

async function create(data, creadoPor) {
    data.creadoPor     = creadoPor;
    data.fechaCreacion = new Date();
    const reg = new CajaInspeccion(data);
    await reg.save();
    return reg;
}

async function update(id, data, modificadoPor) {
    data.modificadoPor     = modificadoPor;
    data.fechaModificacion = new Date();
    data.logUltimaMod      = JSON.stringify(data);
    return await CajaInspeccion.findByIdAndUpdate(id, data, { new: true });
}

async function remove(id) {
    return await CajaInspeccion.findByIdAndDelete(id);
}

module.exports = { getAll, getById, create, update, remove };