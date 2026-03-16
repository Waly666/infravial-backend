const mongoose = require('mongoose');

const observacionViaSchema = new mongoose.Schema({
    txtObs: { type: String, required: true }
});

module.exports = mongoose.model('ObservacionVia', observacionViaSchema);