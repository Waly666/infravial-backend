const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    user:             { type: String, required: true, unique: true }, // cedula
    nombres:          { type: String, required: true },
    apellidos:        { type: String, required: true },
    password:         { type: String, required: true },
    rol:              { type: String, required: true, enum: ['admin', 'supervisor', 'encuestador', 'invitado'] },
    mail:             { type: String },
    activo:           { type: Boolean, default: true },
    creadoPor:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fechaCreacion:    { type: Date, default: Date.now },
    modificadoPor:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fechaModificacion:{ type: Date },
    logUltimaMod:     { type: String }
});

module.exports = mongoose.model('User', userSchema);