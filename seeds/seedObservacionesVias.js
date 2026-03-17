require('dotenv').config();
const mongoose       = require('mongoose');
const ObservacionVia = require('../models/ObservacionVia');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    await ObservacionVia.deleteMany();

    const observaciones = [
        { txtObs: 'Alta tasa de accidentalidad' },
        { txtObs: 'Altura libre obstruida por cableado de servicios' },
        { txtObs: 'Contaminación por acumulación de basuras o escombros' },
        { txtObs: 'Cuneta en mal estado de conservación' },
        { txtObs: 'Disminución de la infraestructura de estacionamiento' },
        { txtObs: 'Disminución de la infraestructura vial' },
        { txtObs: 'Exceso de acompañantes o pasajeros en vehículos automotores' },
        { txtObs: 'Existencia de puente vehicular en el tramo vial' },
        { txtObs: 'Existencia de señalización no acorde con el perfil vial' },
        { txtObs: 'Existencia de tapas de alcantarillado y rejillas de desagüe a desnivel del perfil vial' },
        { txtObs: 'Falta de arborización con especies nativas' },
        { txtObs: 'Falta de conciencia en la población sobre temas de seguridad vial' },
        { txtObs: 'Falta de control a la contaminación sonora' },
        { txtObs: 'Falta de manejo de agua de escorrentías' },
        { txtObs: 'Falta de poda en la vegetación existente' },
        { txtObs: 'Inestabilidad de terreno a lado y lado de la vía' },
        { txtObs: 'Inexactitud o falta de ubicación, dimensiones y materiales de las señales en edificios para accesibilidad a las personas al medio físico' },
        { txtObs: 'Inexistencia de bombeo' },
        { txtObs: 'Inexistencia de tapas de alcantarillado y rejillas de desagüe' },
        { txtObs: 'Inexistencia de uniformidad de andenes' },
        { txtObs: 'Inexistencia o falta de contrahuellas, huellas, tramos rectos, descansos, pasamanos y vados de las personas al medio físico' },
        { txtObs: 'Inexistencia o falta de estacionamientos accesibles a las personas al medio físico' },
        { txtObs: 'Inexistencia o falta de infraestructura para la accesibilidad (vías de circulación peatonales u horizontales)' },
        { txtObs: 'Inexistencia o falta de paraderos accesibles para transporte público colectivo y otros' },
        { txtObs: 'Inexistencia o falta de señales de orientación (croquis planos modelos)' },
        { txtObs: 'Inexistencia o falta de señales direccionales y funcionales' },
        { txtObs: 'Inexistencia o falta de señales visuales y táctiles' },
        { txtObs: 'Inexistencia o falta de señalización horizontal y vertical para la accesibilidad de las personas al medio físico' },
        { txtObs: 'Invasión del espacio destinado a ciclo ruta' },
        { txtObs: 'Invasión del espacio público' },
        { txtObs: 'Limpieza de andenes' },
        { txtObs: 'No uso de elementos de protección personal' },
        { txtObs: 'Se evidencia ampliación de la vía sin ningún tipo de supervisión o señalización vertical temporal' },
        { txtObs: 'Se evidencia señalización vertical recicladas' },
        { txtObs: 'Se evidencia señalización vertical vandalizada' },
        { txtObs: 'Se visualiza una fluencia de agua por uno de los costados de la vía' },
        { txtObs: 'Taponamiento de la red pluvial' },
        { txtObs: 'Uniformidad de perfil vial' },
        { txtObs: 'Uso excesivo de vehículos particulares' },
        { txtObs: 'Violación a las señales de tránsito por parte de la población' }
    ];

    await ObservacionVia.insertMany(observaciones);
    console.log(`✅ ${observaciones.length} observaciones de vías insertadas`);
    mongoose.disconnect();
}).catch(err => console.error(err));