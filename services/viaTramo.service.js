const ViaTramo = require('../models/ViaTramo');

// Calcular clasNacional según anchoTotalPerfil
function calcularClasNacional(ancho) {
    if (ancho >= 60)                    return 'V1';
    if (ancho > 45 && ancho < 60)       return 'V2';
    if (ancho > 30 && ancho <= 44.9)    return 'V3';
    if (ancho > 25 && ancho <= 29.9)    return 'V4';
    if (ancho > 18 && ancho <= 24.9)    return 'V5';
    if (ancho > 16 && ancho <= 17.9)    return 'V6';
    if (ancho > 13 && ancho <= 15.9)    return 'V7';
    if (ancho > 10 && ancho <= 12.9)    return 'V8';
    if (ancho <= 9.9)                   return 'V9';
    return null;
}

// Calcular clasPrelacion según tipoVia y anchoTotalPerfil
function calcularClasPrelacion(ancho, tipoVia) {
    if (tipoVia === 'Urbana') {
        if (ancho >= 30)                return 'Autopistas';
        if (ancho >= 26 && ancho < 30)  return 'Arterias';
        if (ancho >= 20 && ancho < 26)  return 'Principales';
        if (ancho >= 17 && ancho < 20)  return 'Secundarias';
        if (ancho > 12 && ancho < 17)   return 'Ordinarias';
        if (ancho > 8  && ancho <= 12)  return 'Ciclorutas';
        if (ancho >= 1 && ancho <= 8)   return 'Peatonales';
    } else if (tipoVia === 'Rural') {
        if (ancho >= 30)                return 'Autopistas';
        if (ancho >= 26 && ancho < 30)  return 'Carreteras principales';
        if (ancho >= 20 && ancho < 26)  return 'Carreteras secundarias';
        if (ancho >= 17 && ancho < 20)  return 'Carreteables';
        if (ancho > 12 && ancho < 17)   return 'Privadas';
        if (ancho >= 1 && ancho <= 12)  return 'Peatonales';
    }
    return null;
}

// Calcular ancho total del perfil
function calcularAnchoTotal(data) {
    const campos = [
        'anteJardinIzq', 'andenIzq', 'zonaVerdeIzq', 'areaServIzq',
        'sardIzqCalzA', 'cicloRutaIzq', 'bahiaEstIzq', 'sardDerCalzA',
        'cunetaIzq', 'bermaIzq', 'calzadaIzq',
        'anteJardinDer', 'andenDer', 'zonaVerdeDer', 'areaServDer',
        'sardDerCalzB', 'cicloRutaDer', 'bahiaEstDer', 'sardIzqCalzB',
        'cunetaDer', 'bermaDer', 'calzadaDer',
        'separadorZonaVerdeIzq', 'separadorPeatonal',
        'separadorCicloRuta', 'separadorZonaVerdeDer'
    ];
    return campos.reduce((sum, campo) => sum + (parseFloat(data[campo]) || 0), 0);
}

async function getAll(filtros = {}) {
     return await ViaTramo.find(filtros)
        .populate('idJornada', 'municipio dpto supervisor')
        .populate('zat', 'zatNumero zatLetra')
        .populate('comuna', 'comunaNumero comunaLetra')
        .populate('barrio', 'nombre')
        .populate('perfilEsquema', 'codEsquema calzada')
        .sort({ fechaCreacion: -1 });
}

async function getById(id) {
    return await ViaTramo.findById(id)
        .populate('idJornada', 'municipio dpto supervisor localidad fechaJornada')
        .populate('zat', 'zatNumero zatLetra')
        .populate('comuna', 'comunaNumero comunaLetra')
        .populate('barrio', 'nombre')
        .populate('perfilEsquema', 'codEsquema calzada urlImgEsq')
        .populate('obs1', 'txtObs')
        .populate('obs2', 'txtObs')
        .populate('obs3', 'txtObs')
        .populate('obs4', 'txtObs')
        .populate('obs5', 'txtObs')
        .populate('obs6', 'txtObs');
        
}

async function create(data, creadoPor) {
    // Calcular campos automáticos
    data.anchoTotalPerfil = calcularAnchoTotal(data);
    data.clasNacional     = calcularClasNacional(data.anchoTotalPerfil);
    data.clasPrelacion    = calcularClasPrelacion(data.anchoTotalPerfil, data.tipoVia);
    data.creadoPor        = creadoPor;
    data.fechaCreacion    = new Date();

    const tramo = new ViaTramo(data);
    await tramo.save();
    return tramo;
}

async function update(id, data, modificadoPor) {
    if (data.anchoTotalPerfil !== undefined || data.tipoVia) {
        data.anchoTotalPerfil = calcularAnchoTotal(data);
        data.clasNacional     = calcularClasNacional(data.anchoTotalPerfil);
        data.clasPrelacion    = calcularClasPrelacion(data.anchoTotalPerfil, data.tipoVia);
    }
    data.modificadoPor     = modificadoPor;
    data.fechaModificacion = new Date();
    // Solo guardar un resumen liviano, no el JSON completo
    data.logUltimaMod = `Actualizado por ${modificadoPor} el ${new Date().toISOString()}`;

    return await ViaTramo.findByIdAndUpdate(id, data, { new: true });
}

async function remove(id) {
    return await ViaTramo.findByIdAndDelete(id);
}

module.exports = { getAll, getById, create, update, remove };