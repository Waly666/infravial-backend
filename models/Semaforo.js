const mongoose = require('mongoose');

const caraSchema = new mongoose.Schema({
    tipoModulo:      { type: String},
    diametroLente:   { type: String, enum: ['30 cms', '20 cms'] },
    numeroModulos:   { type: Number },
    numeroVisceras:  { type: Number },
    estadoMod1:      { type: String},
    estadoViscera1:  { type: String},
    estadoMod2:      { type: String},
    estadoViscera2:  { type: String},
    estadoMod3:      { type: String},
    estadoViscera3:  { type: String},
    estadoMod4:      { type: String},
    estadoViscera4:  { type: String},
    despliegue:      { type: String},
    estadoCara:      { type: String},
    colores:         { type: String },
    placaContraste:  { type: Boolean },
    estadoPlacaCont: { type: String},
    danos:           [{ type: String }],
    flechaDir:       { type: Boolean },
    obs:             { type: String },
    urlFoto:         { type: String }
    
}, { _id: false });

const sensorSchema = new mongoose.Schema({
    tipo:   { type: String },
    estado: { type: String, enum: ['Operativo', 'Intermitente', 'No Funcional'] }
}, { _id: false });

const semaforoSchema = new mongoose.Schema({
    idJornada:          { type: mongoose.Schema.Types.ObjectId, ref: 'Jornada', required: true },
    idViaTramo:         { type: mongoose.Schema.Types.ObjectId, ref: 'ViaTramo', required: true },
    idControSem:        { type: mongoose.Schema.Types.ObjectId, ref: 'ControlSemaforo' },
    numExterno:         { type: Number },
    controlRef:         { type: String },

    // Geoespacial Point
    ubicacion: {
        type:        { type: String, default: 'Point' },
        coordinates: { type: [Number] }
    },

    ipRadio:            { type: String },
    sitio:              { type: String },
    semaforoFunciona:   { type: Boolean },
    claseSem:           { type: String },
    numCaras:           { type: Number, enum: [1, 2, 3, 4] },
    obstruccion:        { type: String },
    visibilidadOptima:  { type: String, enum: ['si', 'no', 'N/A'] },
    fase:               { type: String, enum: ['Inventario', 'Programación', 'Diseño', 'Por definir'] },
    accion:             { type: String },
    estadoGenPint:      { type: String, enum: ['Bueno', 'Regular', 'Malo'] },
    implementacion:     { type: String, enum: ['Temporal', 'Definitiva'] },
    pulsador:           { type: Boolean },
    estadoPulsador:     { type: String, enum: ['Bueno', 'Regular', 'Malo'] },
    temporizador:       { type: Boolean },
    estadoTemp:         { type: String, enum: ['Bueno', 'Regular', 'Malo'] },
    dispositivoAuditivo:{ type: Boolean },
    estadoDispAud:      { type: String},
    tipoSoporte:        { type: String },
    estadoSoporte:      { type: String, enum: ['Bueno', 'Regular', 'Malo'] },
    pinturaSoporte:     { type: String, enum: ['Bueno', 'Regular', 'Malo'] },
    sistemaSoporte:     { type: String },
    estadoAnclaje:      { type: String, enum: ['Bueno', 'Regular', 'Malo'] },
    urlFotoSoporte:     { type: String },
    urlFotoAnclaje:     { type: String },
    urlFotoPulsador:    { type: String },
    urlFotoDispAud:     { type: String },
    urlFotoSemaforo:    { type: String },

    // Caras como array de subdocumentos
    caras:   [caraSchema],

    // Sensores como array de subdocumentos
    sensores:[sensorSchema],

    // Observaciones (ref a ObsSemaforo)
    obs1: { type: mongoose.Schema.Types.ObjectId, ref: 'ObsSemaforo' },
    obs2: { type: mongoose.Schema.Types.ObjectId, ref: 'ObsSemaforo' },
    obs3: { type: mongoose.Schema.Types.ObjectId, ref: 'ObsSemaforo' },
    obs4: { type: mongoose.Schema.Types.ObjectId, ref: 'ObsSemaforo' },
    obs5: { type: mongoose.Schema.Types.ObjectId, ref: 'ObsSemaforo' },
    obs6: { type: mongoose.Schema.Types.ObjectId, ref: 'ObsSemaforo' },

    notasGenerales:     { type: String },

    // Auditoría
    creadoPor:          { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fechaCreacion:      { type: Date, default: Date.now },
    modificadoPor:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fechaModificacion:  { type: Date },
    logUltimaMod:       { type: String }
});

semaforoSchema.index({ ubicacion: '2dsphere' });
module.exports = mongoose.model('Semaforo', semaforoSchema);