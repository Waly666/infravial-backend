require('dotenv').config();
const mongoose       = require('mongoose');
const xlsx           = require('xlsx');
const path           = require('path');

const ObservacionSH  = require('../models/ObservacionSH');
const ObservacionSV  = require('../models/ObservacionSV');
const ObsSemaforo    = require('../models/ObsSemaforo');
const ObservacionVia = require('../models/ObservacionVia');

const FILE = path.join(__dirname, '../data/observaciones.xlsx');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const wb = xlsx.readFile(FILE);

    // ── 1. SEÑALES HORIZONTALES ───────────────────────────────────────────────
    const wsSH  = wb.Sheets['OBS SEÑALES HORIZONTALES'];
    const rowsSH = xlsx.utils.sheet_to_json(wsSH)
        .filter(r => r['Campo1'])
        .map(r  => ({ obsSH: String(r['Campo1']).trim() }));

    await ObservacionSH.deleteMany();
    await ObservacionSH.insertMany(rowsSH);
    console.log(`✅ ${rowsSH.length} observaciones de Señales Horizontales insertadas`);

    // ── 2. SEÑALES VERTICALES ─────────────────────────────────────────────────
    const wsSV  = wb.Sheets['OBS SEÑALES VERTICALES'];
    const rowsSV = xlsx.utils.sheet_to_json(wsSV)
        .filter(r => r['observacion'])
        .map(r  => ({ observacion: String(r['observacion']).trim() }));

    await ObservacionSV.deleteMany();
    await ObservacionSV.insertMany(rowsSV);
    console.log(`✅ ${rowsSV.length} observaciones de Señales Verticales insertadas`);

    // ── 3. SEMÁFOROS ──────────────────────────────────────────────────────────
    const wsSem  = wb.Sheets['OBS SEMAFOROS'];
    const rowsSem = xlsx.utils.sheet_to_json(wsSem)
        .filter(r => r['textoObs'] && r['textoObs'] !== 'Obs2')
        .map((r, i) => ({
            consecutivo: i + 1,
            textoObs:    String(r['textoObs']).trim()
        }));

    await ObsSemaforo.deleteMany();
    await ObsSemaforo.insertMany(rowsSem);
    console.log(`✅ ${rowsSem.length} observaciones de Semáforos insertadas`);

    // ── 4. VÍAS TRAMOS ────────────────────────────────────────────────────────
    const wsVia  = wb.Sheets['OBS VIAS TRAMOS'];
    const rowsVia = xlsx.utils.sheet_to_json(wsVia)
        .filter(r => r['txtObs'])
        .map(r  => ({ txtObs: String(r['txtObs']).trim() }));

    await ObservacionVia.deleteMany();
    await ObservacionVia.insertMany(rowsVia);
    console.log(`✅ ${rowsVia.length} observaciones de Vías Tramos insertadas`);

    console.log('\n🎉 Todas las observaciones importadas correctamente.');
    mongoose.disconnect();
}).catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});
