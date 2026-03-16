const bcrypt = require('bcrypt');
const User   = require('../models/User');

async function getAll() {
    return await User.find().select('-password');
}

async function getById(id) {
    return await User.findById(id).select('-password');
}

async function create(data, creadoPor) {
    const existe = await User.findOne({ user: data.user });
    if (existe) throw new Error('Ya existe un usuario con esa cédula INFRAVIAL');

    const password = await bcrypt.hash(data.password, 10);
    const usuario  = new User({
        ...data,
        password,
        creadoPor,
        fechaCreacion: new Date()
    });
    await usuario.save();
    return usuario;
}

async function update(id, data, modificadoPor) {
    if (data.password) {
        data.password = await bcrypt.hash(data.password, 10);
    }
    data.modificadoPor     = modificadoPor;
    data.fechaModificacion = new Date();
    data.logUltimaMod      = JSON.stringify(data);

    return await User.findByIdAndUpdate(id, data, { new: true }).select('-password');
}

async function remove(id) {
    return await User.findByIdAndDelete(id);
}

module.exports = { getAll, getById, create, update, remove };