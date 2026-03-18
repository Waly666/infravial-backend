const mongoose = require('mongoose');

const existSenVertSchema = new mongoose.Schema({
    idJornada:  { type: mongoose.Schema.Types.ObjectId, ref: 'Jornada', required: true },
    idViaTramo: { type: mongoose.Schema.Types.ObjectId, ref: 'ViaTramo', required: true },

    // Geoespacial Point
    ubicacion: {
        type:        { type: String, default: 'Point' },
        coordinates: { type: [Number] }
    },

    codSe:        { type: String },
    estado:       { type: String },
    matPlaca:     { type: String },
    ubicEspacial: { type: String },
    obstruccion:  { type: String },
    fechaInst:    { type: Date },
    forma:        { type: String },
    orientacion:  { type: String },
    reflecOptima: { type: String },
    dimTablero:   { type: String },
    ubicPerVial:  { type: String },
    fase:         { type: String },
    accion:       { type: String },
    ubicLateral:  { type: Number },
    diagUbicLat:  { type: String },
    altura:       { type: Number },
    diagAltura:   { type: String },
    banderas:     { type: String },
    leyendas:     { type: String },

    // Fallas como array
    falla1: { type: String },
    falla2: { type: String },
    falla3: { type: String },
    falla4: { type: String },
    falla5: { type: String },

    // Diagnóstico soporte
    tipoSoporte:   { type: String },
    sistemaSoporte:{ type: String },
    estadoSoporte: { type: String },
    estadoAnclaje: { type: String },

    // Observaciones (ref a ObservacionSV)
    notas: { type: String },
    obs1:  { type: mongoose.Schema.Types.ObjectId, ref: 'ObservacionSV' },
    obs2:  { type: mongoose.Schema.Types.ObjectId, ref: 'ObservacionSV' },
    obs3:  { type: mongoose.Schema.Types.ObjectId, ref: 'ObservacionSV' },
    obs4:  { type: mongoose.Schema.Types.ObjectId, ref: 'ObservacionSV' },
    obs5:  { type: mongoose.Schema.Types.ObjectId, ref: 'ObservacionSV' },
    urlFotoSenVert: { type: String },

    // Auditoría
    creadoPor:         { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fechaCreacion:     { type: Date, default: Date.now },
    modificadoPor:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fechaModificacion: { type: Date },
    logUltimaMod:      { type: String }
});

existSenVertSchema.index({ ubicacion: '2dsphere' });
module.exports = mongoose.model('ExistSenVert', existSenVertSchema);