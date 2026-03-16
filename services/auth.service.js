const jwt    = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User   = require('../models/User');

async function login(user, password) {
    const usuario = await User.findOne({ user, activo: true });
    if (!usuario) throw new Error('Usuario no encontrado o inactivo INFRAVIAL');

    const valida = await bcrypt.compare(password, usuario.password);
    if (!valida) throw new Error('Contraseña incorrecta INFRAVIAL');

    const payload = {
        id:       usuario._id,
        user:     usuario.user,
        nombres:  usuario.nombres,
        apellidos:usuario.apellidos,
        rol:      usuario.rol
    };

    const accessToken  = jwt.sign(payload, process.env.SECRET_KEY,         { expiresIn: '20m' });
    const refreshToken = jwt.sign(payload, process.env.REFRESH_SECRET_KEY, { expiresIn: '7d'  });

    return { accessToken, refreshToken, usuario: payload };
}

async function refresh(refreshToken) {
    const payload      = jwt.verify(refreshToken, process.env.REFRESH_SECRET_KEY);
    const { id, user, nombres, apellidos, rol } = payload;
    const accessToken  = jwt.sign({ id, user, nombres, apellidos, rol }, process.env.SECRET_KEY, { expiresIn: '20m' });
    return { accessToken };
}

module.exports = { login, refresh };