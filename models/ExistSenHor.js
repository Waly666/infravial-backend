const mongoose = require('mongoose');

const existSenHorSchema = new mongoose.Schema({
    idJornada:  { type: mongoose.Schema.Types.ObjectId, ref: 'Jornada', required: true },
    idViaTramo: { type: mongoose.Schema.Types.ObjectId, ref: 'ViaTramo', required: true },
    ubicacion: {
        type: { type: String, default: 'Point' },
        coordinates: { type: [Number] }
    },
    codSeHor:          { type: String, ref: 'Demarcacion' },
    tipoDem:           { type: String, enum: ['Demarcación a nivel', 'Demarcación Elevada'] },
    estadoDem:         { type: String, enum: ['Buena', 'Regular', 'Mala', 'No se encontro señal', 'No Registra'] },
    tipoPintura:       { type: String },
    material:          { type: String, enum: ['Ceramico', 'Caucho', 'Metallico', 'Sintetico', 'Hormigon', 'Pintura', 'Plastico'] },
    fechaInst:         { type: Date },
    fase:              { type: String, enum: ['Inventario', 'Programación', 'Diseño', 'Por definir'] },
    accion:            { type: String },
    fechaAccion:       { type: Date },
    ubicResTramo:      { type: String, ref: 'UbicSenHor' },
    reflectOptima:     { type: String, enum: ['Si', 'No', 'N/A'] },
    retroreflectividad:{ type: String },
    color:             { type: String },
    claseDemLinea:     { type: String },
    claseDemPunto:     { type: String },
    observaciones:     [{ type: String }],
    creadoPor:         { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fechaCreacion:     { type: Date, default: Date.now },
    modificadoPor:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fechaModificacion: { type: Date },
    logUltimaMod:      { type: String }
});

existSenHorSchema.index({ ubicacion: '2dsphere' });
module.exports = mongoose.model('ExistSenHor', existSenHorSchema);