const mongoose = require('mongoose');

// PRS — Puntos de Referencia de Segmento
const D_CALZADA = [
    { v: 1, l: 'Izquierda' }, { v: 2, l: 'Derecha' }, { v: 3, l: 'No aplica' }
];

const sincPrsSchema = new mongoose.Schema({
    idEje:      { type: mongoose.Schema.Types.ObjectId, ref: 'SincEje', required: true },
    codigoVia:  { type: String, required: true },   // CODIGOVIA (denormalizado)

    numPr:      { type: String, maxlength: 40, trim: true }, // NUMPR — código compuesto del PR
    calzada:    { type: Number },                   // CALZADA 1-3
    distVerd:   { type: Number },                   // DISTVERD — distancia verdadera (metros desde inicio)
    fecha:      { type: Date },                     // FECHA de levantamiento

    codMunicipio:    { type: Number },              // COD_MUNICIPIO
    codDepartamento: { type: Number },              // COD_DEPARTAMENTO
    municipio:       { type: String },              // MUNICIPIO
    departamento:    { type: String },              // DEPARTAMENTO

    // Geometría — Point
    ubicacion: {
        type:        { type: String, default: 'Point' },
        coordinates: { type: [Number] }             // [lng, lat]
    },

    obs: { type: String },

    creadoPor:         { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fechaCreacion:     { type: Date, default: Date.now },
    modificadoPor:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fechaModificacion: { type: Date }
});

sincPrsSchema.index({ ubicacion: '2dsphere' });
sincPrsSchema.index({ idEje: 1 });

const SincPrs = mongoose.model('SincPrs', sincPrsSchema);
SincPrs.D_CALZADA = D_CALZADA;
module.exports = SincPrs;
