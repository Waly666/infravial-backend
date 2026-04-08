const EstacionConteo = require('../models/EstacionConteo');
const Conteo         = require('../models/Conteo');
const DetalleConteo  = require('../models/DetalleConteo');
const SentidoConteo  = require('../models/SentidoConteo');
const CatConteo      = require('../models/CatConteo');
const ProyectoConteo = require('../models/ProyectoConteo');
const SesionConteo   = require('../models/SesionConteo');

// ── Clientes SSE conectados por conteo ────────────────────────────────────────
const sseClients = {}; // { idConteo: [res, res, ...] }

function pushSSE(idConteo, data) {
    const clients = sseClients[idConteo] || [];
    const payload = `data: ${JSON.stringify(data)}\n\n`;
    clients.forEach(res => { try { res.write(payload); } catch(_) {} });
}

// ── ESTACIONES ────────────────────────────────────────────────────────────────
exports.estacion = {
    getAll: async (req, res) => {
        try {
            const datos = await EstacionConteo.find().sort({ createdAt: -1 });
            res.json({ datos });
        } catch (e) { res.status(500).json({ message: e.message }); }
    },
    getById: async (req, res) => {
        try {
            const dato = await EstacionConteo.findById(req.params.id);
            if (!dato) return res.status(404).json({ message: 'Estación no encontrada' });
            res.json({ dato });
        } catch (e) { res.status(500).json({ message: e.message }); }
    },
    create: async (req, res) => {
        try {
            const dato = await EstacionConteo.create(req.body);
            res.status(201).json({ message: 'Estación creada', dato });
        } catch (e) { res.status(400).json({ message: e.message }); }
    },
    update: async (req, res) => {
        try {
            const dato = await EstacionConteo.findByIdAndUpdate(req.params.id, req.body, { new: true });
            res.json({ message: 'Estación actualizada', dato });
        } catch (e) { res.status(400).json({ message: e.message }); }
    },
    remove: async (req, res) => {
        try {
            await EstacionConteo.findByIdAndDelete(req.params.id);
            res.json({ message: 'Estación eliminada' });
        } catch (e) { res.status(500).json({ message: e.message }); }
    }
};

// ── PROYECTOS ─────────────────────────────────────────────────────────────────
exports.proyecto = {
    getAll: async (req, res) => {
        try {
            const datos = await ProyectoConteo.find().sort({ createdAt: -1 });
            res.json({ datos });
        } catch (e) { res.status(500).json({ message: e.message }); }
    },
    create: async (req, res) => {
        try {
            const dato = await ProyectoConteo.create(req.body);
            res.status(201).json({ message: 'Proyecto creado', dato });
        } catch (e) { res.status(400).json({ message: e.message }); }
    },
    update: async (req, res) => {
        try {
            const dato = await ProyectoConteo.findByIdAndUpdate(req.params.id, req.body, { new: true });
            res.json({ message: 'Proyecto actualizado', dato });
        } catch (e) { res.status(400).json({ message: e.message }); }
    },
    remove: async (req, res) => {
        try {
            await ProyectoConteo.findByIdAndDelete(req.params.id);
            res.json({ message: 'Proyecto eliminado' });
        } catch (e) { res.status(500).json({ message: e.message }); }
    },
    // Activar un proyecto (solo 1 activo a la vez)
    activar: async (req, res) => {
        try {
            await ProyectoConteo.updateMany({}, { activo: false });
            const dato = await ProyectoConteo.findByIdAndUpdate(
                req.params.id, { activo: true }, { new: true }
            );
            if (!dato) return res.status(404).json({ message: 'Proyecto no encontrado' });
            res.json({ message: 'Proyecto activado', dato });
        } catch (e) { res.status(500).json({ message: e.message }); }
    },
    // Desactivar (sin activar otro)
    desactivar: async (req, res) => {
        try {
            const dato = await ProyectoConteo.findByIdAndUpdate(
                req.params.id, { activo: false }, { new: true }
            );
            if (!dato) return res.status(404).json({ message: 'Proyecto no encontrado' });
            res.json({ message: 'Proyecto desactivado', dato });
        } catch (e) { res.status(500).json({ message: e.message }); }
    },
    getActivo: async (req, res) => {
        try {
            const dato = await ProyectoConteo.findOne({ activo: true });
            res.json({ dato });
        } catch (e) { res.status(500).json({ message: e.message }); }
    }
};

// ── CONTEOS ───────────────────────────────────────────────────────────────────
exports.conteo = {
    getAll: async (req, res) => {
        try {
            const filter = {};
            if (req.query.idEstacion) filter.idEstacion = req.query.idEstacion;
            if (req.query.estado)     filter.estado     = req.query.estado;
            const datos = await Conteo.find(filter)
                .populate('idEstacion', 'nomenclatura municipio departamento')
                .populate('idProyecto', 'descripcion')
                .sort({ createdAt: -1 });
            res.json({ datos });
        } catch (e) { res.status(500).json({ message: e.message }); }
    },
    getById: async (req, res) => {
        try {
            const dato = await Conteo.findById(req.params.id)
                .populate('idEstacion')
                .populate('idProyecto');
            if (!dato) return res.status(404).json({ message: 'Conteo no encontrado' });
            res.json({ dato });
        } catch (e) { res.status(500).json({ message: e.message }); }
    },
    create: async (req, res) => {
        try {
            const dato = await Conteo.create(req.body);
            res.status(201).json({ message: 'Conteo creado', dato });
        } catch (e) { res.status(400).json({ message: e.message }); }
    },
    update: async (req, res) => {
        try {
            const dato = await Conteo.findByIdAndUpdate(req.params.id, req.body, { new: true });
            res.json({ message: 'Conteo actualizado', dato });
        } catch (e) { res.status(400).json({ message: e.message }); }
    },
    remove: async (req, res) => {
        try {
            await Conteo.findByIdAndDelete(req.params.id);
            res.json({ message: 'Conteo eliminado' });
        } catch (e) { res.status(500).json({ message: e.message }); }
    }
};

// ── SESIONES (bloqueo de sentidos) ────────────────────────────────────────────
exports.sesion = {
    // Ver qué sentidos están ocupados en un conteo
    getByConteo: async (req, res) => {
        try {
            const sesiones = await SesionConteo.find({ idConteo: req.params.idConteo, activo: true })
                .populate('idSentido', 'codSentido sentido urlSentImg');
            res.json({ sesiones });
        } catch (e) { res.status(500).json({ message: e.message }); }
    },
    // Encuestador toma un sentido
    tomar: async (req, res) => {
        try {
            const { idConteo, idSentido } = req.body;
            const usuario = `${req.user?.nombres || ''} ${req.user?.apellidos || ''}`.trim() || req.user?.user || 'desconocido';

            // Verificar que el sentido no esté ocupado
            const ocupado = await SesionConteo.findOne({ idConteo, idSentido, activo: true });
            if (ocupado) return res.status(409).json({ message: `Sentido ocupado por ${ocupado.usuario}` });

            // Verificar que el usuario no tenga ya otro sentido en este conteo
            const miSesion = await SesionConteo.findOne({ idConteo, usuario, activo: true });
            if (miSesion) return res.status(409).json({ message: 'Ya tienes un sentido activo en este conteo' });

            const sesion = await SesionConteo.create({ idConteo, idSentido, usuario });
            pushSSE(idConteo, { tipo: 'sesion', action: 'tomar', idSentido, usuario });
            res.status(201).json({ message: 'Sentido tomado', sesion });
        } catch (e) { res.status(400).json({ message: e.message }); }
    },
    // Encuestador libera su sentido
    liberar: async (req, res) => {
        try {
            const { idConteo } = req.params;
            const usuario = `${req.user?.nombres || ''} ${req.user?.apellidos || ''}`.trim() || req.user?.user || 'desconocido';
            const sesion = await SesionConteo.findOneAndUpdate(
                { idConteo, usuario, activo: true },
                { activo: false },
                { new: true }
            );
            if (!sesion) return res.status(404).json({ message: 'No tienes sesión activa' });
            pushSSE(idConteo, { tipo: 'sesion', action: 'liberar', idSentido: sesion.idSentido, usuario });
            res.json({ message: 'Sentido liberado' });
        } catch (e) { res.status(500).json({ message: e.message }); }
    },
    // Supervisor libera TODAS las sesiones de un conteo (reset de emergencia)
    liberarTodas: async (req, res) => {
        try {
            const { idConteo } = req.params;
            const result = await SesionConteo.updateMany({ idConteo, activo: true }, { activo: false });
            pushSSE(idConteo, { tipo: 'sesion', action: 'liberarTodas' });
            res.json({ message: `${result.modifiedCount} sesión(es) liberada(s)` });
        } catch (e) { res.status(500).json({ message: e.message }); }
    }
};

// ── DETALLE CONTEO (registrar vehículo) ───────────────────────────────────────
exports.detalle = {
    // Registrar 1 vehículo (1 click)
    registrar: async (req, res) => {
        try {
            const usuario = `${req.user?.nombres || ''} ${req.user?.apellidos || ''}`.trim() || req.user?.user || 'desconocido';
            const { idConteo, idEstacion, idSentido, idCatCont } = req.body;

            // Verificar que el conteo esté EN PROCESO
            const conteo = await Conteo.findById(idConteo);
            if (!conteo) return res.status(404).json({ message: 'Conteo no encontrado' });
            if (conteo.estado !== 'EN PROCESO') return res.status(400).json({ message: 'El conteo no está en proceso' });

            const ahora = new Date();
            const detalle = await DetalleConteo.create({ idConteo, idEstacion, idSentido, idCatCont, hora: ahora, usuario });

            // Obtener resumen actualizado para SSE
            const resumen = await resumenConteo(idConteo);
            pushSSE(idConteo, { tipo: 'detalle', resumen });

            res.status(201).json({ message: 'Registrado', detalle });
        } catch (e) { res.status(400).json({ message: e.message }); }
    },

    // Obtener todos los detalles de un conteo
    getByConteo: async (req, res) => {
        try {
            const detalles = await DetalleConteo.find({ idConteo: req.params.idConteo })
                .populate('idSentido', 'codSentido sentido')
                .populate('idCatCont', 'catCont urlCatCont')
                .sort({ hora: -1 });
            res.json({ detalles });
        } catch (e) { res.status(500).json({ message: e.message }); }
    },

    // Resumen acumulado para el panel
    resumen: async (req, res) => {
        try {
            const data = await resumenConteo(req.params.idConteo);
            res.json(data);
        } catch (e) { res.status(500).json({ message: e.message }); }
    },

    // Eliminar último registro del encuestador (deshacer click)
    deshacer: async (req, res) => {
        try {
            const usuario = `${req.user?.nombres || ''} ${req.user?.apellidos || ''}`.trim() || req.user?.user || 'desconocido';
            const { idConteo } = req.params;
            const ultimo = await DetalleConteo.findOne({ idConteo, usuario }).sort({ hora: -1 });
            if (!ultimo) return res.status(404).json({ message: 'No hay registros para deshacer' });
            await ultimo.deleteOne();
            const resumen = await resumenConteo(idConteo);
            pushSSE(idConteo, { tipo: 'detalle', resumen });
            res.json({ message: 'Último registro eliminado' });
        } catch (e) { res.status(500).json({ message: e.message }); }
    }
};

// ── CATÁLOGOS ─────────────────────────────────────────────────────────────────
exports.catalogo = {
    getCats: async (req, res) => {
        try {
            const datos = await CatConteo.find();
            res.json({ datos });
        } catch (e) { res.status(500).json({ message: e.message }); }
    },
    getSentidos: async (req, res) => {
        try {
            const datos = await SentidoConteo.find().sort({ codSentido: 1 });
            res.json({ datos });
        } catch (e) { res.status(500).json({ message: e.message }); }
    }
};

// ── SSE endpoint ──────────────────────────────────────────────────────────────
exports.sse = (req, res) => {
    const { idConteo } = req.params;
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    if (!sseClients[idConteo]) sseClients[idConteo] = [];
    sseClients[idConteo].push(res);

    // Enviar estado inicial
    resumenConteo(idConteo).then(data => {
        res.write(`data: ${JSON.stringify({ tipo: 'init', resumen: data })}\n\n`);
    });

    req.on('close', () => {
        sseClients[idConteo] = (sseClients[idConteo] || []).filter(c => c !== res);
    });
};

// ── Helper: resumen acumulado por sentido y categoría ─────────────────────────
async function resumenConteo(idConteo) {
    const detalles = await DetalleConteo.find({ idConteo })
        .populate('idSentido', 'codSentido sentido urlSentImg')
        .populate('idCatCont', 'catCont urlCatCont');

    const sesiones = await SesionConteo.find({ idConteo, activo: true });

    // Agrupar: { [idSentido]: { sentido, codSentido, urlSentImg, total, cats: { [catCont]: n } } }
    const mapa = {};
    for (const d of detalles) {
        const sid  = d.idSentido?._id?.toString();
        const cat  = d.idCatCont?.catCont;
        if (!sid || !cat) continue;
        if (!mapa[sid]) {
            mapa[sid] = {
                idSentido:  sid,
                codSentido: d.idSentido.codSentido,
                sentido:    d.idSentido.sentido,
                urlSentImg: d.idSentido.urlSentImg,
                total: 0,
                cats: {}
            };
        }
        mapa[sid].cats[cat] = (mapa[sid].cats[cat] || 0) + 1;
        mapa[sid].total++;
    }

    const totalGeneral = detalles.length;
    return { por_sentido: Object.values(mapa), total: totalGeneral, sesiones };
}
