const mongoose = require('mongoose');

const detalleConteoSchema = new mongoose.Schema({
    idConteo:   { type: mongoose.Schema.Types.ObjectId, ref: 'Conteo',        required: true },
    idEstacion: { type: mongoose.Schema.Types.ObjectId, ref: 'EstacionConteo', required: true },
    idSentido:  { type: mongoose.Schema.Types.ObjectId, ref: 'SentidoConteo',  required: true },
    idCatCont:  { type: mongoose.Schema.Types.ObjectId, ref: 'CatConteo',      required: true },
    hora:       { type: Date, default: Date.now },
    usuario:    { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('DetalleConteo', detalleConteoSchema);
