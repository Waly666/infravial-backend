const Jornada = require('../models/Jornada');

async function getAll() {
    return await Jornada.find().sort({ fechaJornada: -1 });
}

async function getActiva() {
    return await Jornada.findOne({ estado: 'EN PROCESO' });
}

async function create(data) {
    const activa = await Jornada.findOne({ estado: 'EN PROCESO' });
    if (activa) throw new Error('Ya existe una jornada en proceso INFRAVIAL');

    const jornada = new Jornada({ ...data, estado: 'EN PROCESO', fechaJornada: new Date() });
    await jornada.save();
    return jornada;
}

async function finalizar(id) {
    const jornada = await Jornada.findById(id);
    if (!jornada) throw new Error('Jornada no encontrada INFRAVIAL');
    if (jornada.estado === 'FINALIZADO') throw new Error('La jornada ya está finalizada INFRAVIAL');

    jornada.estado = 'FINALIZADO';
    await jornada.save();
    return jornada;
}

async function update(id, data) {
    return await Jornada.findByIdAndUpdate(id, data, { new: true });
}

module.exports = { getAll, getActiva, create, finalizar, update };