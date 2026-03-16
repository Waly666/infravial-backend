const mongoose = require('mongoose');

const divipolSchema = new mongoose.Schema({
    divipolMunCod:   { type: String, required: true, unique: true },
    divipolMunicipio:{ type: String, required: true },
    divipolDepto:    { type: String, required: true },
    divipolDeptoCod: { type: String, required: true }
});

module.exports = mongoose.model('Divipol', divipolSchema);