const ExistSenHor = require('../models/ExistSenHor');

async function getAll(filtros = {}) {
    return await ExistSenHor.find(filtros)
        .populate({
            path: 'idViaTramo',
            select: 'via nomenclatura municipio departamento zat tipoUbic',
            populate: { path: 'zat', select: 'zatNumero zatLetra' }
        })
        .populate('obs1', 'obsSH')
        .populate('obs2', 'obsSH')
        .populate('obs3', 'obsSH')
        .populate('obs4', 'obsSH')
        .populate('obs5', 'obsSH')
        .populate('obs6', 'obsSH')
        .sort({ fechaCreacion: -1 });
}

async function getById(id) {
    return await ExistSenHor.findById(id)
        .populate({
            path: 'idViaTramo',
            select: 'via nomenclatura municipio departamento zat tipoUbic',
            populate: { path: 'zat', select: 'zatNumero zatLetra' }
        })
        .populate('obs1', 'obsSH')
        .populate('obs2', 'obsSH')
        .populate('obs3', 'obsSH')
        .populate('obs4', 'obsSH')
        .populate('obs5', 'obsSH')
        .populate('obs6', 'obsSH');
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
    data.logUltimaMod      = `Actualizado por ${modificadoPor} el ${new Date().toISOString()}`;
    return await ExistSenHor.findByIdAndUpdate(id, data, { new: true });
}

async function remove(id) {
    return await ExistSenHor.findByIdAndDelete(id);
}

module.exports = { getAll, getById, create, update, remove };