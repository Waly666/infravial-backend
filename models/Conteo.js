const mongoose = require('mongoose');

const conteoSchema = new mongoose.Schema({
    idEstacion:    { type: mongoose.Schema.Types.ObjectId, ref: 'EstacionConteo', required: true },
    idProyecto:    { type: mongoose.Schema.Types.ObjectId, ref: 'ProyectoConteo' },
    fecha:         { type: Date, required: true },
    horaIni:       { type: Date, required: true },
    horaFin:       { type: Date, required: true },
    condClim:      { type: String, enum: ['DESPEJADO', 'NUBLADO', 'LLUVIOSO', 'PARCIALMENTE NUBLADO'], default: 'DESPEJADO' },
    observaciones: { type: String },
    estado:        { type: String, enum: ['EN PROCESO', 'COMPLETADO'], default: 'EN PROCESO' }
}, { timestamps: true });

module.exports = mongoose.model('Conteo', conteoSchema);
