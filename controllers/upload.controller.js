const path = require('path');

function subirFoto(req, res) {
    try {
        if (!req.file) return res.status(400).json({ message: 'No se recibió ningún archivo INFRAVIAL' });
        const url = `/uploads/${req.file.destination.split('uploads/')[1]}/${req.file.filename}`;
        res.json({ message: 'Foto subida exitosamente INFRAVIAL', url });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

module.exports = { subirFoto };