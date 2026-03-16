const Jornada = require('../models/Jornada');

async function checkJornada(req, res, next) {
    try {
        // Admin puede operar sin jornada activa
        if (req.user?.rol === 'admin') return next();

        const jornada = await Jornada.findOne({ estado: 'EN PROCESO' });

        if (!jornada) {
            return res.status(403).json({
                message: 'No hay una jornada activa. Contacte al administrador INFRAVIAL'
            });
        }

        req.jornada = jornada;
        next();
    } catch (err) {
        res.status(500).json({ message: 'Error verificando jornada INFRAVIAL' });
    }
}

module.exports = { checkJornada };