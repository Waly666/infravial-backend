const authService = require('../services/auth.service');

async function login(req, res) {
    try {
        const { user, password } = req.body;
        if (!user || !password) return res.status(400).json({ message: 'Cédula y contraseña requeridas INFRAVIAL' });
        const data = await authService.login(user, password);
        res.json({ message: 'Login exitoso INFRAVIAL', ...data });
    } catch (err) {
        res.status(401).json({ message: err.message });
    }
}

async function refresh(req, res) {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) return res.status(400).json({ message: 'Refresh token requerido INFRAVIAL' });
        const data = await authService.refresh(refreshToken);
        res.json({ message: 'Token renovado INFRAVIAL', ...data });
    } catch (err) {
        res.status(403).json({ message: 'Refresh token inválido INFRAVIAL' });
    }
}

module.exports = { login, refresh };