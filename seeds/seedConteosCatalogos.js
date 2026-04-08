require('dotenv').config();
const mongoose      = require('mongoose');
const CatConteo     = require('../models/CatConteo');
const SentidoConteo = require('../models/SentidoConteo');

mongoose.connect(process.env.MONGO_URI).then(async () => {

    // ── CATEGORÍAS VEHICULARES ────────────────────────────────────────────────
    await CatConteo.deleteMany();
    const cats = [
        { catCont: 'Personas',                             desCat: 'Conteo de personas que pasan por la intersección o el lugar destinado para el aforo.',                                                                                                                                                                               urlCatCont: '/uploads/catalogos/catConteos/Personas.jpg' },
        { catCont: 'Motocicleta',                          desCat: 'Motos y Motociclos de tres ruedas, se tienen en cuenta como una categoría de clasificación vehicular.',                                                                                                                                                              urlCatCont: '/uploads/catalogos/catConteos/Motocicleta.jpg' },
        { catCont: 'Autos (C1)',                           desCat: 'Vehículos pequeños, automóviles, camperos, camionetas.',                                                                                                                                                                                                             urlCatCont: '/uploads/catalogos/catConteos/Autos (C1).jpg' },
        { catCont: 'Bus Pequeño',                          desCat: 'Llamados también busetas, se refiere a los vehículos de servicio público urbano y algunos intermunicipales de dos ejes.',                                                                                                                                             urlCatCont: '/uploads/catalogos/catConteos/Bus Pequeño.jpg' },
        { catCont: 'Bus Grande',                           desCat: 'Corresponde a la categoría de buses interdepartamentales de dos ejes.',                                                                                                                                                                                              urlCatCont: '/uploads/catalogos/catConteos/Bus Grande.jpg' },
        { catCont: 'Camión C2P',                           desCat: 'Camiones pequeños de dos ejes, furgones, carro tanque pequeño, turbos. Capacidad ≤ 7,5 toneladas.',                                                                                                                                                                 urlCatCont: '/uploads/catalogos/catConteos/Camión de Segunda Categoría Pequeño (C2P).jpg' },
        { catCont: 'Camión C2G',                           desCat: 'Camiones grandes de dos ejes, vehículos de carga mayor a 10 toneladas.',                                                                                                                                                                                            urlCatCont: '/uploads/catalogos/catConteos/Camión de Segunda Categoría Grande (C2G).jpg' },
        { catCont: 'Camión C3',                            desCat: 'Vehículos de tres ejes (doble troque), también vehículos de 4 ejes.',                                                                                                                                                                                               urlCatCont: '/uploads/catalogos/catConteos/Camión de Tercera Categoría (C3).jpg' },
        { catCont: 'Camión C4',                            desCat: 'Vehículos de cinco ejes, tres en el cabezote y dos ejes de doble rueda en la parte trasera.',                                                                                                                                                                       urlCatCont: '/uploads/catalogos/catConteos/Camión de Cuarta Categoría (C4).jpg' },
        { catCont: 'Camión C5',                            desCat: 'Vehículos de seis ejes, tres en el cabezote y tres ejes de doble rueda en la parte trasera.',                                                                                                                                                                       urlCatCont: '/uploads/catalogos/catConteos/Camión de Quinta Categoría (C5).jpg' },
        { catCont: 'Camión >C5',                           desCat: 'Vehículos con más de seis ejes.',                                                                                                                                                                                                                                   urlCatCont: '/uploads/catalogos/catConteos/Camión Mayor de Quinta Categoría.jpg' },
    ];
    await CatConteo.insertMany(cats);
    console.log(`✅ ${cats.length} categorías de conteo insertadas`);

    // ── SENTIDOS / MOVIMIENTOS ────────────────────────────────────────────────
    await SentidoConteo.deleteMany();
    const sentidos = [
        { codSentido: '1',     sentido: 'Acceso Norte',          urlSentImg: '/uploads/catalogos/movimientos/movfrente.jpg' },
        { codSentido: '2',     sentido: 'Acceso Sur',            urlSentImg: '/uploads/catalogos/movimientos/movfrente.jpg' },
        { codSentido: '3',     sentido: 'Acceso Occidente',      urlSentImg: '/uploads/catalogos/movimientos/movfrente.jpg' },
        { codSentido: '4',     sentido: 'Acceso Oriente',        urlSentImg: '/uploads/catalogos/movimientos/movfrente.jpg' },
        { codSentido: '5',     sentido: 'Giro Norte - Oriente',  urlSentImg: '/uploads/catalogos/movimientos/movizq.jpg' },
        { codSentido: '6',     sentido: 'Giro Sur - Occidente',  urlSentImg: '/uploads/catalogos/movimientos/movizq.jpg' },
        { codSentido: '7',     sentido: 'Giro Occidente - Norte',urlSentImg: '/uploads/catalogos/movimientos/movizq.jpg' },
        { codSentido: '8',     sentido: 'Giro Oriente - Sur',    urlSentImg: '/uploads/catalogos/movimientos/movizq.jpg' },
        { codSentido: '10(1)', sentido: 'Giro en U al Norte',    urlSentImg: '/uploads/catalogos/movimientos/movU.jpg' },
        { codSentido: '10(2)', sentido: 'Giro en U al Sur',      urlSentImg: '/uploads/catalogos/movimientos/movU.jpg' },
        { codSentido: '10(3)', sentido: 'Giro en U al Occidente',urlSentImg: '/uploads/catalogos/movimientos/movU.jpg' },
        { codSentido: '10(4)', sentido: 'Giro en U al Oriente',  urlSentImg: '/uploads/catalogos/movimientos/movU.jpg' },
        { codSentido: '9(1)', sentido: 'Giro Norte - Occidente', urlSentImg: '/uploads/catalogos/movimientos/movder.jpg' },
        { codSentido: '9(2)', sentido: 'Giro Sur - Oriente',     urlSentImg: '/uploads/catalogos/movimientos/movder.jpg' },
        { codSentido: '9(3)', sentido: 'Giro Occidente - Sur',   urlSentImg: '/uploads/catalogos/movimientos/movder.jpg' },
        { codSentido: '9(4)', sentido: 'Giro Oriente - Norte',   urlSentImg: '/uploads/catalogos/movimientos/movder.jpg' },
    ];
    await SentidoConteo.insertMany(sentidos);
    console.log(`✅ ${sentidos.length} sentidos de conteo insertados`);

    console.log('\n🎉 Catálogos de conteos cargados correctamente.');
    mongoose.disconnect();
}).catch(err => { console.error('❌', err); process.exit(1); });
