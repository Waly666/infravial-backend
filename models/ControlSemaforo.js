const mongoose = require('mongoose');

const controlSemaforoSchema = new mongoose.Schema({
    idJornada:  { type: mongoose.Schema.Types.ObjectId, ref: 'Jornada', required: true },
    idViaTramo: { type: mongoose.Schema.Types.ObjectId, ref: 'ViaTramo', required: true },
    numExterno: { type: Number },
    ubicacion: {
        type: { type: String, default: 'Point' },
        coordinates: { type: [Number] }
    },
    fase:              { type: String, enum: ['Inventario', 'Programación', 'Diseño', 'Por definir'] },
    accion:            { type: String },
    implementacion:    { type: String, enum: ['Temporal', 'Definitiva'] },
    tipoControlador:   { type: String, enum: ['Mecanismo Electronico', 'Mecanismo Electromecanico'] },
    claseControlador:  { type: String },
    serialControlador: { type: String },
    modelo:            { type: String },
    fabricante:        { type: String },
    estadoControlador: { type: String, enum: ['Bueno', 'Regular', 'Malo'] },
    falla:             { type: String },
    ups:               { type: Boolean },
    tipoBateria:       { type: String, enum: ['Plomo Ácido', 'Níquel Cadmio', 'Litio'] },
    estadoUps:         { type: String, enum: ['Bueno', 'Regular', 'Malo'] },
    enlazadoCentralSem:{ type: Boolean },
    materialArmario:   { type: String, enum: ['Concreto', 'Metalico', 'Marco concreto-Gabinete metalico'] },
    estadoArmario:     { type: String, enum: ['Bueno', 'Regular', 'Malo'] },
    cerradura:         { type: String },
    estadoCerradura:   { type: String, enum: ['Bueno', 'Regular', 'Malo'] },
    estadoPintura:     { type: String, enum: ['Bueno', 'Regular', 'Malo'] },
    notas:             { type: String },
    urlFotoControlador:{ type: String },
    urlFotoArmario:    { type: String },
    creadoPor:         { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fechaCreacion:     { type: Date, default: Date.now },
    modificadoPor:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fechaModificacion: { type: Date },
    logUltimaMod:      { type: String }
});

controlSemaforoSchema.index({ ubicacion: '2dsphere' });
module.exports = mongoose.model('ControlSemaforo', controlSemaforoSchema);