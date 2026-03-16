const mongoose = require('mongoose');

const jornadaSchema = new mongoose.Schema({
    contratante:      { type: String },
    entidadResVia:    { type: String },
    fechaJornada:     { type: Date, default: Date.now },
    codDepto:         { type: String },
    dpto:             { type: String },
    codMunicipio:     { type: String },
    municipio:        { type: String },
    horaInicio:       { type: Date, default: Date.now },
    supervisor:       { type: String },
    estado:           { type: String, required: true, enum: ['EN PROCESO', 'FINALIZADO'], default: 'EN PROCESO' },
    localidad:        { type: String },
    tipoLocalidad:    { type: String, enum: ['Cabecera Municipal', 'Corregimiento', 'Inspección', 'Centro Poblado'] }
});

module.exports = mongoose.model('Jornada', jornadaSchema);