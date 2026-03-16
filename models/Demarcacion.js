const mongoose = require('mongoose');

const demarcacionSchema = new mongoose.Schema({
    codDem:     { type: String, required: true, unique: true },
    claseDem:   { type: String },
    descripcion:{ type: String },
    urlDemImg:  { type: String }
});

module.exports = mongoose.model('Demarcacion', demarcacionSchema);