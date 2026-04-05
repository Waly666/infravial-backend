const mongoose = require('mongoose');

// Dominios SINC — Muros de contención (Tabla 8 · LADO)
const D_LADO = [
    { v: 1, l: 'Lado en sentido A→B de la vía' },
    { v: 2, l: 'Lado en sentido B→A de la vía' },
];
// Nivel Detallado
const D_TIPOMURO = [
    { v: 1, l: 'Gravedad' }, { v: 2, l: 'Voladizo' }, { v: 3, l: 'Contrafuerte' },
    { v: 4, l: 'Anclado' }, { v: 5, l: 'Suelo Reforzado' }, { v: 6, l: 'Gavión' }, { v: 7, l: 'Otro' }
];
const D_MATERIAL_MURO = [
    { v: 1, l: 'Concreto' }, { v: 2, l: 'Mampostería' }, { v: 3, l: 'Gaviones' },
    { v: 4, l: 'Tierra Armada' }, { v: 5, l: 'Mixto' }, { v: 6, l: 'Otro' }
];
const D_ESTADO_MURO = [
    { v: 1, l: 'Bueno' }, { v: 2, l: 'Regular' }, { v: 3, l: 'Malo' }, { v: 4, l: 'Crítico' }
];

const sincMuroSchema = new mongoose.Schema({
    idEje:      { type: mongoose.Schema.Types.ObjectId, ref: 'SincEje', required: true },
    codigoVia:  { type: String, required: true, maxlength: 25 },

    distIni:    { type: Number },   // DISTINI 0–250000
    longitud:   { type: Number },   // LONGITUD 2–500 m
    altura:     { type: Number },   // ALTURA 0,1–50 m
    anchoCor:   { type: Number },   // ANCHOCOR 0,1–20 m
    lado:       { type: Number },   // LADO 1–2 (Tabla 8)

    // ── Nivel Detallado (opcionales en Nivel Básico) ──
    tipoMuro:   { type: Number },   // TIPOMURO 1-7
    material:   { type: Number },   // MATERIAL 1-6
    estado:     { type: Number },   // ESTADO 1-4

    fecha:      { type: Date },
    foto:       { type: String, maxlength: 50 },
    rutaFoto:   { type: String, maxlength: 250 },

    codMunicipio:    { type: Number },
    codDepartamento: { type: Number },
    municipio:       { type: String, maxlength: 25 },
    departamento:    { type: String, maxlength: 25 },

    // Geometría — Point (inicio del muro en el sentido del abscisado)
    ubicacion: {
        type:        { type: String, default: 'Point' },
        coordinates: { type: [Number] }   // [lng, lat]
    },

    fotos: [{ type: String }],
    obs:   { type: String, maxlength: 250 },

    creadoPor:         { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fechaCreacion:     { type: Date, default: Date.now },
    modificadoPor:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fechaModificacion: { type: Date }
});

sincMuroSchema.index({ ubicacion: '2dsphere' });
sincMuroSchema.index({ idEje: 1 });

const SincMuro = mongoose.model('SincMuro', sincMuroSchema);
SincMuro.D_LADO         = D_LADO;
SincMuro.D_TIPOMURO     = D_TIPOMURO;
SincMuro.D_MATERIAL     = D_MATERIAL_MURO;
SincMuro.D_ESTADO       = D_ESTADO_MURO;
module.exports = SincMuro;
