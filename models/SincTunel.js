const mongoose = require('mongoose');

// Dominios SINC — Túneles
const D_ESTADO = [
    { v: 1, l: 'Bueno' }, { v: 2, l: 'Regular' }, { v: 3, l: 'Malo' }
];
// Nivel Detallado
const D_TIPOTUN = [
    { v: 1, l: 'Carretero' }, { v: 2, l: 'Peatonal' },
    { v: 3, l: 'Minero Habilitado' }, { v: 4, l: 'Otro' }
];

const sincTunelSchema = new mongoose.Schema({
    idEje:      { type: mongoose.Schema.Types.ObjectId, ref: 'SincEje', required: true },
    codigoVia:  { type: String, required: true, maxlength: 25 },

    distIni:    { type: Number },   // DISTINI 0–250000
    nombre:     { type: String, maxlength: 100 },   // NOMBRE 3–100

    longitud:   { type: Number },   // LONGITUD 2–10 000 m
    ancoCarr:   { type: Number },   // ANCOCARR 1–5 m
    numCarr:    { type: Number },   // NUMCARR 1–10

    estado:     { type: Number },   // ESTADO 1–3 (Tabla TUNELES)

    // ── Nivel Detallado (opcionales en Nivel Básico) ──
    tipoTun:    { type: Number },   // TIPOTUN 1-4
    alturaGiro: { type: Number },   // ALTURAGIRO — gálibo/clearance (metros)

    fecha:      { type: Date },
    foto:       { type: String, maxlength: 50 },
    rutaFoto:   { type: String, maxlength: 250 },

    codMunicipio:    { type: Number },
    codDepartamento: { type: Number },
    municipio:       { type: String, maxlength: 25 },
    departamento:    { type: String, maxlength: 25 },

    // Geometría — Point (portal de entrada en el sentido del abscisado)
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

sincTunelSchema.index({ ubicacion: '2dsphere' });
sincTunelSchema.index({ idEje: 1 });

const SincTunel = mongoose.model('SincTunel', sincTunelSchema);
SincTunel.D_ESTADO  = D_ESTADO;
SincTunel.D_TIPOTUN = D_TIPOTUN;
module.exports = SincTunel;
