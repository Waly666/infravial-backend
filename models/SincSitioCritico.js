const mongoose = require('mongoose');

// Dominios SINC — Sitios Críticos · Tabla 10 (TIPO / SEVERIDAD / LADO)
const D_TIPO = [
    { v: 1, l: 'Hundimiento de subrasante o pérdida de la banca' },
    { v: 2, l: 'Detritos en la vía' },
    { v: 3, l: 'Abultamiento sobre o bajo la carretera' },
    { v: 4, l: 'Cambios de forma' },
    { v: 5, l: 'Deformación de estructuras adyacentes' },
    { v: 6, l: 'Erosión' },
    { v: 7, l: 'Derrumbes' },
    { v: 8, l: 'Deslizamientos' },
    { v: 9, l: 'Grietas de tracción en carretera o taludes' },
];
const D_SEVERIDAD = [
    { v: 1, l: 'Sin daño o daño insignificante' },
    { v: 2, l: 'Daño pequeño, reparación no necesaria' },
    { v: 3, l: 'Daño pequeño, reparación necesaria' },
    { v: 4, l: 'Daño grave, reparación urgente' },
];
const D_LADO = [
    { v: 1, l: 'Lado en sentido A→B de la vía' },
    { v: 2, l: 'Lado en sentido B→A de la vía' },
];

const sincSitioCriticoSchema = new mongoose.Schema({
    idEje:      { type: mongoose.Schema.Types.ObjectId, ref: 'SincEje', required: true },
    codigoVia:  { type: String, required: true, maxlength: 25 },

    tipo:       { type: Number },   // TIPO 1–9
    severidad:  { type: Number },   // SEVERIDAD 1–4
    lado:       { type: Number },   // LADO 1–2

    fecha:      { type: Date },
    foto:       { type: String, maxlength: 50 },
    rutaFoto:   { type: String, maxlength: 250 },

    codMunicipio:    { type: Number },
    codDepartamento: { type: Number },
    municipio:       { type: String, maxlength: 25 },
    departamento:    { type: String, maxlength: 25 },

    // Geometría — Point (ubicación del sitio)
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

sincSitioCriticoSchema.index({ ubicacion: '2dsphere' });
sincSitioCriticoSchema.index({ idEje: 1 });

const SincSitioCritico = mongoose.model('SincSitioCritico', sincSitioCriticoSchema);
SincSitioCritico.D_TIPO      = D_TIPO;
SincSitioCritico.D_SEVERIDAD = D_SEVERIDAD;
SincSitioCritico.D_LADO      = D_LADO;
module.exports = SincSitioCritico;
