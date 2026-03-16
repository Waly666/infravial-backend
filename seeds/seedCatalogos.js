require('dotenv').config();
const mongoose       = require('mongoose');
const xlsx           = require('xlsx');
const path           = require('path');
const EsquemaPerfil  = require('../models/EsquemaPerfil');
const SenVert        = require('../models/SenVert');
const UbicSenHor     = require('../models/UbicSenHor');
const Demarcacion    = require('../models/Demarcacion');
const ObservacionSV  = require('../models/ObservacionSV');
const ObservacionSH  = require('../models/ObservacionSH');

mongoose.connect(process.env.MONGO_URI).then(async () => {

    // ── LibroCat.xlsx ──────────────────────────────────
    const wb1 = xlsx.readFile(path.join(__dirname, '../data/LibroCat.xlsx'));

    // Esquema Perfil
    await EsquemaPerfil.deleteMany();
    const wsEsquema = wb1.Sheets['esquemaPerfil'];
    const rowsEsq   = xlsx.utils.sheet_to_json(wsEsquema);
    const esquemas  = rowsEsq.map(r => ({
        calzada:    String(r['calzada']).trim(),
        codEsquema: String(r['CodEsquema']).trim(),
        urlImgEsq:  `/uploads/catalogos/esquema-perfil/${String(r['urlImgEsq']).trim()}`
    }));
    await EsquemaPerfil.insertMany(esquemas);
    console.log(`✅ ${esquemas.length} esquemas de perfil insertados`);

    // Señales Verticales catálogo
    await SenVert.deleteMany();
    const wsSenVert = wb1.Sheets['senVert'];
    const rowsSV    = xlsx.utils.sheet_to_json(wsSenVert);
    const senVerts  = rowsSV.map(r => ({
        codSenVert:    String(r['codSenVert']).trim(),
        descSenVert:   String(r['descSenVert ']).trim(),
        clasificacion: String(r['clasificacion']).trim(),
        funcion:       String(r['funcion \xa0']).trim(),
        color:         String(r['color \xa0 \xa0']).trim(),
        descripcion:   String(r['descripcion ']).trim(),
        forma:         String(r['Forma \xa0 ']).trim(),
        urlImgSenVert: `/uploads/catalogos/sen-vert/${String(r['urlImgSenVert']).trim()}`
    }));
    await SenVert.insertMany(senVerts);
    console.log(`✅ ${senVerts.length} señales verticales catálogo insertadas`);

    // Ubicación Señales Horizontales
    await UbicSenHor.deleteMany();
    const wsUbic  = wb1.Sheets['ubicSenHor'];
    const rowsUbic= xlsx.utils.sheet_to_json(wsUbic);
    const ubics   = rowsUbic.map(r => ({
        ubicacion:  String(r['Ubicacion']).trim(),
        urlImgUbic: `/uploads/catalogos/ubic-sen-hor/${String(r['\xa0urlImgUbic ']).trim()}`
    }));
    await UbicSenHor.insertMany(ubics);
    console.log(`✅ ${ubics.length} ubicaciones señales horizontales insertadas`);

    // Demarcaciones
    await Demarcacion.deleteMany();
    const wsDem  = wb1.Sheets['demarcaciones'];
    const rowsDem= xlsx.utils.sheet_to_json(wsDem);
    const dems   = rowsDem.map(r => ({
        codDem:     String(r['codDem']).trim(),
        claseDem:   String(r['claseDerm ']).trim(),
        descripcion:String(r['descripcion ']).trim(),
        urlDemImg:  `/uploads/catalogos/demarcaciones/${String(r['urlDemImg']).trim()}`
    }));
    await Demarcacion.insertMany(dems);
    console.log(`✅ ${dems.length} demarcaciones insertadas`);

    // ── LibroCat2.xlsx ─────────────────────────────────
    const wb2 = xlsx.readFile(path.join(__dirname, '../data/Librocat2.xlsx'));

    // Observaciones Señales Verticales
    await ObservacionSV.deleteMany();
    const wsObsSV  = wb2.Sheets['observacionesSV'];
    const rowsObsSV= xlsx.utils.sheet_to_json(wsObsSV);
    const obsSV    = rowsObsSV.map(r => ({
        observacion: String(r['observacion']).trim()
    }));
    await ObservacionSV.insertMany(obsSV);
    console.log(`✅ ${obsSV.length} observaciones señales verticales insertadas`);

    // Observaciones Señales Horizontales
    await ObservacionSH.deleteMany();
const wsObsSH  = wb2.Sheets['observacionesSH'];
const rowsObsSH= xlsx.utils.sheet_to_json(wsObsSH);
const obsSH    = rowsObsSH.map(r => ({
    obsSH: String(r['Campo1']).trim()
}));
await ObservacionSH.insertMany(obsSH);
console.log(`✅ ${obsSH.length} observaciones señales horizontales insertadas`);

    mongoose.disconnect();
}).catch(err => console.error(err));