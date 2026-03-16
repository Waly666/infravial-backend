const mongoose = require('mongoose');

const observacionSHSchema = new mongoose.Schema({
    obsSH: { type: String, required: true }
});

module.exports = mongoose.model('ObservacionSH', observacionSHSchema);
