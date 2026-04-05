const mongoose = require('mongoose');

// Dominios SINC — Taludes (Nivel Detallado)
const D_TIPO = [
    { v: 1, l: 'Corte' }, { v: 2, l: 'Relleno' }, { v: 3, l: 'Terraplén' }
];
const D_MATERIAL = [
    { v: 1, l: 'Roca' }, { v: 2, l: 'Suelo duro' },
    { v: 3, l: 'Suelo blando' }, { v: 4, l: 'Mixto' }
];
const D_ESTABILIDAD = [
    { v: 1, l: 'Estable' }, { v: 2, l: 'Potencialmente inestable' },
    { v: 3, l: 'Inestable' }, { v: 4, l: 'Crítico' }
];
const D_LADO = [
    { v: 1, l: 'Izquierdo (sentido A-B)' }, { v: 2, l: 'Derecho (sentido A-B)' }
];

const sincTaludeSchema = new mongoose.Schema({
    idEje:       { type: mongoose.Schema.Types.ObjectId, ref: 'SincEje', required: true },
    codigoVia:   { type: String, required: true },

    distIni:     { type: Number },   // DISTINI — metros desde el inicio del eje
    longitud:    { type: Number },   // LONGITUD (metros)
    altura:      { type: Number },   // ALTURA (metros)
    inclinacion: { type: Number },   // INCLINACION — relación H:V (ej: 1.5)

    tipo:        { type: Number },   // TIPO 1-3
    material:    { type: Number },   // MATERIAL 1-4
    estabilidad: { type: Number },   // ESTABILIDAD 1-4
    lado:        { type: Number },   // LADO 1-2

    fecha:      { type: Date },
    foto:       { type: String },
    rutaFoto:   { type: String },

    codMunicipio:    { type: Number },
    codDepartamento: { type: Number },
    municipio:       { type: String },
    departamento:    { type: String },

    // Geometría — Point (pie del talud, inicio en sentido del abscisado)
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

sincTaludeSchema.index({ ubicacion: '2dsphere' });
sincTaludeSchema.index({ idEje: 1 });

const SincTalude = mongoose.model('SincTalude', sincTaludeSchema);
SincTalude.D_TIPO        = D_TIPO;
SincTalude.D_MATERIAL    = D_MATERIAL;
SincTalude.D_ESTABILIDAD = D_ESTABILIDAD;
SincTalude.D_LADO        = D_LADO;
module.exports = SincTalude;
