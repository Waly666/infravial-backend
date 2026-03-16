const mongoose = require('mongoose');

const auditSchema = new mongoose.Schema({
    user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    metodo:   { type: String },
    ruta:     { type: String },
    ip:       { type: String },
    status:   { type: Number },
    duracion: { type: Number },
    userAgent:{ type: String },
    fecha:    { type: Date, default: Date.now },
    cambio:   { type: String }
});

module.exports = mongoose.model('Audit', auditSchema);