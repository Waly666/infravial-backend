/**
 * SincMc.js — 17 capas del Nivel Detallado SINC (prefijo Mc)
 * Tabla de referencia: McBerma, McCalzada, McCco, McCicloruta, McCuneta,
 * McDefensaVial, McDispositivoIts, McDrenaje, McEstacionPeaje, McEstacionPesaje,
 * McLuminaria, McMuro, McPuente, McSenalVertical, McSeparador, McTunel, McZonaServicio
 */
const mongoose = require('mongoose');
const { Schema } = mongoose;

// ── Campos base comunes ────────────────────────────────────────────────────────
const audit = {
    creadoPor:         { type: Schema.Types.ObjectId, ref: 'User' },
    fechaCreacion:     { type: Date, default: Date.now },
    modificadoPor:     { type: Schema.Types.ObjectId, ref: 'User' },
    fechaModificacion: { type: Date }
};

/** Código de poste PR (compuesto: no solo entero) */
const MC_PR_CODIGO = { type: String, maxlength: 40, trim: true };

function geoSchema(type) {
    if (type === 'Point')
        return { type: { type: String, default: 'Point' }, coordinates: { type: [Number] } };
    if (type === 'LineString')
        return { type: { type: String, default: 'LineString' }, coordinates: { type: [[Number]] } };
    // Polygon
    return { type: { type: String, default: 'Polygon' }, coordinates: { type: [[[Number]]] } };
}

/**
 * Denormalizado desde Jornada del eje (DANE + nombres).
 * McSenalVertical: divipola en lugar de codMunicipio duplicado.
 * McSeparador (Tabla 29): solo nombres de municipio/departamento desde jornada, sin codDepto/codMunicipio DANE en el documento.
 */
const MC_TERRITORIO_JORNADA = {
    codDepto:         { type: String, maxlength: 20 },
    codMunicipio:     { type: String, maxlength: 20 },
    departamentoUbic: { type: String, maxlength: 120 },
    municipioUbic:    { type: String, maxlength: 120 }
};

const MC_TERRITORIO_SOLO_NOMBRES_JORNADA = {
    departamentoUbic: MC_TERRITORIO_JORNADA.departamentoUbic,
    municipioUbic:    MC_TERRITORIO_JORNADA.municipioUbic
};

function makeModel(name, geoType, fields, domains = {}) {
    let terrExtra;
    if (name === 'SincMcSenalVertical') {
        terrExtra = {};
    } else if (name === 'SincMcSeparador') {
        terrExtra = { ...MC_TERRITORIO_SOLO_NOMBRES_JORNADA };
    } else {
        terrExtra = { ...MC_TERRITORIO_JORNADA };
    }
    const schema = new Schema({
        idEje:     { type: Schema.Types.ObjectId, ref: 'SincEje', required: true },
        idJornada: { type: Schema.Types.ObjectId, ref: 'Jornada' },
        ...terrExtra,
        ubicacion: geoSchema(geoType),
        fecha:     { type: Date },
        foto:      { type: String, maxlength: 50 },
        rutaFoto:  { type: String, maxlength: 250 },
        obs:       { type: String },
        ...fields,
        ...audit
    });
    schema.index({ ubicacion: '2dsphere' });
    schema.index({ idEje: 1 });
    const Model = mongoose.model(name, schema);
    Object.assign(Model, domains);
    return Model;
}

// ─────────────────────────────────────────────────────────────────────────────
// Dominios compartidos
const D_LADO_3 = [{ v:1, l:'Izquierda' }, { v:2, l:'Derecha' }, { v:3, l:'Ambos' }];
const D_LADO_2 = [{ v:1, l:'Izquierda' }, { v:2, l:'Derecha' }];
const D_EST_3  = [{ v:1, l:'Bueno' }, { v:2, l:'Regular' }, { v:3, l:'Malo' }];
const D_EST_4  = [{ v:1, l:'Bueno' }, { v:2, l:'Regular' }, { v:3, l:'Malo' }, { v:4, l:'Crítico' }];
const D_OP_3   = [{ v:1, l:'Operativo' }, { v:2, l:'Parcial' }, { v:3, l:'No operativo' }];

// Tabla 14 — BERMA (McBerma). Catálogos Long (Dm*) pueden sincronizarse desde Aniscopio; listas vacías = captura numérica libre.
const D_BERMA_NIVEL_TRANSITO = [
    { v: 1, l: 'Muy bajo' }, { v: 2, l: 'Bajo' }, { v: 3, l: 'Medio' }, { v: 4, l: 'Alto' }, { v: 5, l: 'Muy alto' }
];
const D_BERMA_TIPO_PAVIMENTO = [
    { v: 1, l: 'Flexible (asfalto)' }, { v: 2, l: 'Rígido (concreto)' }, { v: 3, l: 'Afirmado' }, { v: 4, l: 'Sin pavimento' }
];
// Placeholder hasta integración Aniscopio (DmUnidadFuncional, DmProyectoCarretero, DmMunicipio, DmDepartamento)
const D_BERMA_UNIDAD_FUNCIONAL = [];
const D_BERMA_PROYECTO_CARRETERO = [];
const D_BERMA_MUNICIPIO = [];
const D_BERMA_DEPARTAMENTO = [];

// ─────────────────────────────────────────────────────────────────────────────
// 1. McBerma — Línea
const SincMcBerma = makeModel('SincMcBerma', 'LineString',
    {
        idBerma:               { type: String },
        unidadFuncional:       Number,
        proyecto:              Number,
        municipio:             Number,
        departamento:          Number,
        codigoInvias:          String,
        fechaInicioOperacion:  Date,
        nivelTransito:         Number,
        tipoPavimento:         Number,
        puntoInicial:          MC_PR_CODIGO,
        distAPuntoInicial:     Number,
        puntoFinal:            MC_PR_CODIGO,
        distAPuntoFinal:       Number,
        longitud:              Number,
        areaBerma:             Number,
        anchoPromedio:         Number
    },
    {
        D_NIVEL_TRANSITO:      D_BERMA_NIVEL_TRANSITO,
        D_TIPO_PAVIMENTO:      D_BERMA_TIPO_PAVIMENTO,
        D_UNIDAD_FUNCIONAL:    D_BERMA_UNIDAD_FUNCIONAL,
        D_PROYECTO_CARRETERO:  D_BERMA_PROYECTO_CARRETERO,
        D_MUNICIPIO:           D_BERMA_MUNICIPIO,
        D_DEPARTAMENTO:        D_BERMA_DEPARTAMENTO
    }
);

// Tabla 15 — CALZADA (McCalzada)
const D_CALZADA_NIVEL_TRANSITO   = D_BERMA_NIVEL_TRANSITO;
const D_CALZADA_TIPO_PAVIMENTO   = D_BERMA_TIPO_PAVIMENTO;
const D_CALZADA_UNIDAD_FUNCIONAL = D_BERMA_UNIDAD_FUNCIONAL;
const D_CALZADA_PROYECTO_CARRETERO = D_BERMA_PROYECTO_CARRETERO;
const D_CALZADA_MUNICIPIO        = D_BERMA_MUNICIPIO;
const D_CALZADA_DEPARTAMENTO     = D_BERMA_DEPARTAMENTO;
// Tabla 56 — DmTipoSubrasante
const D_CALZADA_TIPO_SUBRASANTE = [
    { v: 1, l: 'Natural' },
    { v: 2, l: 'Estabilizado' },
    { v: 3, l: 'Terraplen' }
];
// Tabla 39 — DmMaterialSubrasante
const D_CALZADA_MATERIAL_SUBRASANTE = [
    { v: 1, l: 'A-1' }, { v: 2, l: 'A-2' }, { v: 3, l: 'A-2-4' },
    { v: 4, l: 'A-2-5' }, { v: 5, l: 'A-3' }, { v: 6, l: 'A-2-6' },
    { v: 7, l: 'A-2-7' }, { v: 8, l: 'A-4' }, { v: 9, l: 'A-5' },
    { v: 10, l: 'A-6' }, { v: 11, l: 'A-7' }
];

// Tabla 38 — DmMaterialEstructPav (material de estructura de pavimento; captura en IdEstructuraPavimento McCalzada / McCicloruta)
const D_MATERIAL_ESTRUCT_PAV = [
    { v: 1, l: 'MP 25' }, { v: 2, l: 'MP 19' }, { v: 3, l: 'MP 12' },
    { v: 4, l: 'CLASE A' }, { v: 5, l: 'CLASE B' }, { v: 6, l: 'CLASE C' },
    { v: 7, l: 'A-38' }, { v: 8, l: 'A-25' },
    { v: 9, l: 'SBEMAN 50' }, { v: 10, l: 'SBEMAN 38' }, { v: 11, l: 'BG-40' },
    { v: 12, l: 'BG-27' }, { v: 13, l: 'BG-38' }, { v: 14, l: 'BG-25' },
    { v: 15, l: 'SBG-50' }, { v: 16, l: 'SBG-38' },
    { v: 17, l: 'BEE-38' }, { v: 18, l: 'BEE-25' }, { v: 19, l: 'BEE-5' },
    { v: 20, l: 'BEMAN 25' }, { v: 21, l: 'BEMAN 38' },
    { v: 22, l: 'Clase 1' }, { v: 23, l: 'Clase 2' }, { v: 24, l: 'Clase 3' }, { v: 25, l: 'Clase 4' },
    { v: 26, l: 'MGTC-50' }, { v: 27, l: 'MGTC-38' }, { v: 28, l: 'MGTC-25' },
    { v: 29, l: 'A-1' }, { v: 30, l: 'A-2' }, { v: 31, l: 'A-2-4' }, { v: 32, l: 'A-2-5' }, { v: 33, l: 'A-3' },
    { v: 34, l: 'A-2-6' }, { v: 35, l: 'A-2-7' }, { v: 36, l: 'A-4' },
    { v: 37, l: 'A-5' }, { v: 38, l: 'A-6' }, { v: 39, l: 'A-7' },
    { v: 40, l: 'TSD 25' }, { v: 41, l: 'TSD 19' }, { v: 42, l: 'TSD 13' }, { v: 43, l: 'TSD 10' }
];

// 2. McCalzada — Polígono
const SincMcCalzada = makeModel('SincMcCalzada', 'Polygon',
    {
        idCalzada:                { type: String },
        unidadFuncional:          Number,
        proyecto:                 Number,
        municipio:                Number,
        departamento:             Number,
        codigoInvias:             String,
        fechaInicioOperacion:     Date,
        nivelTransito:            Number,
        tipoPavimento:            Number,
        idEstructuraPavimento:    Number,
        puntoInicial:             MC_PR_CODIGO,
        distAPuntoInicial:        Number,
        puntoFinal:               MC_PR_CODIGO,
        distAPuntoFinal:          Number,
        longitud:                 Number,
        areaCalzada:              Number,
        anchoPromedio:            Number,
        tipoSubrasante:           Number,
        materialSubrasante:       Number,
        espesorSubrasante:        Number
    },
    {
        D_NIVEL_TRANSITO:       D_CALZADA_NIVEL_TRANSITO,
        D_TIPO_PAVIMENTO:       D_CALZADA_TIPO_PAVIMENTO,
        D_TIPO_SUBRASANTE:      D_CALZADA_TIPO_SUBRASANTE,
        D_MATERIAL_SUBRASANTE:  D_CALZADA_MATERIAL_SUBRASANTE,
        D_MATERIAL_ESTRUCT_PAV: D_MATERIAL_ESTRUCT_PAV,
        D_UNIDAD_FUNCIONAL:     D_CALZADA_UNIDAD_FUNCIONAL,
        D_PROYECTO_CARRETERO:   D_CALZADA_PROYECTO_CARRETERO,
        D_MUNICIPIO:            D_CALZADA_MUNICIPIO,
        D_DEPARTAMENTO:         D_CALZADA_DEPARTAMENTO
    }
);

// Tabla 16 — CCO (McCco). DmEstado: estados operacionales del CCO.
const D_CCO_UNIDAD_FUNCIONAL     = D_BERMA_UNIDAD_FUNCIONAL;
const D_CCO_PROYECTO_CARRETERO   = D_BERMA_PROYECTO_CARRETERO;
const D_CCO_MUNICIPIO            = D_BERMA_MUNICIPIO;
const D_CCO_DEPARTAMENTO       = D_BERMA_DEPARTAMENTO;

// 3. McCco — Polígono (Centro de Control de Operaciones)
const SincMcCco = makeModel('SincMcCco', 'Polygon',
    {
        idCco:                 { type: String },
        unidadFuncional:       Number,
        proyecto:              Number,
        municipio:             Number,
        departamento:          Number,
        codigoInvias:          String,
        fechaInicioOperacion:  Date,
        puntoInicial:          MC_PR_CODIGO,
        distAPuntoInicial:     Number,
        puntoFinal:            MC_PR_CODIGO,
        distAPuntoFinal:       Number,
        longitud:              Number,
        areaCco:               Number,
        anchoPromedio:         Number,
        estado:                Number
    },
    {
        D_ESTADO:             D_OP_3,
        D_UNIDAD_FUNCIONAL:   D_CCO_UNIDAD_FUNCIONAL,
        D_PROYECTO_CARRETERO: D_CCO_PROYECTO_CARRETERO,
        D_MUNICIPIO:          D_CCO_MUNICIPIO,
        D_DEPARTAMENTO:       D_CCO_DEPARTAMENTO
    }
);

// Tabla 17 — CICLORUTA (McCicloruta). DmEstado: estado del elemento (conservación).
const D_CICLO_UNIDAD_FUNCIONAL = D_CALZADA_UNIDAD_FUNCIONAL;
const D_CICLO_PROYECTO_CARRETERO = D_CALZADA_PROYECTO_CARRETERO;
const D_CICLO_MUNICIPIO = D_CALZADA_MUNICIPIO;
const D_CICLO_DEPARTAMENTO = D_CALZADA_DEPARTAMENTO;
const D_CICLO_TIPO_PAVIMENTO = D_CALZADA_TIPO_PAVIMENTO;
const D_CICLO_TIPO_SUBRASANTE = D_CALZADA_TIPO_SUBRASANTE;
const D_CICLO_MATERIAL_SUBRASANTE = D_CALZADA_MATERIAL_SUBRASANTE;

// 4. McCicloruta — Polígono
const SincMcCicloruta = makeModel('SincMcCicloruta', 'Polygon',
    {
        idCicloruta:              { type: String },
        unidadFuncional:          Number,
        proyecto:                 Number,
        municipio:                Number,
        departamento:             Number,
        codigoInvias:             String,
        fechaInicioOperacion:     Date,
        tipoPavimento:            Number,
        idEstructuraPavimento:    Number,
        puntoInicial:             MC_PR_CODIGO,
        distAPuntoInicial:        Number,
        puntoFinal:               MC_PR_CODIGO,
        distAPuntoFinal:          Number,
        longitud:                 Number,
        areaCicloruta:            Number,
        anchoPromedio:            Number,
        tipoSubrasante:           Number,
        materialSubrasante:       Number,
        espesorSubrasante:        Number,
        estado:                   Number
    },
    {
        D_TIPO_PAVIMENTO:       D_CICLO_TIPO_PAVIMENTO,
        D_TIPO_SUBRASANTE:      D_CICLO_TIPO_SUBRASANTE,
        D_MATERIAL_SUBRASANTE:  D_CICLO_MATERIAL_SUBRASANTE,
        D_MATERIAL_ESTRUCT_PAV: D_MATERIAL_ESTRUCT_PAV,
        D_ESTADO:               D_EST_3,
        D_UNIDAD_FUNCIONAL:     D_CICLO_UNIDAD_FUNCIONAL,
        D_PROYECTO_CARRETERO:   D_CICLO_PROYECTO_CARRETERO,
        D_MUNICIPIO:            D_CICLO_MUNICIPIO,
        D_DEPARTAMENTO:         D_CICLO_DEPARTAMENTO
    }
);

// Tabla 18 — CUNETA (McCuneta). DmSección: forma de sección; DmMaterial; DmEstado.
const D_CUNETA_UNIDAD_FUNCIONAL = D_BERMA_UNIDAD_FUNCIONAL;
const D_CUNETA_PROYECTO_CARRETERO = D_BERMA_PROYECTO_CARRETERO;
const D_CUNETA_MUNICIPIO = D_BERMA_MUNICIPIO;
const D_CUNETA_DEPARTAMENTO = D_BERMA_DEPARTAMENTO;
const D_CUNETA_SECCION = [
    { v: 1, l: 'Triangular' }, { v: 2, l: 'Trapezoidal' }, { v: 3, l: 'Rectangular' }, { v: 4, l: 'Sin revestimiento' }
];
const D_CUNETA_MATERIAL = [
    { v: 1, l: 'Concreto' }, { v: 2, l: 'Piedra' }, { v: 3, l: 'Sin revestir' }
];
const D_CUNETA_ESTADO = [
    { v: 1, l: 'Bueno' }, { v: 2, l: 'Regular' }, { v: 3, l: 'Malo' }, { v: 4, l: 'Obstruida' }
];

// 5. McCuneta — Línea
const SincMcCuneta = makeModel('SincMcCuneta', 'LineString',
    {
        idCuneta:               { type: String },
        unidadFuncional:        Number,
        proyecto:               Number,
        municipio:              Number,
        departamento:           Number,
        codigoInvias:           String,
        fechaInicioOperacion:   Date,
        puntoInicial:           MC_PR_CODIGO,
        distAPuntoInicial:      Number,
        puntoFinal:             MC_PR_CODIGO,
        distAPuntoFinal:        Number,
        longitud:               Number,
        seccion:                Number,
        material:               Number,
        areaSeccion:            Number,
        porcPromSecObstruida:   Number,
        porcAceptacion:         Number,
        estado:                 Number
    },
    {
        D_SECCION:            D_CUNETA_SECCION,
        D_MATERIAL:           D_CUNETA_MATERIAL,
        D_ESTADO:             D_CUNETA_ESTADO,
        D_UNIDAD_FUNCIONAL:   D_CUNETA_UNIDAD_FUNCIONAL,
        D_PROYECTO_CARRETERO: D_CUNETA_PROYECTO_CARRETERO,
        D_MUNICIPIO:          D_CUNETA_MUNICIPIO,
        D_DEPARTAMENTO:       D_CUNETA_DEPARTAMENTO
    }
);

// 6. McDefensaVial — Línea (Tabla 19 — DEFENSA VIAL, Metodología SINC v5)
const D_DEFENSA_UNIDAD_FUNCIONAL    = D_BERMA_UNIDAD_FUNCIONAL;
const D_DEFENSA_PROYECTO_CARRETERO  = D_BERMA_PROYECTO_CARRETERO;
const D_DEFENSA_MUNICIPIO           = D_BERMA_MUNICIPIO;
const D_DEFENSA_DEPARTAMENTO        = D_BERMA_DEPARTAMENTO;
// DmMaterial (misma escala que cuneta / sección transversal)
const D_DEFENSA_MATERIAL = D_CUNETA_MATERIAL;
// DmEstado operación del elemento
const D_DEFENSA_ESTADO = D_EST_3;
// DmPintura
const D_DEFENSA_PINTURA = [
    { v: 1, l: 'Sí' },
    { v: 2, l: 'No' }
];

const SincMcDefensaVial = makeModel('SincMcDefensaVial', 'LineString',
    {
        idDefensaVial:          { type: String },
        unidadFuncional:        Number,
        proyecto:               Number,
        municipio:              Number,
        departamento:           Number,
        codigoInvias:           String,
        fechaInicioOperacion:   Date,
        puntoInicial:           MC_PR_CODIGO,
        distAPuntoInicial:      Number,
        puntoFinal:             MC_PR_CODIGO,
        distAPuntoFinal:        Number,
        estado:                 Number,
        numCaptafaro:           Number,
        numModulos:             Number,
        numPostes:              Number,
        numSeparadores:         Number,
        numTerminales:          Number,
        pintura:                Number,
        longitud:               Number,
        material:               Number
    },
    {
        D_UNIDAD_FUNCIONAL:   D_DEFENSA_UNIDAD_FUNCIONAL,
        D_PROYECTO_CARRETERO: D_DEFENSA_PROYECTO_CARRETERO,
        D_MUNICIPIO:          D_DEFENSA_MUNICIPIO,
        D_DEPARTAMENTO:       D_DEFENSA_DEPARTAMENTO,
        D_ESTADO:             D_DEFENSA_ESTADO,
        D_MATERIAL:           D_DEFENSA_MATERIAL,
        D_PINTURA:            D_DEFENSA_PINTURA
    }
);

// Tabla 14 — DISPOSITIVOS ITS (McDispositivoIts), geometría punto
const D_ITS_UNIDAD_FUNCIONAL   = D_BERMA_UNIDAD_FUNCIONAL;
const D_ITS_PROYECTO_CARRETERO = D_BERMA_PROYECTO_CARRETERO;
const D_ITS_MUNICIPIO          = D_BERMA_MUNICIPIO;
const D_ITS_DEPARTAMENTO       = D_BERMA_DEPARTAMENTO;
const D_ITS_TIENE_SI_NO = [
    { v: 1, l: 'Sí' },
    { v: 2, l: 'No' }
];
// DmTipoDispositivoITS (Tabla 49 / manual SINC — ampliado; valores numéricos alineados al formulario)
const D_ITS_TIPO_DISPOSITIVO = [
    { v: 1, l: 'Cámara CCTV' },
    { v: 2, l: 'Panel VMS' },
    { v: 3, l: 'Sensor de tráfico' },
    { v: 4, l: 'Pesaje dinámico (WIM)' },
    { v: 5, l: 'Estación meteorológica' },
    { v: 6, l: 'Gálibo electrónico' },
    { v: 7, l: 'ITS en peaje' },
    { v: 8, l: 'Poste SOS / emergencia' },
    { v: 9, l: 'Contador o clasificador' },
    { v: 10, l: 'Radar / detección' },
    { v: 11, l: 'Iluminación inteligente' },
    { v: 12, l: 'Otro' }
];
const D_ITS_ESTADO_DISPOSITIVO = [
    { v: 1, l: 'Operativo' },
    { v: 2, l: 'Operación restringida' },
    { v: 3, l: 'Fuera de servicio' },
    { v: 4, l: 'En instalación' }
];
// DmProtocoloComunicacion (Long — lista base hasta integración Aniscopio)
const D_ITS_PROTOCOLO_COMUNICACION = [
    { v: 1, l: 'ONVIF' },
    { v: 2, l: 'HTTP / HTTPS' },
    { v: 3, l: 'FTP / SFTP' },
    { v: 4, l: 'TCP/IP genérico' },
    { v: 5, l: 'Modbus' },
    { v: 6, l: 'SNMP' },
    { v: 7, l: 'MQTT' },
    { v: 8, l: 'IEC 60870 / 61850' },
    { v: 9, l: 'Otro' }
];
// DmTipoSuministroEnergetico
const D_ITS_TIPO_SUMINISTRO = [
    { v: 1, l: 'Red eléctrica pública' },
    { v: 2, l: 'Panel solar' },
    { v: 3, l: 'Generador' },
    { v: 4, l: 'Baterías / UPS' },
    { v: 5, l: 'Mixto' },
    { v: 6, l: 'Otro' }
];
// DmMedioTransmision (Long)
const D_ITS_MEDIO_TRANSMISION = [
    { v: 1, l: 'Fibra óptica' },
    { v: 2, l: 'Cobre / par trenzado' },
    { v: 3, l: 'Radioenlace' },
    { v: 4, l: 'GSM / UMTS / LTE' },
    { v: 5, l: 'Wi-Fi' },
    { v: 6, l: 'Satélite' },
    { v: 7, l: 'Híbrido' },
    { v: 8, l: 'Otro' }
];
// DmSentidoTrafico
const D_ITS_SENTIDO_TRAFICO = [
    { v: 1, l: 'De A a B' },
    { v: 2, l: 'De B a A' },
    { v: 3, l: 'Ambos sentidos' },
    { v: 4, l: 'No determina' }
];

// 7. McDispositivoIts — Punto
const SincMcDispositivoIts = makeModel('SincMcDispositivoIts', 'Point',
    {
        idDispositivo:          { type: String },
        unidadFuncional:        Number,
        proyecto:               Number,
        municipio:              Number,
        departamento:           Number,
        codigoInvias:           String,
        fechaInicioOperacion:   Date,
        tieneIPv6:              Number,
        punto:                  MC_PR_CODIGO,
        distanciaAlPunto:       Number,
        idPeaje:                Number,
        peaje:                  String,
        tienePagoElectronico:   Number,
        nombre:                 Number,
        tipo:                   Number,
        estado:                 Number,
        protocoloComunicacion:  Number,
        tipoSuministroEnergetico: Number,
        medioTransmision:       Number,
        sentidoTrafico:         Number,
        estadoGeneral:          Number
    },
    {
        D_UNIDAD_FUNCIONAL:        D_ITS_UNIDAD_FUNCIONAL,
        D_PROYECTO_CARRETERO:      D_ITS_PROYECTO_CARRETERO,
        D_MUNICIPIO:               D_ITS_MUNICIPIO,
        D_DEPARTAMENTO:            D_ITS_DEPARTAMENTO,
        D_TIENE_IPV6:              D_ITS_TIENE_SI_NO,
        D_TIENE_PAGO_ELECTRONICO:  D_ITS_TIENE_SI_NO,
        D_TIPO:                    D_ITS_TIPO_DISPOSITIVO,
        D_ESTADO:                  D_ITS_ESTADO_DISPOSITIVO,
        D_PROTOCOLO_COMUNICACION:  D_ITS_PROTOCOLO_COMUNICACION,
        D_TIPO_SUMINISTRO:         D_ITS_TIPO_SUMINISTRO,
        D_MEDIO_TRANSMISION:       D_ITS_MEDIO_TRANSMISION,
        D_SENTIDO_TRAFICO:         D_ITS_SENTIDO_TRAFICO,
        D_ESTADO_GENERAL:          D_EST_3
    }
);

// Tabla 21 — DRENAJE (McDrenaje), geometría línea PR–PR
const D_DRENAJE_UNIDAD_FUNCIONAL   = D_BERMA_UNIDAD_FUNCIONAL;
const D_DRENAJE_PROYECTO_CARRETERO = D_BERMA_PROYECTO_CARRETERO;
const D_DRENAJE_MUNICIPIO          = D_BERMA_MUNICIPIO;
const D_DRENAJE_DEPARTAMENTO       = D_BERMA_DEPARTAMENTO;
const D_DRENAJE_TIPO = [
    { v: 1, l: 'Alcantarilla circular' }, { v: 2, l: 'Alcantarilla cajón' }, { v: 3, l: 'Box culvert' },
    { v: 4, l: 'Baden' }, { v: 5, l: 'Cuneta revestida' }, { v: 6, l: 'Canal' }, { v: 7, l: 'Zanja' },
    { v: 8, l: 'Tubería' }, { v: 9, l: 'Tubería perforada' }, { v: 10, l: 'Sumidero / trampa' }, { v: 11, l: 'Otro' }
];

// 8. McDrenaje — Línea (Tabla 21)
const SincMcDrenaje = makeModel('SincMcDrenaje', 'LineString',
    {
        idDrenaje:              { type: String },
        unidadFuncional:        Number,
        proyecto:               Number,
        municipio:              Number,
        departamento:           Number,
        codigoInvias:           String,
        fechaInicioOperacion:   Date,
        puntoInicial:           MC_PR_CODIGO,
        distAPuntoInicial:      Number,
        puntoFinal:             MC_PR_CODIGO,
        distAPuntoFinal:        Number,
        longitud:               Number,
        ancho:                  Number,
        diametro:               Number,
        areaDrenaje:            Number,
        tipoDrenaje:            Number,
        material:               Number,
        areaSeccion:            Number,
        porcPromSecObstruida:   Number,
        porcAceptacion:         Number
    },
    {
        D_TIPO_DRENAJE:       D_DRENAJE_TIPO,
        D_MATERIAL:           D_CUNETA_MATERIAL,
        D_UNIDAD_FUNCIONAL:   D_DRENAJE_UNIDAD_FUNCIONAL,
        D_PROYECTO_CARRETERO: D_DRENAJE_PROYECTO_CARRETERO,
        D_MUNICIPIO:          D_DRENAJE_MUNICIPIO,
        D_DEPARTAMENTO:       D_DRENAJE_DEPARTAMENTO
    }
);

// Tablas 22–23 — estaciones (polígono, PR–PR)
const D_PEAJE_UNIDAD = D_BERMA_UNIDAD_FUNCIONAL;
const D_PEAJE_PROY   = D_BERMA_PROYECTO_CARRETERO;
const D_PEAJE_MUN    = D_BERMA_MUNICIPIO;
const D_PEAJE_DEP    = D_BERMA_DEPARTAMENTO;

// 9. McEstacionPeaje — Polígono (Tabla 22)
const SincMcEstacionPeaje = makeModel('SincMcEstacionPeaje', 'Polygon',
    {
        idPeaje:                { type: String },
        unidadFuncional:        Number,
        proyecto:               Number,
        municipio:              Number,
        departamento:           Number,
        codigoInvias:           String,
        fechaInicioOperacion:   Date,
        puntoInicial:           MC_PR_CODIGO,
        distAPuntoInicial:      Number,
        puntoFinal:             MC_PR_CODIGO,
        distAPuntoFinal:        Number,
        fechaInstalacion:       Date,
        longitud:               Number,
        areaPeaje:              Number,
        anchoPromedio:          Number,
        numEstacionPago:        Number
    },
    {
        D_UNIDAD_FUNCIONAL:   D_PEAJE_UNIDAD,
        D_PROYECTO_CARRETERO: D_PEAJE_PROY,
        D_MUNICIPIO:          D_PEAJE_MUN,
        D_DEPARTAMENTO:       D_PEAJE_DEP
    }
);

// 10. McEstacionPesaje — Polígono (Tabla 23)
const SincMcEstacionPesaje = makeModel('SincMcEstacionPesaje', 'Polygon',
    {
        idEstacionPesaje:       { type: String },
        unidadFuncional:        Number,
        proyecto:               Number,
        municipio:              Number,
        departamento:           Number,
        codigoInvias:           String,
        fechaInicioOperacion:   Date,
        puntoInicial:           MC_PR_CODIGO,
        distAPuntoInicial:      Number,
        puntoFinal:             MC_PR_CODIGO,
        distAPuntoFinal:        Number,
        longitud:               Number,
        areaEstacionPesaje:     Number,
        anchoPromedio:          Number,
        estado:                 Number
    },
    {
        D_UNIDAD_FUNCIONAL:   D_PEAJE_UNIDAD,
        D_PROYECTO_CARRETERO: D_PEAJE_PROY,
        D_MUNICIPIO:          D_PEAJE_MUN,
        D_DEPARTAMENTO:       D_PEAJE_DEP,
        D_ESTADO:             D_EST_3
    }
);

// Tabla 25 — LUMINARIA (punto)
const D_LUM_UNIDAD = D_BERMA_UNIDAD_FUNCIONAL;
const D_LUM_MUN    = D_BERMA_MUNICIPIO;
const D_LUM_DEP    = D_BERMA_DEPARTAMENTO;

// 11. McLuminaria — Punto
const SincMcLuminaria = makeModel('SincMcLuminaria', 'Point',
    {
        idLuminaria:            { type: String },
        unidadFuncional:        Number,
        proyecto:               String,
        municipio:              Number,
        departamento:           Number,
        codigoInvias:           String,
        fechaInicioOperacion:   Date,
        punto:                  MC_PR_CODIGO,
        distAPunto:             Number
    },
    {
        D_UNIDAD_FUNCIONAL: D_LUM_UNIDAD,
        D_MUNICIPIO:        D_LUM_MUN,
        D_DEPARTAMENTO:     D_LUM_DEP
    }
);

// Tabla 26 — MURO (línea)
const D_MURO_TIPO = [
    { v: 1, l: 'Gravedad' }, { v: 2, l: 'Voladizo' }, { v: 3, l: 'Contrafuertes' },
    { v: 4, l: 'Suelo reforzado' }, { v: 5, l: 'Gaviones' }, { v: 6, l: 'Neumáticos' }, { v: 7, l: 'Otro' }
];

// 12. McMuro — Línea
const SincMcMuro = makeModel('SincMcMuro', 'LineString',
    {
        idMuro:                 { type: String },
        unidadFuncional:        Number,
        proyecto:               Number,
        municipio:              Number,
        departamento:           Number,
        codigoInvias:           String,
        fechaInicioOperacion:   Date,
        puntoInicial:           MC_PR_CODIGO,
        distAPuntoInicial:      Number,
        puntoFinal:             MC_PR_CODIGO,
        distAPuntoFinal:        Number,
        longitud:               Number,
        altura:                 Number,
        tipoMuro:               Number,
        estadoMaterial:         Number
    },
    {
        D_TIPO_MURO:          D_MURO_TIPO,
        D_ESTADO_MATERIAL:    D_EST_3,
        D_UNIDAD_FUNCIONAL:   D_BERMA_UNIDAD_FUNCIONAL,
        D_PROYECTO_CARRETERO: D_BERMA_PROYECTO_CARRETERO,
        D_MUNICIPIO:          D_BERMA_MUNICIPIO,
        D_DEPARTAMENTO:       D_BERMA_DEPARTAMENTO
    }
);

// Tabla 27 — PUENTE (polígono)
const D_PUENTE_TIPO_ESTRUCTURA = [
    { v: 1, l: 'Viga' }, { v: 2, l: 'Arco' }, { v: 3, l: 'Colgante' }, { v: 4, l: 'Atirantado' },
    { v: 5, l: 'Losa' }, { v: 6, l: 'Cercha' }, { v: 7, l: 'Otro' }
];

// 13. McPuente — Polígono
const SincMcPuente = makeModel('SincMcPuente', 'Polygon',
    {
        idPuente:               { type: String },
        unidadFuncional:        Number,
        proyecto:               Number,
        municipio:              Number,
        departamento:           Number,
        codigoInvias:           String,
        fechaInicioOperacion:   Date,
        nombre:                 String,
        tipoEstructura:         Number,
        nivelTransito:          Number,
        puntoInicial:           MC_PR_CODIGO,
        distAPuntoInicial:      Number,
        puntoFinal:             MC_PR_CODIGO,
        distAPuntoFinal:        Number,
        longitud:               Number,
        areaPuente:             Number,
        anchoPromedio:          Number,
        numeroLuces:            Number,
        luzMenor:               Number,
        longitudTotal:          Number,
        luzMayor:               Number,
        anchoTablero:           Number,
        galibo:                 Number
    },
    {
        D_TIPO_ESTRUCTURA:    D_PUENTE_TIPO_ESTRUCTURA,
        D_NIVEL_TRANSITO:     D_BERMA_NIVEL_TRANSITO,
        D_UNIDAD_FUNCIONAL:   D_BERMA_UNIDAD_FUNCIONAL,
        D_PROYECTO_CARRETERO: D_BERMA_PROYECTO_CARRETERO,
        D_MUNICIPIO:          D_BERMA_MUNICIPIO,
        D_DEPARTAMENTO:       D_BERMA_DEPARTAMENTO
    }
);

// Tabla 28 — SEÑAL VERTICAL (punto). Dominios Dm* como texto (campo String guarda la etiqueta `l`).
// Tipo_Señal (Dm_TipoSenalVertical) se surte desde catálogo SenVert en frontend; aquí vacío.
// Departamento / Divipola (Dm_Departamento, Dm_Municipio): catálogos extensos DANE — vacío; captura libre o integración futura.
// Resto: valores alineados a metodología SINC v5 / formulario existencias señales verticales (contrastar con PDF oficial).
const D_SENAL_V_CLASE_SENAL = [
    { v: 1, l: 'Reglamentaria' },
    { v: 2, l: 'Informativa' },
    { v: 3, l: 'Transitoria' },
    { v: 4, l: 'Obra' }
];
const D_SENAL_V_TIPO_SENAL_VERTICAL = [];
const D_SENAL_V_LADO_SENAL = [
    { v: 1, l: 'Izquierda' },
    { v: 2, l: 'Derecha' },
    { v: 3, l: 'Sobre la calzada' },
    { v: 4, l: 'En el separador' }
];
const D_SENAL_V_FORMA_SENAL = [
    { v: 1, l: 'Circular' },
    { v: 2, l: 'Octogonal' },
    { v: 3, l: 'Rectangular' },
    { v: 4, l: 'Cuadrangular' },
    { v: 5, l: 'Romboidal' },
    { v: 6, l: 'Triangular' },
    { v: 7, l: 'Casa' },
    { v: 8, l: 'Cruz' },
    { v: 9, l: 'Escudo' },
    { v: 10, l: 'Combinación' }
];
const D_SENAL_V_ESTADO_SENAL = [
    { v: 1, l: 'Bueno' },
    { v: 2, l: 'Regular' },
    { v: 3, l: 'Malo' }
];
const D_SENAL_V_UBICA_SENAL = [
    { v: 1, l: 'A nivel' },
    { v: 2, l: 'Elevada' }
];
const D_SENAL_V_FASE_SENAL = [
    { v: 1, l: 'Inventario' },
    { v: 2, l: 'Programación' },
    { v: 3, l: 'Diseño' },
    { v: 4, l: 'Por definir' }
];
const D_SENAL_V_SOPORTE_SENAL = [
    { v: 1, l: 'Pórtico' },
    { v: 2, l: 'Poste en ángulo de hierro' },
    { v: 3, l: 'Tubo galvanizado' },
    { v: 4, l: 'Adherido a superficie' },
    { v: 5, l: 'Otro' },
    { v: 6, l: 'Postes de semáforo' },
    { v: 7, l: 'Ménsula corta de semáforo' },
    { v: 8, l: 'Ménsula larga sujeta a poste lateral de semáforo' },
    { v: 9, l: 'Cable de suspensión de semáforo' },
    { v: 10, l: 'Pórtico de semáforo' },
    { v: 11, l: 'Postes y pedestales en islas de semáforo' }
];
const D_SENAL_V_ESTADO_SOPORTE = [
    { v: 1, l: 'Bueno' },
    { v: 2, l: 'Regular' },
    { v: 3, l: 'Malo' }
];
const D_SENAL_V_MATERIAL_PLACA = [
    { v: 1, l: 'Poliéster reforzado' },
    { v: 2, l: 'Acero galvanizado' },
    { v: 3, l: 'Aluminio' },
    { v: 4, l: 'Material flexible' },
    { v: 5, l: 'Otro' }
];
const D_SENAL_V_LAMINA_REFLECTANTE = [
    { v: 1, l: 'Sí' },
    { v: 2, l: 'No' },
    { v: 3, l: 'N/A' }
];
const D_SENAL_V_ACCION_SENAL = [
    { v: 1, l: 'Mantenimiento' },
    { v: 2, l: 'Cambio' },
    { v: 3, l: 'Reubicación' },
    { v: 4, l: 'Retiro' },
    { v: 5, l: 'Reposición' },
    { v: 6, l: 'Reinstalación' },
    { v: 7, l: 'Ninguno' },
    { v: 8, l: 'Mantenimiento y reubicación' },
    { v: 9, l: 'Para definir' },
    { v: 10, l: 'Otro' }
];
const D_SENAL_V_DEPARTAMENTO = [];
const D_SENAL_V_DIVIPOLA = [];
const D_SENAL_V_CLASE_VIA = [
    { v: 1, l: 'Nacional' },
    { v: 2, l: 'Departamental' },
    { v: 3, l: 'Regional' },
    { v: 4, l: 'Municipal' },
    { v: 5, l: 'Autopista / concesión' },
    { v: 6, l: 'Vía urbana principal' },
    { v: 7, l: 'Otro' }
];
const D_SENAL_V_CALZADA = [
    { v: 1, l: 'Calzada sentido A-B de la vía' },
    { v: 2, l: 'Calzada sentido B-A de la vía' },
    { v: 3, l: 'Calzada única' }
];
const D_SENAL_V_SENTIDO = [
    { v: 1, l: 'A-B' },
    { v: 2, l: 'B-A' },
    { v: 3, l: 'Doble sentido' },
    { v: 4, l: 'No aplica' }
];
const D_SENAL_V_TIPO_SUPERF = [
    { v: 1, l: 'Destapado' },
    { v: 2, l: 'Afirmado' },
    { v: 3, l: 'Pavimento asfáltico' },
    { v: 4, l: 'Tratamiento superficial' },
    { v: 5, l: 'Pavimento rígido' },
    { v: 6, l: 'Placa huella' },
    { v: 7, l: 'Pavimento articulado' },
    { v: 8, l: 'Otro' }
];

// 14. McSenalVertical — Punto
const SincMcSenalVertical = makeModel('SincMcSenalVertical', 'Point',
    {
        idSenalVertical:    { type: String },
        ansvId:             { type: String, maxlength: 80 },
        codigoInterno:      { type: String, maxlength: 80 },
        idSenal:            Number,
        claseSenal:         { type: String, maxlength: 120 },
        tipoSenal:          { type: String, maxlength: 250 },
        velSenal:           Number,
        ladoSenal:          { type: String, maxlength: 120 },
        formaSenal:         { type: String, maxlength: 120 },
        estadoSenal:        { type: String, maxlength: 120 },
        ubicaSenal:         { type: String, maxlength: 120 },
        dimSenal:           { type: String, maxlength: 80 },
        faseSenal:          { type: String, maxlength: 120 },
        soporteSenal:       { type: String, maxlength: 120 },
        estadoSoporte:      { type: String, maxlength: 120 },
        materialPlaca:      { type: String, maxlength: 120 },
        laminaRefectante:   { type: String, maxlength: 120 },
        fecInstal:          Date,
        accionSenal:        { type: String, maxlength: 120 },
        fecAccion:          Date,
        codPr:              MC_PR_CODIGO,
        abscisaPr:          Number,
        entidadTerr:        { type: String, maxlength: 120 },
        /** Códigos y nombres territoriales (sincronizados con Jornada del eje al guardar). Divipola = código municipio DANE (mismo dato que codMunicipio en jornada; no se duplica en otro campo). */
        codDepto:           { type: String, maxlength: 20 },
        departamentoUbic:   { type: String, maxlength: 120 },
        municipioUbic:      { type: String, maxlength: 120 },
        divipola:           { type: String, maxlength: 20 },
        codVia:             { type: String, maxlength: 40 },
        respVia:            { type: String, maxlength: 120 },
        nomVial:            { type: String, maxlength: 200 },
        claseVia:           { type: String, maxlength: 120 },
        calzada:            { type: String, maxlength: 120 },
        carriles:           Number,
        sentido:            { type: String, maxlength: 120 },
        nomSectorVia:       { type: String, maxlength: 200 },
        tipoSup:            { type: String, maxlength: 120 }
    },
    {
        D_CLASE_SENAL:            D_SENAL_V_CLASE_SENAL,
        D_TIPO_SENAL_VERTICAL:    D_SENAL_V_TIPO_SENAL_VERTICAL,
        D_LADO_SENAL:             D_SENAL_V_LADO_SENAL,
        D_FORMA_SENAL:            D_SENAL_V_FORMA_SENAL,
        D_ESTADO_SENAL:           D_SENAL_V_ESTADO_SENAL,
        D_UBICA_SENAL:            D_SENAL_V_UBICA_SENAL,
        D_FASE_SENAL:             D_SENAL_V_FASE_SENAL,
        D_SOPORTE_SENAL:          D_SENAL_V_SOPORTE_SENAL,
        D_ESTADO_SOPORTE:         D_SENAL_V_ESTADO_SOPORTE,
        D_MATERIAL_PLACA:         D_SENAL_V_MATERIAL_PLACA,
        D_LAMINA_REFLECTANTE:     D_SENAL_V_LAMINA_REFLECTANTE,
        D_ACCION_SENAL:           D_SENAL_V_ACCION_SENAL,
        D_DEPARTAMENTO:           D_SENAL_V_DEPARTAMENTO,
        D_DIVIPOLA:               D_SENAL_V_DIVIPOLA,
        D_CLASE_VIA:              D_SENAL_V_CLASE_VIA,
        D_CALZADA:                D_SENAL_V_CALZADA,
        D_SENTIDO:                D_SENAL_V_SENTIDO,
        D_TIPO_SUPERF:            D_SENAL_V_TIPO_SUPERF
    }
);

// 15. McSeparador — Polígono (Tabla 29)
const SincMcSeparador = makeModel('SincMcSeparador', 'Polygon',
    {
        idSeparador:            { type: String },
        unidadFuncional:        Number,
        proyecto:               Number,
        municipio:              Number,
        departamento:           Number,
        codigoInvias:           String,
        fechaInicioOperacion:   Date,
        tipoPavimento:          Number,
        puntoInicial:           MC_PR_CODIGO,
        distAPuntoInicial:      Number,
        puntoFinal:             MC_PR_CODIGO,
        distAPuntoFinal:        Number,
        longitud:               Number,
        areaSeparador:          Number,
        anchoPromedio:          Number
    },
    {
        D_TIPO_PAVIMENTO:     D_BERMA_TIPO_PAVIMENTO,
        D_UNIDAD_FUNCIONAL:   D_BERMA_UNIDAD_FUNCIONAL,
        D_PROYECTO_CARRETERO: D_BERMA_PROYECTO_CARRETERO,
        D_MUNICIPIO:          D_BERMA_MUNICIPIO,
        D_DEPARTAMENTO:       D_BERMA_DEPARTAMENTO
    }
);

// 16. McTunel — Polígono (Tabla 30)
const SincMcTunel = makeModel('SincMcTunel', 'Polygon',
    {
        idTunel:                { type: String },
        unidadFuncional:        Number,
        proyecto:               Number,
        municipio:              Number,
        departamento:           Number,
        codigoInvias:           String,
        fechaInicioOperacion:   Date,
        nivelTransito:          Number,
        tipoPavimento:          Number,
        puntoInicial:           MC_PR_CODIGO,
        distAPuntoInicial:      Number,
        puntoFinal:             MC_PR_CODIGO,
        distAPuntoFinal:        Number,
        longitud:               Number
    },
    {
        D_NIVEL_TRANSITO:     D_BERMA_NIVEL_TRANSITO,
        D_TIPO_PAVIMENTO:     D_BERMA_TIPO_PAVIMENTO,
        D_UNIDAD_FUNCIONAL:   D_BERMA_UNIDAD_FUNCIONAL,
        D_PROYECTO_CARRETERO: D_BERMA_PROYECTO_CARRETERO,
        D_MUNICIPIO:          D_BERMA_MUNICIPIO,
        D_DEPARTAMENTO:       D_BERMA_DEPARTAMENTO
    }
);

// 17. McZonaServicio — Polígono (Tabla 31)
const SincMcZonaServicio = makeModel('SincMcZonaServicio', 'Polygon',
    {
        idZonaServicio:         { type: String },
        unidadFuncional:        Number,
        proyecto:               Number,
        municipio:              Number,
        departamento:           Number,
        codigoInvias:           String,
        fechaInicioOperacion:   Date,
        puntoInicial:           MC_PR_CODIGO,
        distAPuntoInicial:      Number,
        puntoFinal:             MC_PR_CODIGO,
        distAPuntoFinal:        Number,
        areaZonaServicio:       Number,
        estado:                 Number
    },
    {
        D_UNIDAD_FUNCIONAL:   D_BERMA_UNIDAD_FUNCIONAL,
        D_PROYECTO_CARRETERO: D_BERMA_PROYECTO_CARRETERO,
        D_MUNICIPIO:          D_BERMA_MUNICIPIO,
        D_DEPARTAMENTO:       D_BERMA_DEPARTAMENTO,
        D_ESTADO:             D_EST_3
    }
);

// ── Registro dinámico (slug → Model) ─────────────────────────────────────────
const MC_REGISTRY = {
    'mc-berma':            SincMcBerma,
    'mc-calzada':          SincMcCalzada,
    'mc-cco':              SincMcCco,
    'mc-cicloruta':        SincMcCicloruta,
    'mc-cuneta':           SincMcCuneta,
    'mc-defensa-vial':     SincMcDefensaVial,
    'mc-dispositivo-its':  SincMcDispositivoIts,
    'mc-drenaje':          SincMcDrenaje,
    'mc-estacion-peaje':   SincMcEstacionPeaje,
    'mc-estacion-pesaje':  SincMcEstacionPesaje,
    'mc-luminaria':        SincMcLuminaria,
    'mc-muro':             SincMcMuro,
    'mc-puente':           SincMcPuente,
    'mc-senal-vertical':   SincMcSenalVertical,
    'mc-separador':        SincMcSeparador,
    'mc-tunel':            SincMcTunel,
    'mc-zona-servicio':    SincMcZonaServicio
};

module.exports = {
    SincMcBerma, SincMcCalzada, SincMcCco, SincMcCicloruta, SincMcCuneta,
    SincMcDefensaVial, SincMcDispositivoIts, SincMcDrenaje,
    SincMcEstacionPeaje, SincMcEstacionPesaje, SincMcLuminaria,
    SincMcMuro, SincMcPuente, SincMcSenalVertical,
    SincMcSeparador, SincMcTunel, SincMcZonaServicio,
    MC_REGISTRY
};
