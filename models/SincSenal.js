const mongoose = require('mongoose');

// Dominios SINC — Señales Verticales (Nivel Detallado)
const D_TIPO = [
    { v: 1, l: 'Reglamentaria' }, { v: 2, l: 'Preventiva' },
    { v: 3, l: 'Informativa' }, { v: 4, l: 'Transitoria' }
];
const D_ESTADO = [
    { v: 1, l: 'Bueno' }, { v: 2, l: 'Regular' }, { v: 3, l: 'Malo' }
];
const D_LADO = [
    { v: 1, l: 'Izquierdo (sentido A-B)' }, { v: 2, l: 'Derecho (sentido A-B)' }, { v: 3, l: 'Ambos lados' }
];

const sincSenalSchema = new mongoose.Schema({
    idEje:      { type: mongoose.Schema.Types.ObjectId, ref: 'SincEje', required: true },
    codigoVia:  { type: String, required: true },

    numPr:      { type: Number },   // NUMPR — PRS de referencia
    codigo:     { type: String },   // Código de la señal (Manual de Señalización)
    tipo:       { type: Number },   // TIPO 1-4
    estado:     { type: Number },   // ESTADO 1-3
    lado:       { type: Number },   // LADO 1-3

    fecha:      { type: Date },
    foto:       { type: String },
    rutaFoto:   { type: String },

    codMunicipio:    { type: Number },
    codDepartamento: { type: Number },
    municipio:       { type: String },
    departamento:    { type: String },

    // Geometría — Point
    ubicacion: {
        type:        { type: String, default: 'Point' },
        coordinates: { type: [Number] }   // [lng, lat]
    },

    fotos: [{ type: String }],
    obs:   { type: String },

    creadoPor:         { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fechaCreacion:     { type: Date, default: Date.now },
    modificadoPor:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fechaModificacion: { type: Date }
});

sincSenalSchema.index({ ubicacion: '2dsphere' });
sincSenalSchema.index({ idEje: 1 });

const SincSenal = mongoose.model('SincSenal', sincSenalSchema);
SincSenal.D_TIPO   = D_TIPO;
SincSenal.D_ESTADO = D_ESTADO;
SincSenal.D_LADO   = D_LADO;
module.exports = SincSenal;
