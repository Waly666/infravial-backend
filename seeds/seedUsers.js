require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcrypt');
const User     = require('../models/User');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    await User.deleteMany();

    const users = [
        { user: '12345678', nombres: 'Administrador',  apellidos: 'Sistema',   password: await bcrypt.hash('NIS00227', 10), rol: 'admin',       mail: 'admin@infravial.com',      activo: true },
        { user: '87654321', nombres: 'Juan',           apellidos: 'Supervisor', password: await bcrypt.hash('123', 10), rol: 'supervisor',  mail: 'supervisor@infravial.com', activo: true },
        { user: '11223344', nombres: 'Pedro',          apellidos: 'Encuestador',password: await bcrypt.hash('123', 10), rol: 'encuestador', mail: 'encuestador@infravial.com',activo: true },
        { user: '44332211', nombres: 'Maria',          apellidos: 'Invitada',   password: await bcrypt.hash('123', 10), rol: 'invitado',    mail: 'invitado@infravial.com',   activo: true }
    ];

    await User.insertMany(users);
    console.log('✅ Usuarios creados');
    mongoose.disconnect();
}).catch(err => console.error(err));