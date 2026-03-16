const mongoose = require('mongoose');

const preguntaEncViaSchema = new mongoose.Schema({
    consecutivo: { type: String, required: true }, // "1", "26.1", etc.
    enunciado:   { type: String, required: true }
});

module.exports = mongoose.model('PreguntaEncVia', preguntaEncViaSchema);