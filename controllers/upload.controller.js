const path = require('path');

function subirFoto(req, res) {
    try {
        console.log('FILES:', req.files);
        console.log('FILE:', req.file);
        const archivos = req.files || (req.file ? [req.file] : []);
        if (archivos.length === 0) {
            return res.status(400).json({ message: 'No se recibió ningún archivo INFRAVIAL' });
        }
        const urls = archivos.map(file => {
            const carpeta = file.destination.split('uploads')[1].replace(/\\/g, '/');
            return `/uploads${carpeta}/${file.filename}`;
        });
        res.json({ message: 'Fotos subidas exitosamente INFRAVIAL', urls });
    } catch (err) {
        console.error('ERROR FOTO:', err);
        res.status(500).json({ message: err.message });
    }
}

module.exports = { subirFoto };

module.exports = { subirFoto };