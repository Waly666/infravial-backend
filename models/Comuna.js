const mongoose = require('mongoose');

const comunaSchema = new mongoose.Schema({
    comunaNumero: { type: Number, required: true },
    comunaLetra:  { type: String },
    deptoDivipol: { type: String },
    deptoNombre:  { type: String },
    munDivipol:   { type: String },
    munNombre:    { type: String }
});

module.exports = mongoose.model('Comuna', comunaSchema);