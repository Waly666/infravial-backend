const mongoose = require('mongoose');

const obsSemaforoSchema = new mongoose.Schema({
    consecutivo: { type: Number },
    textoObs:    { type: String, required: true }
});

module.exports = mongoose.model('ObsSemaforo', obsSemaforoSchema);