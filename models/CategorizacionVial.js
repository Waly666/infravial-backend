const mongoose = require('mongoose');

/**
 * Opciones de respuesta para cada criterio de categorización.
 * Cada opción lleva: etiqueta, orden al que clasifica y puntos que aporta.
 */

// ── Funcionalidad (peso 40 pts) ──────────────────────────────────────────────
const FUNC_OPCIONES = ['A', 'B', 'C'];
// A → 1er Orden (40 pts)  B → 2do Orden (25 pts)  C → 3er Orden (10 pts)

// ── TPD (peso 20 pts) ────────────────────────────────────────────────────────
const TPD_OPCIONES = ['A', 'B', 'C'];
// A → 1er Orden (20 pts)  B → 2do Orden (10 pts)  C → 3er Orden (5 pts)

// ── Diseño Geométrico (peso 20 pts) ─────────────────────────────────────────
const DISENO_OPCIONES = ['A', 'B', 'C'];
// A → 1er Orden (20 pts)  B → 2do Orden (10 pts)  C → 3er Orden (5 pts)

// ── Población (peso 20 pts) ──────────────────────────────────────────────────
const POB_OPCIONES = ['A', 'B', 'C'];
// A → 1er Orden (20 pts)  B → 2do Orden (10 pts)  C → 3er Orden (5 pts)

const categorizacionVialSchema = new mongoose.Schema({

    // ── Identificación de la vía ──────────────────────────────────────────────
    nombreVia:    { type: String, required: true },
    /** Jornada de levantamiento; depto/mun/códigos DIVIPOL se pueden sincronizar desde aquí */
    idJornada: {
        type: mongoose.Schema.Types.ObjectId,
        ref:  'Jornada',
        index: true
    },
    departamento: { type: String, required: true },
    municipio:    { type: String, required: true },
    /** Códigos DIVIPOL (tabla maestra), opcionales en documentos antiguos */
    munDivipol:   { type: String },
    deptoDivipol: { type: String },
    codigoPR:     { type: String },          // Código de progresiva / PR
    longitud_km:  { type: Number },          // Longitud del tramo (km) — dato declarado
    ancho_m:      { type: Number },          // Ancho de la calzada (m)
    observaciones:{ type: String },

    // ── Georreferenciación del tramo (misma convención que vía-tramos) ─────────
    lat_inicio:       { type: Number },
    lng_inicio:       { type: Number },
    lat_fin:          { type: Number },
    lng_fin:          { type: Number },
    longitud_tramo_m: { type: Number },      // Distancia geodésica inicio– fin (m)

    // ── Sección 1: Funcionalidad (40 pts) ────────────────────────────────────
    // A: Conecta capitales de departamento / corredores nacionales / internacionales
    // B: Conecta municipios o capitales de departamento con cabeceras municipales
    // C: Conecta veredas, inspecciones o zonas de producción agrícola
    funcionalidad: { type: String, enum: FUNC_OPCIONES, required: true },

    // ── Sección 2: TPD — Tráfico Promedio Diario (20 pts) ────────────────────
    // A: > 5 000 veh/día   B: 500–5 000 veh/día   C: < 500 veh/día
    tpd:          { type: String, enum: TPD_OPCIONES,   required: true },
    tpdValor:     { type: Number },          // Valor numérico TPD (opcional)

    // ── Sección 3: Diseño Geométrico (20 pts) ────────────────────────────────
    // A: Calzada pavimentada ≥ 2 carriles, V ≥ 80 km/h, curvas amplias
    // B: Calzada pavimentada, condiciones intermedias (40–80 km/h)
    // C: Sin pavimentar o diseño básico, V < 40 km/h
    disenoGeometrico: { type: String, enum: DISENO_OPCIONES, required: true },

    // ── Sección 4: Población (20 pts) ────────────────────────────────────────
    // A: > 500 000 hab   B: 25 000–500 000 hab   C: < 25 000 hab
    poblacion:    { type: String, enum: POB_OPCIONES,   required: true },
    poblacionValor: { type: Number },        // Valor numérico de población (opcional)

    // ── Puntajes calculados (guardados para consultas/reportes) ──────────────
    ptsPrimerOrden:   { type: Number, default: 0 },
    ptsSegundoOrden:  { type: Number, default: 0 },
    ptsTercerOrden:   { type: Number, default: 0 },

    // ── Resultado de la clasificación ────────────────────────────────────────
    // 'PRIMARIA' = 1er Orden | 'SECUNDARIA' = 2do Orden | 'TERCIARIA' = 3er Orden
    clasificacion: {
        type: String,
        enum: ['PRIMARIA', 'SECUNDARIA', 'TERCIARIA'],
        required: true
    },

    // ── Responsable del acto de clasificación ────────────────────────────────
    fechaClasificacion: { type: Date },        // Fecha en que se efectúa / registra la clasificación
    nombreFuncionario:  { type: String },     // Quien clasifica o registra
    entidadFuncionario: { type: String },     // Entidad a la que pertenece (ej. municipio, consultor)

    // ── Auditoría ─────────────────────────────────────────────────────────────
    creadoPor:         { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fechaCreacion:     { type: Date, default: Date.now },
    modificadoPor:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fechaModificacion: { type: Date }
});

// ── Función de cálculo de puntajes ───────────────────────────────────────────
/**
 * Calcula los puntos por orden según las 4 respuestas.
 * Retorna { ptsPrimerOrden, ptsSegundoOrden, ptsTercerOrden, clasificacion }
 */
function calcularCategorizacion({ funcionalidad, tpd, disenoGeometrico, poblacion }) {
    // Tabla de puntos por opción y criterio
    //            A     B    C
    const FUNC  = { A: 40, B: 25, C: 10 };
    const OTROS = { A: 20, B: 10, C:  5 };

    // Mapa opción → orden
    const ORDEN_MAP = { A: 1, B: 2, C: 3 };

    let pts = { 1: 0, 2: 0, 3: 0 };
    let funcionOrden = ORDEN_MAP[funcionalidad];

    pts[funcionOrden]             += FUNC[funcionalidad];
    pts[ORDEN_MAP[tpd]]           += OTROS[tpd];
    pts[ORDEN_MAP[disenoGeometrico]] += OTROS[disenoGeometrico];
    pts[ORDEN_MAP[poblacion]]     += OTROS[poblacion];

    // Determinar orden ganador (empate → gana funcionalidad)
    let maxPts = Math.max(pts[1], pts[2], pts[3]);
    let clasificacion;

    if (pts[1] === pts[2] && pts[1] === pts[3]) {
        // Triple empate → gana funcionalidad
        clasificacion = ['PRIMARIA', 'SECUNDARIA', 'TERCIARIA'][funcionOrden - 1];
    } else if (pts[1] === maxPts && pts[2] === maxPts) {
        // Empate 1º vs 2º → gana funcionalidad si es 1 o 2
        clasificacion = funcionOrden <= 2
            ? ['PRIMARIA', 'SECUNDARIA'][funcionOrden - 1]
            : 'PRIMARIA';
    } else if (pts[1] === maxPts && pts[3] === maxPts) {
        clasificacion = funcionOrden === 1 || funcionOrden === 3
            ? ['PRIMARIA', 'SECUNDARIA', 'TERCIARIA'][funcionOrden - 1]
            : 'PRIMARIA';
    } else if (pts[2] === maxPts && pts[3] === maxPts) {
        clasificacion = funcionOrden === 2 || funcionOrden === 3
            ? ['PRIMARIA', 'SECUNDARIA', 'TERCIARIA'][funcionOrden - 1]
            : 'SECUNDARIA';
    } else {
        // Sin empate
        if (pts[1] === maxPts)      clasificacion = 'PRIMARIA';
        else if (pts[2] === maxPts) clasificacion = 'SECUNDARIA';
        else                        clasificacion = 'TERCIARIA';
    }

    return {
        ptsPrimerOrden:  pts[1],
        ptsSegundoOrden: pts[2],
        ptsTercerOrden:  pts[3],
        clasificacion
    };
}

module.exports = mongoose.model('CategorizacionVial', categorizacionVialSchema);
module.exports.calcularCategorizacion = calcularCategorizacion;
module.exports.FUNC_OPCIONES  = FUNC_OPCIONES;
module.exports.TPD_OPCIONES   = TPD_OPCIONES;
module.exports.DISENO_OPCIONES = DISENO_OPCIONES;
module.exports.POB_OPCIONES   = POB_OPCIONES;
