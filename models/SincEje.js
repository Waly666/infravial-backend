const mongoose = require('mongoose');

// Dominios SINC — Ejes (valores enteros según tabla de dominio del documento)
const D_TIPORED  = [
    { v: 1, l: 'Primaria' }, { v: 2, l: 'Secundaria' },
    { v: 3, l: 'Terciaria' }, { v: 4, l: 'Urbana' }
];
const D_TIPOEJE  = [
    { v: 1, l: 'Calzada sencilla' }, { v: 2, l: 'Calzada doble' },
    { v: 3, l: 'Glorieta' }, { v: 4, l: 'Ramal único' }, { v: 5, l: 'Ramal doble' }
];
const D_SENTIDO  = [
    { v: 1, l: 'A-B' }, { v: 2, l: 'B-A' }, { v: 3, l: 'Doble sentido' }, { v: 4, l: 'No aplica' }
];
const D_CATEGORIA = [
    { v: 1, l: 'Primera' }, { v: 2, l: 'Segunda' },
    { v: 3, l: 'Tercera' }, { v: 4, l: 'No aplica' }
];

const sincEjeSchema = new mongoose.Schema({
    idJornada:        { type: mongoose.Schema.Types.ObjectId, ref: 'Jornada', required: true },

    // Identificación — SINC
    codigoVia:        { type: String, required: true },   // CODIGOVIA (Res.339/1999)
    codigoVia1:       { type: String },                   // CODIGOVIA1 (código alterno)
    nomVia:           { type: String },                   // NOMVIA

    // Atributos con dominio entero
    tipoRed:          { type: Number },   // TIPORED  1-4
    tipoEje:          { type: Number },   // TIPOEJE  1-5
    sentido:          { type: Number },   // SENTIDO  1-4
    categoria:        { type: Number },   // CATEGORÍA 1-4

    // Concesión
    concesion:        { type: Boolean, default: false },
    codigoConcesion:  { type: String },                   // CODIGOCONCESION

    // Administrativo (derivado de Jornada pero denormalizado para Shapefile)
    codMunicipio:     { type: Number },                   // COD_MUNICIPIO
    codDepartamento:  { type: Number },                   // COD_DEPARTAMENTO
    municipio:        { type: String },                   // MUNICIPIO
    departamento:     { type: String },                   // DEPARTAMTO

    // Geometría — LineString MAGNA-SIRGAS ≈ WGS84 (EPSG:4686)
    ubicacion: {
        type:        { type: String, default: 'LineString' },
        coordinates: { type: [[Number]] }                 // [[lng,lat],...]
    },

    // Nivel de inventario SINC
    nivelInventario:  { type: String, enum: ['basico', 'detallado'], default: 'basico' },

    longitud_m:       { type: Number },                   // longitud calculada del shape
    fotos:            [{ type: String }],
    obs:              { type: String },                   // OBS

    // Auditoría
    creadoPor:         { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fechaCreacion:     { type: Date, default: Date.now },
    modificadoPor:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fechaModificacion: { type: Date }
});

sincEjeSchema.index({ ubicacion: '2dsphere' });
sincEjeSchema.index({ codigoVia: 1 });
sincEjeSchema.index({ idJornada: 1 });

const SincEje = mongoose.model('SincEje', sincEjeSchema);
SincEje.D_TIPORED   = D_TIPORED;
SincEje.D_TIPOEJE   = D_TIPOEJE;
SincEje.D_SENTIDO   = D_SENTIDO;
SincEje.D_CATEGORIA = D_CATEGORIA;
module.exports = SincEje;
