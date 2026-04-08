const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    // Permite token por query param para SSE (EventSource no soporta headers)
    const token = (authHeader && authHeader.split(' ')[1]) || req.query.token;

    if (!token) return res.status(401).json({ message: 'Token requerido INFRAVIAL' });

    jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ message: 'Token inválido INFRAVIAL' });
        req.user = user;
        next();
    });
}

function isAdmin(req, res, next) {
    if (req.user?.rol !== 'admin') {
        return res.status(403).json({ message: 'Acceso restringido a administradores INFRAVIAL' });
    }
    next();
}

function hasRole(...roles) {
    return (req, res, next) => {
        if (!roles.includes(req.user?.rol)) {
            return res.status(403).json({ message: `Acceso restringido a roles: ${roles.join(', ')} INFRAVIAL` });
        }
        next();
    };
}

module.exports = { authenticateToken, isAdmin, hasRole };