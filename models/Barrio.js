const mongoose = require('mongoose');

const barrioSchema = new mongoose.Schema({
    nombre:       { type: String, required: true },
    deptoDivipol: { type: String },
    deptoNombre:  { type: String },
    munDivipol:   { type: String },
    munNombre:    { type: String }
});

module.exports = mongoose.model('Barrio', barrioSchema);