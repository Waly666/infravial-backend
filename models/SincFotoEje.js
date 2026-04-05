const mongoose = require('mongoose');

// FOTOEJE — Capa fotográfica del eje (punto de toma de foto)
const D_CALZADA = [
    { v: 1, l: 'Izquierda' }, { v: 2, l: 'Derecha' }, { v: 3, l: 'No aplica' }
];

const sincFotoEjeSchema = new mongoose.Schema({
    idEje:      { type: mongoose.Schema.Types.ObjectId, ref: 'SincEje', required: true },
    codigoVia:  { type: String, required: true },   // CODIGOVIA (denormalizado)

    numPr:      { type: String, maxlength: 40, trim: true }, // NUMPR — código compuesto del PR
    calzada:    { type: Number },                   // CALZADA 1-3
    foto:       { type: String },                   // FOTO — nombre de archivo
    rutaFoto:   { type: String },                   // RUTAFOTO — URL/path almacenado
    fecha:      { type: Date },                     // FECHA de toma

    codMunicipio:    { type: Number },              // COD_MUNICIPIO
    codDepartamento: { type: Number },              // COD_DEPARTAMENTO
    municipio:       { type: String },              // MUNICIPIO
    departamento:    { type: String },              // DEPARTAMENTO

    // Geometría — Point (lugar exacto donde se tomó la foto)
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

sincFotoEjeSchema.index({ ubicacion: '2dsphere' });
sincFotoEjeSchema.index({ idEje: 1 });

const SincFotoEje = mongoose.model('SincFotoEje', sincFotoEjeSchema);
SincFotoEje.D_CALZADA = D_CALZADA;
module.exports = SincFotoEje;
