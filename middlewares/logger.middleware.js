const fs   = require('fs');
const path = require('path');
const Audit = require('../models/Audit');

// Crear carpeta logs si no existe
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

function getLogStream() {
    const fecha    = new Date().toISOString().split('T')[0];
    const logFile  = path.join(logDir, `access-${fecha}.log`);
    return fs.createWriteStream(logFile, { flags: 'a' });
}

async function logger(req, res, next) {
    const inicio = Date.now();

    res.on('finish', async () => {
        const duracion = Date.now() - inicio;
        const fecha    = new Date();

        // ── Log en archivo (siempre funciona) ──
        const linea = `[${fecha.toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} ${duracion}ms - IP: ${req.ip}\n`;
        try {
            const stream = getLogStream();
            stream.write(linea);
        } catch (e) {
            console.error('Error escribiendo log en archivo:', e.message);
        }

        // ── Log en MongoDB (para auditoría) ──
        try {
            await Audit.create({
                user:      req.user?.id || null,
                metodo:    req.method,
                ruta:      req.originalUrl,
                ip:        req.ip,
                status:    res.statusCode,
                duracion,
                userAgent: req.headers['user-agent'],
                fecha
            });
        } catch (e) {
            // Si MongoDB falla el archivo ya tiene el registro
            try {
                const stream = getLogStream();
                stream.write(`[ERROR DB] No se pudo guardar log en MongoDB: ${e.message}\n`);
            } catch {}
        }
    });

    next();
}

module.exports = { logger };