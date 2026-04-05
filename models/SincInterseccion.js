const mongoose = require('mongoose');

// Dominios SINC — Intersecciones (Nivel Detallado)
const D_TIPO = [
    { v: 1, l: 'A nivel simple' }, { v: 2, l: 'A nivel canalizada' },
    { v: 3, l: 'Glorieta' }, { v: 4, l: 'A desnivel' }, { v: 5, l: 'Otro' }
];
const D_ESTADO = [
    { v: 1, l: 'Bueno' }, { v: 2, l: 'Regular' }, { v: 3, l: 'Malo' }
];

const sincInterseccionSchema = new mongoose.Schema({
    idEje:      { type: mongoose.Schema.Types.ObjectId, ref: 'SincEje', required: true },
    codigoVia:  { type: String, required: true },

    numPr:      { type: Number },   // NUMPR — PRS de referencia
    nombre:     { type: String },   // Nombre del cruce o intersección
    tipo:       { type: Number },   // TIPO 1-5
    estado:     { type: Number },   // ESTADO 1-3
    numRamales: { type: Number },   // Número de ramales

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

sincInterseccionSchema.index({ ubicacion: '2dsphere' });
sincInterseccionSchema.index({ idEje: 1 });

const SincInterseccion = mongoose.model('SincInterseccion', sincInterseccionSchema);
SincInterseccion.D_TIPO   = D_TIPO;
SincInterseccion.D_ESTADO = D_ESTADO;
module.exports = SincInterseccion;
