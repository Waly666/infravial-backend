require('dotenv').config();
const mongoose = require('mongoose');
const xlsx     = require('xlsx');
const path     = require('path');
const Zat      = require('../models/Zat');
const Comuna   = require('../models/Comuna');
const Barrio   = require('../models/Barrio');

mongoose.connect(process.env.MONGO_URI).then(async () => {

    const wb = xlsx.readFile(path.join(__dirname, '../data/LibroCAT3.xlsx'));

    // ZATs
    await Zat.deleteMany();
    const wsZat   = wb.Sheets['zats'];
    const rowsZat = xlsx.utils.sheet_to_json(wsZat);
    const zats    = rowsZat.filter(r => r['zatNumero ']).map(r => ({
        zatNumero:    Number(r['zatNumero ']),
        zatLetra:     String(r['zatLetra  '] || '').trim(),
        deptoDivipol: String(r['deptoDivipol'] || '').trim(),
        deptoNombre:  String(r['deptoNombre'] || '').trim(),
        munDivipol:   String(r['munDivipol'] || '').trim(),
        munNombre:    String(r['munNombre'] || '').trim()
    }));
    await Zat.insertMany(zats);
    console.log(`✅ ${zats.length} ZATs insertados`);

    // Comunas
    await Comuna.deleteMany();
    const wsCom   = wb.Sheets['Comunas'];
    const rowsCom = xlsx.utils.sheet_to_json(wsCom);
    const comunas = rowsCom.filter(r => r['comunaNumero']).map(r => ({
        comunaNumero: Number(r['comunaNumero']),
        comunaLetra:  String(r['comunaLetra'] || '').trim(),
        deptoDivipol: String(r['deptoDivipol'] || '').trim(),
        deptoNombre:  String(r['deptoNombre'] || '').trim(),
        munDivipol:   String(r['munDivipol'] || '').trim(),
        munNombre:    String(r['munNombre'] || '').trim()
    }));
    await Comuna.insertMany(comunas);
    console.log(`✅ ${comunas.length} Comunas insertadas`);

    // Barrios
    await Barrio.deleteMany();
    const wsBar   = wb.Sheets['barrios'];
    const rowsBar = xlsx.utils.sheet_to_json(wsBar);
    const barrios = rowsBar.filter(r => r['nombre']).map(r => ({
        nombre:       String(r['nombre'] || '').trim(),
        deptoDivipol: String(r['deptoDivipol'] || '').trim(),
        deptoNombre:  String(r['deptoNombre'] || '').trim(),
        munDivipol:   String(r['munDivipol'] || '').trim(),
        munNombre:    String(r['munNombre'] || '').trim()
    }));
    await Barrio.insertMany(barrios);
    console.log(`✅ ${barrios.length} Barrios insertados`);

    mongoose.disconnect();
}).catch(err => console.error(err));