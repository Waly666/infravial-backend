const mongoose = require('mongoose');

const backupEventSchema = new mongoose.Schema({
    tipo: { type: String, enum: ['backup', 'restore', 'purge'], required: true },
    estado: { type: String, enum: ['success', 'error'], required: true },
    actor: { type: String, default: 'system' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    archivo: { type: String, default: '' },
    rutaArchivo: { type: String, default: '' },
    sha256: { type: String, default: '' },
    tamanoBytes: { type: Number, default: 0 },
    colecciones: { type: Number, default: 0 },
    registros: { type: Number, default: 0 },
    detalle: { type: String, default: '' },
    fechaInicio: { type: Date, default: Date.now },
    fechaFin: { type: Date, default: null }
});

module.exports = mongoose.model('BackupEvent', backupEventSchema);
