require('dotenv').config();
const mongoose    = require('mongoose');
const xlsx        = require('xlsx');
const path        = require('path');
const ObsSemaforo = require('../models/ObsSemaforo');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    await ObsSemaforo.deleteMany();

    const wb   = xlsx.readFile(path.join(__dirname, '../data/LibroCAT4.xlsx'));
    const ws   = wb.Sheets['obsSemaforos'];
    const rows = xlsx.utils.sheet_to_json(ws);

    const datos = rows
        .filter(r => r['textoObs'] && r['textoObs'] !== 'Obs2')
        .map((r, i) => ({
            consecutivo: i + 1,
            textoObs:    String(r['textoObs']).trim()
        }));

    await ObsSemaforo.insertMany(datos);
    console.log(`✅ ${datos.length} observaciones de semáforos insertadas`);
    mongoose.disconnect();
}).catch(err => console.error(err));