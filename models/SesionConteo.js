const mongoose = require('mongoose');

const sesionConteoSchema = new mongoose.Schema({
    idConteo:    { type: mongoose.Schema.Types.ObjectId, ref: 'Conteo',       required: true },
    idSentido:   { type: mongoose.Schema.Types.ObjectId, ref: 'SentidoConteo', required: true },
    usuario:     { type: String, required: true },
    fechaInicio: { type: Date, default: Date.now },
    activo:      { type: Boolean, default: true }
}, { timestamps: true });

// Un sentido solo puede tener una sesión activa por conteo
sesionConteoSchema.index({ idConteo: 1, idSentido: 1, activo: 1 });

module.exports = mongoose.model('SesionConteo', sesionConteoSchema);
