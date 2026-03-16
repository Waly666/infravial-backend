const mongoose = require('mongoose');

const senVertSchema = new mongoose.Schema({
    codSenVert:    { type: String, required: true, unique: true },
    descSenVert:   { type: String, required: true },
    clasificacion: { type: String },
    funcion:       { type: String },
    color:         { type: String },
    descripcion:   { type: String },
    forma:         { type: String },
    urlImgSenVert: { type: String }
});

module.exports = mongoose.model('SenVert', senVertSchema);