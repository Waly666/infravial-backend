const mongoose = require('mongoose');

// Dominios SINC — Propiedades de segmento (Nivel Básico)
const D_TIPOSUPERF = [
    { v: 1, l: 'Destapado' }, { v: 2, l: 'Afirmado' },
    { v: 3, l: 'Pavimento asfáltico' }, { v: 4, l: 'Tratamiento superficial' },
    { v: 5, l: 'Pavimento rígido' }, { v: 6, l: 'Placa huella' },
    { v: 7, l: 'Pavimento articulado' }, { v: 8, l: 'Otro' }
];
const D_TIPOTERR = [
    { v: 1, l: 'Escarpado' }, { v: 2, l: 'Montañoso' },
    { v: 3, l: 'Ondulado' },  { v: 4, l: 'Plano' }
];
const D_ESTADO = [
    { v: 1, l: 'Bueno' }, { v: 2, l: 'Regular' }, { v: 3, l: 'Malo' },
    { v: 4, l: 'Pésimo' }, { v: 5, l: 'Intransitable' }
];

// Propiedades de un segmento del eje (Tabla 5 — Metodología SINC v5)
const sincPropiedadesSchema = new mongoose.Schema({
    idEje:      { type: mongoose.Schema.Types.ObjectId, ref: 'SincEje', required: true },
    codigoVia:  { type: String, required: true, maxlength: 25 },   // CODIGOVIA (4–25 en validación SINC)

    abscisaIni: { type: Number },   // ABSCISAI — km inicio segmento (opcional; división de registros)
    abscisaFin: { type: Number },   // ABSCISAF — km fin segmento

    // LONGITUD — longitud verdadera del segmento (m), Tabla 5
    longitud:   { type: Number },

    // Superficie y terreno
    tipoSuperf: { type: Number },   // TIPOSUPERF 1-8
    tipoTerr:   { type: Number },   // TIPOTERR 1-4
    pendiente:  { type: Number },   // PENDIENTE  Real (-45 a 45 grados)
    estado:     { type: Number },   // ESTADO 1-5

    // Sección transversal (metros)
    numCarr:    { type: Number },   // NUMCARR — número de carriles
    ancoCarr:   { type: Number },   // ANCOCARR — ancho de carril
    anchoBer:   { type: Number },   // ANCHOBERMA — 0 si no hay; si hay: 0,4–6
    anchoCunt:  { type: Number },   // ANCHOCUNT — 0 si no hay; si hay: 0,1–4
    anchoSepar: { type: Number },   // ANCHOSEPAR — 0 si no hay; si hay: 0,1–50

    fecha:      { type: Date },     // FECHA de levantamiento (AAAA-MM-DD en campo)

    codMunicipio:    { type: Number },
    codDepartamento: { type: Number },
    municipio:       { type: String, maxlength: 25 },
    departamento:    { type: String, maxlength: 25 },

    // Geometría — LineString (tramo del eje con estas propiedades).
    // Sin default en `type`: un default aquí hacía que Mongo guardara { type: "LineString" }
    // sin `coordinates` y fallara el índice 2dsphere.
    ubicacion: {
        type:        { type: String },
        coordinates: { type: [[Number]] }
    },

    obs: { type: String, maxlength: 250 },

    creadoPor:         { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fechaCreacion:     { type: Date, default: Date.now },
    modificadoPor:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fechaModificacion: { type: Date }
});

sincPropiedadesSchema.index({ ubicacion: '2dsphere' });
sincPropiedadesSchema.index({ idEje: 1 });

const SincPropiedades = mongoose.model('SincPropiedades', sincPropiedadesSchema);
SincPropiedades.D_TIPOSUPERF = D_TIPOSUPERF;
SincPropiedades.D_TIPOTERR   = D_TIPOTERR;
SincPropiedades.D_ESTADO      = D_ESTADO;
module.exports = SincPropiedades;
