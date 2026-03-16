const mongoose = require('mongoose');

const observacionSVSchema = new mongoose.Schema({
    observacion: { type: String, required: true }
});

module.exports = mongoose.model('ObservacionSV', observacionSVSchema);