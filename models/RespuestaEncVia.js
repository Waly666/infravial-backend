const mongoose = require('mongoose');

const respuestaEncViaSchema = new mongoose.Schema({
    idTramoVia:   { type: mongoose.Schema.Types.ObjectId, ref: 'ViaTramo', required: true },
    idPregunta:   { type: mongoose.Schema.Types.ObjectId, ref: 'PreguntaEncVia', required: true },
    consecutivo:  { type: String },
    valorRta:     { type: String }, // 'si', 'no', 'na'
    observacion:  { type: String }
});

module.exports = mongoose.model('RespuestaEncVia', respuestaEncViaSchema);