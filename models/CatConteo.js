const mongoose = require('mongoose');

const catConteoSchema = new mongoose.Schema({
    catCont:    { type: String, required: true },
    desCat:     { type: String },
    urlCatCont: { type: String }
});

module.exports = mongoose.model('CatConteo', catConteoSchema);
