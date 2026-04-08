const mongoose = require('mongoose');

const coordSchema = new mongoose.Schema({
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
}, { _id: false });

const estacionConteoSchema = new mongoose.Schema({
    // Nomenclatura compuesta (igual que viaTramos)
    nomPartes: {
        tipoVia1: { type: String, default: '' },
        numero1:  { type: String, default: '' },
        conector: { type: String, default: '' },
        tipoVia2: { type: String, default: '' },
        numero2:  { type: String, default: '' },
        conector2:{ type: String, default: '' },
        tipoVia3: { type: String, default: '' },
        numero3:  { type: String, default: '' }
    },
    nomenclatura:  { type: String, required: true },   // valor completo generado

    // Polígono de la estación: array de puntos {lat, lng}
    poligono:      { type: [coordSchema], default: [] },

    departamento:  { type: String },
    municipio:     { type: String },
    localidad:     { type: String },
    supervisor:    { type: String },
    creadoPor:     { type: String }
}, { timestamps: true });

module.exports = mongoose.model('EstacionConteo', estacionConteoSchema);
