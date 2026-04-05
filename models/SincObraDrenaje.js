const mongoose = require('mongoose');

// Dominios SINC — Obras de Drenaje (Nivel Básico)
const D_TIPO = [
    { v: 1, l: 'Box culvert' },
    { v: 2, l: 'Tubería (alcantarilla)' },
    { v: 3, l: 'Bateas' },
    { v: 4, l: 'Cruce cuerpo de agua superficial' },
    { v: 5, l: 'Otro' },
];
const D_MATERIAL = [
    { v: 1, l: 'Concreto' }, { v: 2, l: 'PVC' }, { v: 3, l: 'Madera' },
    { v: 4, l: 'Metálica' }, { v: 5, l: 'Otro' }
];
const D_ESTADOSERV = [
    { v: 1, l: 'Colmatada' }, { v: 2, l: 'Medianamente colmatada' }, { v: 3, l: 'Limpia' }
];
const D_ESTADOGEN = [
    { v: 1, l: 'Bueno' }, { v: 2, l: 'Regular' }, { v: 3, l: 'Malo' }, { v: 4, l: 'No funcional' }
];

const sincObraDrenajeSchema = new mongoose.Schema({
    idEje:      { type: mongoose.Schema.Types.ObjectId, ref: 'SincEje', required: true },
    codigoVia:  { type: String, required: true, maxlength: 25 },

    tipo:       { type: Number },   // TIPO 1–5 (Tabla 12)
    material:   { type: Number },   // MATERIAL 1–5
    estadoServ: { type: Number },   // ESTADOSERV 1–3
    estadoGen:  { type: Number },   // ESTADOGEN 1–4
    numSecc:    { type: Number },   // NUMSECC 1–10

    ancho:      { type: Number },   // ANCHO 0,1–10 m
    longitud:   { type: Number },   // LONGITUD 1–1000 m

    fecha:      { type: Date },
    foto:       { type: String, maxlength: 50 },
    rutaFoto:   { type: String, maxlength: 250 },

    codMunicipio:    { type: Number },
    codDepartamento: { type: Number },
    municipio:       { type: String, maxlength: 25 },
    departamento:    { type: String, maxlength: 25 },

    // Geometría — Point (ubicación de la obra)
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

sincObraDrenajeSchema.index({ ubicacion: '2dsphere' });
sincObraDrenajeSchema.index({ idEje: 1 });

const SincObraDrenaje = mongoose.model('SincObraDrenaje', sincObraDrenajeSchema);
SincObraDrenaje.D_TIPO       = D_TIPO;
SincObraDrenaje.D_MATERIAL   = D_MATERIAL;
SincObraDrenaje.D_ESTADOSERV = D_ESTADOSERV;
SincObraDrenaje.D_ESTADOGEN  = D_ESTADOGEN;
module.exports = SincObraDrenaje;
