const mongoose = require('mongoose');

const cajaInspeccionSchema = new mongoose.Schema({
    idJornada:  { type: mongoose.Schema.Types.ObjectId, ref: 'Jornada', required: true },
    idViaTramo: { type: mongoose.Schema.Types.ObjectId, ref: 'ViaTramo', required: true },
    ubicacion: {
        type: { type: String, default: 'Point' },
        coordinates: { type: [Number] }
    },
    materialCaja:     { type: String, enum: ['Concreto', 'Plastico', 'Otro material'] },
    fase:             { type: String, enum: ['Inventario', 'Programación', 'Diseño', 'Por definir'] },
    accion:           { type: String },
    implementacion:   { type: String, enum: ['Temporal', 'Definitiva'] },
    estadoCaja:       { type: String, enum: ['Bueno', 'Regular', 'Malo'] },
    tapa:             { type: Boolean },
    estadoTapa:       { type: String, enum: ['Bueno', 'Regular', 'Malo', 'No existe tapa'] },
    notas:            { type: String },
    urlFotoCaja:      { type: String },
    creadoPor:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fechaCreacion:    { type: Date, default: Date.now },
    modificadoPor:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fechaModificacion:{ type: Date },
    logUltimaMod:     { type: String }
});

cajaInspeccionSchema.index({ ubicacion: '2dsphere' });
module.exports = mongoose.model('CajaInspeccion', cajaInspeccionSchema);