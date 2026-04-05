const mongoose = require('mongoose');

// Dominios SINC — Defensas / Barreras de Contención (Nivel Detallado)
const D_TIPO = [
    { v: 1, l: 'Barrera New Jersey' }, { v: 2, l: 'Guarda vía metálico' },
    { v: 3, l: 'Cable' }, { v: 4, l: 'Muro parapeto' }, { v: 5, l: 'Otro' }
];
const D_MATERIAL = [
    { v: 1, l: 'Concreto' }, { v: 2, l: 'Acero' },
    { v: 3, l: 'Madera' }, { v: 4, l: 'Mixto' }, { v: 5, l: 'Otro' }
];
const D_ESTADO = [
    { v: 1, l: 'Bueno' }, { v: 2, l: 'Regular' },
    { v: 3, l: 'Malo' }, { v: 4, l: 'Destruido' }
];
const D_LADO = [
    { v: 1, l: 'Izquierdo (sentido A-B)' }, { v: 2, l: 'Derecho (sentido A-B)' }, { v: 3, l: 'Ambos lados' }
];

const sincDefensaSchema = new mongoose.Schema({
    idEje:      { type: mongoose.Schema.Types.ObjectId, ref: 'SincEje', required: true },
    codigoVia:  { type: String, required: true },

    distIni:    { type: Number },   // DISTINI — metros desde inicio del eje
    longitud:   { type: Number },   // LONGITUD (metros)

    tipo:       { type: Number },   // TIPO 1-5
    material:   { type: Number },   // MATERIAL 1-5
    estado:     { type: Number },   // ESTADO 1-4
    lado:       { type: Number },   // LADO 1-3

    fecha:      { type: Date },
    foto:       { type: String },
    rutaFoto:   { type: String },

    codMunicipio:    { type: Number },
    codDepartamento: { type: Number },
    municipio:       { type: String },
    departamento:    { type: String },

    // Geometría — Point (inicio de la defensa en sentido del abscisado)
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

sincDefensaSchema.index({ ubicacion: '2dsphere' });
sincDefensaSchema.index({ idEje: 1 });

const SincDefensa = mongoose.model('SincDefensa', sincDefensaSchema);
SincDefensa.D_TIPO     = D_TIPO;
SincDefensa.D_MATERIAL = D_MATERIAL;
SincDefensa.D_ESTADO   = D_ESTADO;
SincDefensa.D_LADO     = D_LADO;
module.exports = SincDefensa;
