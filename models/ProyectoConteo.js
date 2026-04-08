const mongoose = require('mongoose');

const proyectoConteoSchema = new mongoose.Schema({
    descripcion:  { type: String, required: true },
    responsable:  { type: String },
    fechaInicio:  { type: Date },
    fechaFin:     { type: Date },
    notas:        { type: String },
    activo:       { type: Boolean, default: false }   // solo 1 activo a la vez
}, { timestamps: true });

module.exports = mongoose.model('ProyectoConteo', proyectoConteoSchema);
