const mongoose = require('mongoose');

const sentidoConteoSchema = new mongoose.Schema({
    codSentido: { type: String, required: true },
    sentido:    { type: String, required: true },
    urlSentImg: { type: String }
});

module.exports = mongoose.model('SentidoConteo', sentidoConteoSchema);
