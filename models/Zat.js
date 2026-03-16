const mongoose = require('mongoose');

const zatSchema = new mongoose.Schema({
    zatNumero:   { type: Number, required: true },
    zatLetra:    { type: String },
    deptoDivipol:{ type: String },
    deptoNombre: { type: String },
    munDivipol:  { type: String },
    munNombre:   { type: String }
});

module.exports = mongoose.model('Zat', zatSchema);