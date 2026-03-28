const CajaInspeccion = require('../models/CajaInspeccion');

async function getAll(filtros = {}) {
    return await CajaInspeccion.find(filtros)
        .populate({
            path: 'idViaTramo',
            select: 'via nomenclatura municipio departamento zat',
            populate: { path: 'zat', select: 'zatNumero zatLetra' }
        })
        .sort({ fechaCreacion: -1 });
}

async function getById(id) {
    return await CajaInspeccion.findById(id)
        .populate({
            path: 'idViaTramo',
            select: 'via nomenclatura municipio departamento zat',
            populate: { path: 'zat', select: 'zatNumero zatLetra' }
        });
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
    data.logUltimaMod      = `Actualizado por ${modificadoPor} el ${new Date().toISOString()}`;
    return await CajaInspeccion.findByIdAndUpdate(id, data, { new: true });
}

async function remove(id) {
    return await CajaInspeccion.findByIdAndDelete(id);
}

module.exports = { getAll, getById, create, update, remove };