const mongoose = require('mongoose');

// Dominios SINC — Puentes
const D_TIPOESTRUC = [
    { v: 1, l: 'Losa' }, { v: 2, l: 'Viga' }, { v: 3, l: 'Arco' },
    { v: 4, l: 'Colgante' }, { v: 5, l: 'Atirantado' }, { v: 6, l: 'Cercha' },
    { v: 7, l: 'Marco' }, { v: 8, l: 'Bóveda' }, { v: 9, l: 'Mixto' }, { v: 10, l: 'Otro' }
];
const D_MATERIAL = [
    { v: 1, l: 'Concreto Reforzado' }, { v: 2, l: 'Concreto Postensado' },
    { v: 3, l: 'Acero' }, { v: 4, l: 'Madera' }, { v: 5, l: 'Mampostería' },
    { v: 6, l: 'Mixto' }, { v: 7, l: 'Otro' }
];
const D_ESTADOPTE = [
    { v: 1, l: 'Bueno' }, { v: 2, l: 'Regular' }, { v: 3, l: 'Malo' }, { v: 4, l: 'Crítico' }
];

const sincPuenteSchema = new mongoose.Schema({
    idEje:       { type: mongoose.Schema.Types.ObjectId, ref: 'SincEje', required: true },
    codigoVia:   { type: String, required: true, maxlength: 25 },

    numPr:       { type: Number },   // NUMPR — PRS de referencia
    distIni:     { type: Number },   // DISTINI — distancia en m desde el inicio de la vía al inicio del puente (Tabla 7)
    nombre:      { type: String },   // NOMBRE (3–100)

    longitud:    { type: Number },   // LONGITUD (1–4000 m)
    anchoTable:  { type: Number },   // ANCHOTABLE (2–30 m)
    numLuces:    { type: Number },   // NUMLUCES (0–20)

    tipoEstruc:  { type: Number },   // opcional — no en Tabla 7 básica; reservado
    material:    { type: Number },
    estadoSup:   { type: Number },   // ESTADOSUP 1–4 (rodadura)
    estadoEst:   { type: Number },   // ESTADOEST 1–4 (estructura)

    fecha:       { type: Date },
    foto:        { type: String, maxlength: 50 },   // FOTO — nombre archivo (4–50)
    rutaFoto:    { type: String, maxlength: 250 }, // RUTAFOTO — URL/path JPG (10–250)

    codMunicipio:    { type: Number },
    codDepartamento: { type: Number },
    municipio:       { type: String, maxlength: 25 },
    departamento:    { type: String, maxlength: 25 },

    // Geometría — Point (inicio del puente en el sentido del abscisado)
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

sincPuenteSchema.index({ ubicacion: '2dsphere' });
sincPuenteSchema.index({ idEje: 1 });

const SincPuente = mongoose.model('SincPuente', sincPuenteSchema);
SincPuente.D_TIPOESTRUC = D_TIPOESTRUC;
SincPuente.D_MATERIAL   = D_MATERIAL;
SincPuente.D_ESTADOPTE  = D_ESTADOPTE;
module.exports = SincPuente;
