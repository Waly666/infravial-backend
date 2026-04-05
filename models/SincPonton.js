const mongoose = require('mongoose');

// Dominios SINC — Pontones (Nivel Detallado)
// Cruces de menor longitud que no clasifican como puentes (< 6 m generalmente)
const D_MATERIAL = [
    { v: 1, l: 'Concreto' }, { v: 2, l: 'Madera' },
    { v: 3, l: 'Metálico' }, { v: 4, l: 'Mixto' }, { v: 5, l: 'Otro' }
];
const D_ESTADO = [
    { v: 1, l: 'Bueno' }, { v: 2, l: 'Regular' },
    { v: 3, l: 'Malo' }, { v: 4, l: 'No funcional' }
];

const sincPontonSchema = new mongoose.Schema({
    idEje:      { type: mongoose.Schema.Types.ObjectId, ref: 'SincEje', required: true },
    codigoVia:  { type: String, required: true },

    numPr:      { type: Number },   // NUMPR — PRS de referencia
    distIni:    { type: Number },   // DISTINI — metros desde el PRS al inicio del pontón
    nombre:     { type: String },   // NOMBRE

    longitud:   { type: Number },   // LONGITUD (metros)
    ancho:      { type: Number },   // ANCHO — ancho del tablero (metros)

    material:   { type: Number },   // MATERIAL 1-5
    estado:     { type: Number },   // ESTADO 1-4

    fecha:      { type: Date },
    foto:       { type: String },
    rutaFoto:   { type: String },

    codMunicipio:    { type: Number },
    codDepartamento: { type: Number },
    municipio:       { type: String },
    departamento:    { type: String },

    // Geometría — Point (inicio del pontón en sentido del abscisado)
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

sincPontonSchema.index({ ubicacion: '2dsphere' });
sincPontonSchema.index({ idEje: 1 });

const SincPonton = mongoose.model('SincPonton', sincPontonSchema);
SincPonton.D_MATERIAL = D_MATERIAL;
SincPonton.D_ESTADO   = D_ESTADO;
module.exports = SincPonton;
