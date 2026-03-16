const mongoose = require('mongoose');

const ubicSenHorSchema = new mongoose.Schema({
    ubicacion:  { type: String, required: true },
    urlImgUbic: { type: String, required: true }
});

module.exports = mongoose.model('UbicSenHor', ubicSenHorSchema);