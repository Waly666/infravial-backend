require('dotenv').config();
const mongoose       = require('mongoose');
const PreguntaEncVia = require('../models/PreguntaEncVia');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    await PreguntaEncVia.deleteMany();

    const preguntas = [
        { consecutivo: '1',    enunciado: '¿Está instalada la nueva señalización según la resolución 1885 de 2015?' },
        { consecutivo: '2',    enunciado: '¿Está claramente definida la alineación de la calzada?' },
        { consecutivo: '3',    enunciado: '¿Las demarcaciones antiguas se han borrado o retirado correctamente?' },
        { consecutivo: '4',    enunciado: '¿Los anchos de las calzadas son adecuados para los volúmenes y composición de tránsito?' },
        { consecutivo: '5',    enunciado: '¿Es adecuado el peralte en las curvas?' },
        { consecutivo: '6',    enunciado: '¿Se encuentran identificadas las zonas escolares?' },
        { consecutivo: '7',    enunciado: '¿Es adecuado el bombeo existente en la calzada?' },
        { consecutivo: '8',    enunciado: '¿Es un tramo con congestión vehicular?' },
        { consecutivo: '9',    enunciado: '¿El conductor es consciente de la presencia de intersecciones?' },
        { consecutivo: '10',   enunciado: '¿El tramo cuenta con alto flujo de peatones o ciclistas?' },
        { consecutivo: '11',   enunciado: '¿La demarcación de la calzada es acorde en cuanto a zonas de adelantamiento?' },
        { consecutivo: '12',   enunciado: '¿La movilidad no motorizada es segura?' },
        { consecutivo: '13',   enunciado: '¿La señalización existente cubre todos los sitios que presentan riesgos potenciales de la vía?' },
        { consecutivo: '14',   enunciado: '¿La velocidad de aproximación a sitios críticos, como intersecciones en zonas escolares y curvas peligrosas es adecuada?' },
        { consecutivo: '15',   enunciado: '¿Las señales pueden ser vistas a una distancia segura?' },
        { consecutivo: '16',   enunciado: '¿La velocidad de aproximación a intersecciones es adecuada?' },
        { consecutivo: '17',   enunciado: '¿El tramo cuenta en alguna de sus intersecciones con puntos críticos de accidentalidad?' },
        { consecutivo: '18',   enunciado: '¿Los accesos a propiedades adyacentes en la vía son seguros?' },
        { consecutivo: '19',   enunciado: '¿Se presentan variaciones de la sección transversal de la vía?' },
        { consecutivo: '20',   enunciado: '¿Existen áreas seguras para el desplazamiento de las personas con discapacidad funcional?' },
        { consecutivo: '21',   enunciado: '¿Hay presencia de control operativo?' },
        { consecutivo: '22',   enunciado: '¿Existe ocupación de espacio público en andenes y calzadas?' },
        { consecutivo: '23',   enunciado: '¿Se cuenta con espacio suficiente para la ampliación del perfil vial?' },
        { consecutivo: '24',   enunciado: '¿El tramo se encuentra pavimentado en su totalidad?' },
        { consecutivo: '25',   enunciado: '¿Los actores de la vía (motociclistas y ciclistas) utilizan elementos de protección individual?' },
        { consecutivo: '26.1', enunciado: 'Actor vial: Motocicleta' },
        { consecutivo: '26.2', enunciado: 'Actor vial: Vehículo Particular' },
        { consecutivo: '26.3', enunciado: 'Actor vial: Motocarro' },
        { consecutivo: '26.4', enunciado: 'Actor vial: Bicicleta' },
        { consecutivo: '26.5', enunciado: 'Actor vial: A Pie' },
        { consecutivo: '26.6', enunciado: 'Actor vial: Taxi' },
        { consecutivo: '26.7', enunciado: 'Actor vial: Transporte público colectivo' }
    ];

    await PreguntaEncVia.insertMany(preguntas);
    console.log(`✅ ${preguntas.length} preguntas de encuesta vial insertadas`);
    mongoose.disconnect();
}).catch(err => console.error(err));