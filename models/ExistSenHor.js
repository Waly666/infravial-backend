const mongoose = require('mongoose');

const existSenHorSchema = new mongoose.Schema({
    idJornada:  { type: mongoose.Schema.Types.ObjectId, ref: 'Jornada', required: true },
    idViaTramo: { type: mongoose.Schema.Types.ObjectId, ref: 'ViaTramo', required: true },

    ubicacion: {
        type: { type: String, default: 'Point' },
        coordinates: { type: [Number] }
    },

    codSeHor:          { type: String },
    tipoDem:           { type: String },
    estadoDem:         { type: String },
    tipoPintura:       { type: String },
    material:          { type: String },
    fechaInst:         { type: Date },
    fase:              { type: String },
    accion:            { type: String },
    fechaAccion:       { type: Date },
    ubicResTramo:      { type: String },
    reflectOptima:     { type: String },
    retroreflectividad:{ type: String },
    color:             { type: String },
    claseDemLinea:     { type: String },
    claseDemPunto:     { type: String },

    obs1: { type: mongoose.Schema.Types.ObjectId, ref: 'ObservacionSH' },
    obs2: { type: mongoose.Schema.Types.ObjectId, ref: 'ObservacionSH' },
    obs3: { type: mongoose.Schema.Types.ObjectId, ref: 'ObservacionSH' },
    obs4: { type: mongoose.Schema.Types.ObjectId, ref: 'ObservacionSH' },
    obs5: { type: mongoose.Schema.Types.ObjectId, ref: 'ObservacionSH' },
    obs6: { type: mongoose.Schema.Types.ObjectId, ref: 'ObservacionSH' },
    notas: { type: String },

    urlFotoSH: { type: String },

    creadoPor:         { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fechaCreacion:     { type: Date, default: Date.now },
    modificadoPor:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fechaModificacion: { type: Date },
    logUltimaMod:      { type: String }
});

existSenHorSchema.index({ ubicacion: '2dsphere' });
module.exports = mongoose.model('ExistSenHor', existSenHorSchema);