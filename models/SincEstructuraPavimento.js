const mongoose = require('mongoose');

// Dominios SINC — Estructura de Pavimento (Nivel Detallado)
const D_TIPOCAPA = [
    { v: 1, l: 'Capa de rodadura' }, { v: 2, l: 'Capa de base' },
    { v: 3, l: 'Subbase' }, { v: 4, l: 'Subrasante' }, { v: 5, l: 'Mejoramiento' }
];
const D_MATERIAL = [
    { v: 1, l: 'Concreto asfáltico' }, { v: 2, l: 'Tratamiento superficial' },
    { v: 3, l: 'Concreto hidráulico' }, { v: 4, l: 'Base granular' },
    { v: 5, l: 'Subbase granular' }, { v: 6, l: 'Recebo' },
    { v: 7, l: 'Material seleccionado' }, { v: 8, l: 'Otro' }
];

const capaSchema = new mongoose.Schema({
    tipoCapa:  { type: Number },   // TIPOCAPA 1-5
    material:  { type: Number },   // MATERIAL 1-8
    espesor:   { type: Number },   // ESPESOR en centímetros
    obs:       { type: String }
}, { _id: false });

const sincEstructuraPavSchema = new mongoose.Schema({
    idEje:      { type: mongoose.Schema.Types.ObjectId, ref: 'SincEje', required: true },
    codigoVia:  { type: String, required: true },

    abscisaIni: { type: Number },   // km inicio segmento
    abscisaFin: { type: Number },   // km fin segmento
    numCapas:   { type: Number },   // NUMCAPAS — total de capas
    capas:      [capaSchema],       // detalle por capa

    fecha:      { type: Date },
    foto:       { type: String },
    rutaFoto:   { type: String },

    codMunicipio:    { type: Number },
    codDepartamento: { type: Number },
    municipio:       { type: String },
    departamento:    { type: String },

    // Geometría — LineString (tramo con esta estructura)
    ubicacion: {
        type:        { type: String, default: 'LineString' },
        coordinates: { type: [[Number]] }
    },

    obs:   { type: String },

    creadoPor:         { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fechaCreacion:     { type: Date, default: Date.now },
    modificadoPor:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fechaModificacion: { type: Date }
});

sincEstructuraPavSchema.index({ ubicacion: '2dsphere' });
sincEstructuraPavSchema.index({ idEje: 1 });

const SincEstructuraPavimento = mongoose.model('SincEstructuraPavimento', sincEstructuraPavSchema);
SincEstructuraPavimento.D_TIPOCAPA = D_TIPOCAPA;
SincEstructuraPavimento.D_MATERIAL = D_MATERIAL;
module.exports = SincEstructuraPavimento;
