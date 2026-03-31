/**
 * Migra todos los viaTramos: campo tipoUbic (Diseño) → "Tramo de Via".
 * Ejecutar UNA VEZ antes o después de desplegar el enum nuevo:
 *   node scripts/migrate-tipoUbic-tramo-de-via.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const ViaTramo = require('../models/ViaTramo');

async function main() {
    const uri = process.env.MONGO_URI;
    if (!uri) {
        console.error('Falta MONGO_URI en .env');
        process.exit(1);
    }
    await mongoose.connect(uri);
    const r = await ViaTramo.updateMany({}, { $set: { tipoUbic: 'Tramo de Via' } });
    console.log('viaTramos tipoUbic → "Tramo de Via":', r.modifiedCount, 'modificados,', r.matchedCount, 'coincidencias');
    await mongoose.disconnect();
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
