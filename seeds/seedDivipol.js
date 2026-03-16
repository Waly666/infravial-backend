require('dotenv').config();
const mongoose = require('mongoose');
const xlsx     = require('xlsx');
const path     = require('path');
const Divipol  = require('../models/Divipol');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    await Divipol.deleteMany();

    const wb   = xlsx.readFile(path.join(__dirname, '../data/Librocat2.xlsx'));
    const ws   = wb.Sheets['divipol'];
    const rows = xlsx.utils.sheet_to_json(ws);

    const datos = rows.map(r => ({
        divipolMunCod:    String(r['divipolMunCod ']).trim().padStart(5, '0'),
        divipolMunicipio: String(r['divipolMunicipio']).trim(),
        divipolDepto:     String(r['divipolDepto \xa0']).trim(),
        divipolDeptoCod:  String(r['divipolDeptoCod ']).trim().padStart(2, '0')
    }));

    await Divipol.insertMany(datos);
    console.log(`✅ ${datos.length} municipios DIVIPOL insertados`);
    mongoose.disconnect();
}).catch(err => console.error(err));