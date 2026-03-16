const mongoose = require('mongoose');

const barrioSchema = new mongoose.Schema({
    barrioNumero: { type: Number, required: true },
    barrioLetra:  { type: String },
    deptoDivipol: { type: String },
    deptoNombre:  { type: String },
    munDivipol:   { type: String },
    munNombre:    { type: String }
});

module.exports = mongoose.model('Barrio', barrioSchema);