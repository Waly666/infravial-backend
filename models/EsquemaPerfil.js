const mongoose = require('mongoose');

const esquemaPerfilSchema = new mongoose.Schema({
    calzada:    { type: String, required: true, enum: ['Una', 'Dos', 'Tres'] },
    codEsquema: { type: String, required: true, unique: true },
    urlImgEsq:  { type: String, required: true }
});

module.exports = mongoose.model('EsquemaPerfil', esquemaPerfilSchema);