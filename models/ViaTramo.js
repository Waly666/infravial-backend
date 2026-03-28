const mongoose = require('mongoose');

const danoSchema = new mongoose.Schema({
    dano:  { type: String },
    clase: { type: String },
    tipo:  { type: String }
}, { _id: false });

const nomenclaturaSchema = new mongoose.Schema({
    tipoVia1:  { type: String },
    numero1:   { type: String },
    conector:  { type: String },
    tipoVia2:  { type: String },
    numero2:   { type: String },
    conector2: { type: String },
    tipoVia3:  { type: String },
    numero3:   { type: String },
    completa:  { type: String }
}, { _id: false });

const viaTramoSchema = new mongoose.Schema({
    idJornada:    { type: mongoose.Schema.Types.ObjectId, ref: 'Jornada', required: true },
    fechaInv:     { type: Date },
    via:          { type: String },
    departamento: { type: String },
    municipio:    { type: String },
    localidad:    { type: String },
    tipoLocalidad:{ type: String },

    // Geoespacial LineString
    ubicacion: {
        type:        { type: String, default: 'LineString' },
        coordinates: { type: [[Number]] }
    },
    longitud_m: { type: Number },
    altitud:    { type: Number },

    // Datos generales
    entidadVia:     { type: String },
    respVia:        { type: String },
    encuestador:    { type: String },
    supervisor:     { type: String },
    zat:            { type: mongoose.Schema.Types.ObjectId, ref: 'Zat' },
    comuna:         { type: mongoose.Schema.Types.ObjectId, ref: 'Comuna' },
    barrio:         { type: mongoose.Schema.Types.ObjectId, ref: 'Barrio' },
    ubiCicloRuta:   { type: String },
    sentidoCardinal:{ type: String },
    tipoUbic:       { type: String },
    calzada:        { type: String },
    tipoVia:        { type: String },
    claseVia:       { type: String },
    perfilEsquema:  { type: mongoose.Schema.Types.ObjectId, ref: 'EsquemaPerfil' },
    nomenclatura:   { type: nomenclaturaSchema },

    // Medidas calzada izquierda
    anteJardinIzq: { type: Number, default: 0 },
    andenIzq:      { type: Number, default: 0 },
    zonaVerdeIzq:  { type: Number, default: 0 },
    areaServIzq:   { type: Number, default: 0 },
    sardIzqCalzA:  { type: Number, default: 0 },
    cicloRutaIzq:  { type: Number, default: 0 },
    bahiaEstIzq:   { type: Number, default: 0 },
    sardDerCalzA:  { type: Number, default: 0 },
    cunetaIzq:     { type: Number, default: 0 },
    bermaIzq:      { type: Number, default: 0 },
    calzadaIzq:    { type: Number, default: 0 },

    // Medidas calzada derecha
    anteJardinDer: { type: Number, default: 0 },
    andenDer:      { type: Number, default: 0 },
    zonaVerdeDer:  { type: Number, default: 0 },
    areaServDer:   { type: Number, default: 0 },
    sardDerCalzB:  { type: Number, default: 0 },
    cicloRutaDer:  { type: Number, default: 0 },
    bahiaEstDer:   { type: Number, default: 0 },
    sardIzqCalzB:  { type: Number, default: 0 },
    cunetaDer:     { type: Number, default: 0 },
    bermaDer:      { type: Number, default: 0 },
    calzadaDer:    { type: Number, default: 0 },

    // Medidas separador
    separadorZonaVerdeIzq: { type: Number, default: 0 },
    separadorPeatonal:     { type: Number, default: 0 },
    separadorCicloRuta:    { type: Number, default: 0 },
    separadorZonaVerdeDer: { type: Number, default: 0 },
    anchoTotalPerfil:      { type: Number, default: 0 },

    // Clasificación vial (calculada automáticamente)
    clasPorCompetencia:  { type: String },
    clasPorFuncionalidad:{ type: String },
    clasNacional:        { type: String },
    clasPrelacion:       { type: String },
    clasMunPbot:         { type: String },

    // Características
    disenioGeometrico: { type: String },
    inclinacionVia:    { type: String },
    sentidoVial:       { type: String },
    carriles:          { type: Number },
    capaRodadura:      { type: String },
    estadoVia:         { type: String },
    estadoVia2:        [{ type: String }], // selección múltiple
    condicionesVia:    { type: String },
    iluminacArtificial:{ type: Boolean },
    estadoIluminacion: { type: String },
    visibilidad:       { type: String },
    visDisminuida:     { type: String },

    // Daños como array de subdocumentos
    danos: [danoSchema],

    
    // Fotos
    fotos: [{ type: String }],

    // Observaciones (ref a ObservacionVia)
    obs1: { type: mongoose.Schema.Types.ObjectId, ref: 'ObservacionVia' },
    obs2: { type: mongoose.Schema.Types.ObjectId, ref: 'ObservacionVia' },
    obs3: { type: mongoose.Schema.Types.ObjectId, ref: 'ObservacionVia' },
    obs4: { type: mongoose.Schema.Types.ObjectId, ref: 'ObservacionVia' },
    obs5: { type: mongoose.Schema.Types.ObjectId, ref: 'ObservacionVia' },
    obs6: { type: mongoose.Schema.Types.ObjectId, ref: 'ObservacionVia' },
    notas:{ type: String },

    // Campo Access (solo importación)
    idViaTramoAccess:  { type: String },

    // Auditoría
    creadoPor:         { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fechaCreacion:     { type: Date, default: Date.now },
    modificadoPor:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fechaModificacion: { type: Date },
    logUltimaMod:      { type: String }
});

viaTramoSchema.index({ ubicacion: '2dsphere' });
module.exports = mongoose.model('ViaTramo', viaTramoSchema);