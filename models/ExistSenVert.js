const mongoose = require('mongoose');

const existSenVertSchema = new mongoose.Schema({
    idJornada:  { type: mongoose.Schema.Types.ObjectId, ref: 'Jornada', required: true },
    idViaTramo: { type: mongoose.Schema.Types.ObjectId, ref: 'ViaTramo', required: true },

    // Geoespacial Point
    ubicacion: {
        type:        { type: String, default: 'Point' },
        coordinates: { type: [Number] }
    },

    codSe:        { type: String, ref: 'SenVert' },
    estado:       { type: String, enum: ['Bueno', 'Regular', 'Malo'] },
    matPlaca:     { type: String, enum: ['Poliester reforzado', 'Acero galvanizado', 'Aluminio', 'Material Flexible', 'Otro'] },
    ubicEspacial: { type: String, enum: ['A nivel', 'Elevada'] },
    obstruccion:  { type: String },
    fechaInst:    { type: Date },
    forma:        { type: String, enum: ['Circular', 'Octogonal', 'Rectangular', 'Cuadrangular', 'Romboidal', 'Triangular', 'Casa', 'Cruz', 'Escudo', 'Combinacion'] },
    orientacion:  { type: String, enum: ['Optima', 'Deficiente', 'N/A'] },
    reflecOptima: { type: String, enum: ['si', 'no', 'N/A'] },
    dimTablero:   { type: String },
    ubicPerVial:  { type: String, enum: ['Izquierda', 'Derecha', 'Sobre la calzada', 'En el Separador'] },
    fase:         { type: String, enum: ['Inventario', 'Programación', 'Diseño', 'Por definir'] },
    accion:       { type: String },
    ubicLateral:  { type: Number },
    diagUbicLat:  { type: String, enum: ['Optima', 'Regular', 'Mala', 'N/A'] },
    altura:       { type: Number },
    diagAltura:   { type: String, enum: ['Optima', 'Regular', 'Mala', 'N/A'] },
    banderas:     { type: String, enum: ['Dirección', 'Confirmación', 'Preseñalización', 'N/A'] },
    leyendas:     { type: String },

    // Fallas como array
    fallas: [{ type: String, enum: ['Desgaste', 'Desproporción de tablero', 'Oxidación', 'Paral doblado', 'Tablero doblado', 'Elementos ajenos', 'Vandalizada', 'N/A'] }],

    // Diagnóstico soporte
    tipoSoporte:   { type: String },
    sistemaSoporte:{ type: String, enum: ['Tipo H', 'Duplex', 'Movil', 'Poste abatible', 'Elevado', 'Simple', 'Poste en angulo de hierro'] },
    estadoSoporte: { type: String, enum: ['Bueno', 'Regular', 'Malo'] },
    estadoAnclaje: { type: String, enum: ['Bueno', 'Regular', 'Malo'] },

    // Observaciones (ref a ObservacionSV)
    notas: { type: String },
    obs1:  { type: mongoose.Schema.Types.ObjectId, ref: 'ObservacionSV' },
    obs2:  { type: mongoose.Schema.Types.ObjectId, ref: 'ObservacionSV' },
    obs3:  { type: mongoose.Schema.Types.ObjectId, ref: 'ObservacionSV' },
    obs4:  { type: mongoose.Schema.Types.ObjectId, ref: 'ObservacionSV' },
    obs5:  { type: mongoose.Schema.Types.ObjectId, ref: 'ObservacionSV' },

    // Auditoría
    creadoPor:         { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fechaCreacion:     { type: Date, default: Date.now },
    modificadoPor:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fechaModificacion: { type: Date },
    logUltimaMod:      { type: String }
});

existSenVertSchema.index({ ubicacion: '2dsphere' });
module.exports = mongoose.model('ExistSenVert', existSenVertSchema);