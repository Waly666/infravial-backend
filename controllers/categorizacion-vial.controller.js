const { Types } = require('mongoose');
const Jornada = require('../models/Jornada');
const CategorizacionVial = require('../models/CategorizacionVial');
const { calcularCategorizacion } = require('../models/CategorizacionVial');

function normCodMunDivipol(cod) {
    if (cod == null || cod === '') return null;
    return String(cod).replace(/\D/g, '').padStart(5, '0').slice(-5);
}
function normCodDeptoDivipol(cod) {
    if (cod == null || cod === '') return null;
    return String(cod).replace(/\D/g, '').padStart(2, '0').slice(-2);
}

/**
 * Si viene idJornada válido, alinea departamento, municipio y códigos con la jornada.
 */
async function mergePayloadConJornada(body) {
    const jid = body.idJornada;
    if (jid == null || jid === '') return body;
    if (!Types.ObjectId.isValid(String(jid))) {
        const err = new Error('idJornada inválido');
        err.statusCode = 400;
        throw err;
    }

    const j = await Jornada.findById(jid).lean();
    if (!j) {
        const err = new Error('Jornada no encontrada');
        err.statusCode = 400;
        throw err;
    }

    const departamento = (j.dpto || body.departamento || '').trim();
    const municipio    = (j.municipio || body.municipio || '').trim();
    if (!departamento || !municipio) {
        const err = new Error('La jornada no tiene departamento y municipio definidos');
        err.statusCode = 400;
        throw err;
    }

    return {
        ...body,
        idJornada:    new Types.ObjectId(String(jid)),
        departamento,
        municipio,
        deptoDivipol: normCodDeptoDivipol(j.codDepto) || body.deptoDivipol || null,
        munDivipol:   normCodMunDivipol(j.codMunicipio) || body.munDivipol || null
    };
}
const {
    generarMatrizXlsxBuffer,
    generarMatrizPdfBuffer,
    safeFilenamePart
} = require('../utils/categorizacionMatrizExport');

// ── GET /categorizacion-vial ─────────────────────────────────────────────────
exports.getAll = async (req, res) => {
    try {
        const { departamento, municipio, clasificacion, page = 1, limit = 20 } = req.query;
        const filter = {};
        if (departamento) filter.departamento = new RegExp(departamento, 'i');
        if (municipio)    filter.municipio    = new RegExp(municipio,    'i');
        if (clasificacion) filter.clasificacion = clasificacion;

        const skip  = (Number(page) - 1) * Number(limit);
        const total = await CategorizacionVial.countDocuments(filter);
        const datos = await CategorizacionVial.find(filter)
            .populate('idJornada',    'municipio dpto codMunicipio codDepto fechaJornada estado')
            .populate('creadoPor',    'nombres apellidos')
            .populate('modificadoPor','nombres apellidos')
            .sort({ fechaCreacion: -1 })
            .skip(skip)
            .limit(Number(limit));

        res.json({ total, page: Number(page), limit: Number(limit), datos });
    } catch (err) {
        res.status(500).json({ message: 'Error al obtener categorizaciones', error: err.message });
    }
};

// ── GET /categorizacion-vial/:id/matriz?format=xlsx|pdf ───────────────────────
exports.exportMatriz = async (req, res) => {
    try {
        const format = String(req.query.format || 'xlsx').toLowerCase();
        if (!['xlsx', 'pdf'].includes(format)) {
            return res.status(400).json({ message: 'Use format=xlsx o format=pdf' });
        }
        const doc = await CategorizacionVial.findById(req.params.id).lean();
        if (!doc) {
            return res.status(404).json({ message: 'Categorización no encontrada' });
        }
        const base = safeFilenamePart(doc.nombreVia || 'categorizacion');
        if (format === 'xlsx') {
            const buf = generarMatrizXlsxBuffer(doc);
            res.setHeader(
                'Content-Type',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            );
            res.setHeader(
                'Content-Disposition',
                `attachment; filename="Matriz_categorizacion_${base}.xlsx"`
            );
            return res.send(buf);
        }
        const buf = await generarMatrizPdfBuffer(doc);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="Matriz_categorizacion_${base}.pdf"`
        );
        return res.send(buf);
    } catch (err) {
        res.status(500).json({
            message: 'Error al generar matriz de categorización',
            error:   err.message
        });
    }
};

// ── GET /categorizacion-vial/:id ─────────────────────────────────────────────
exports.getById = async (req, res) => {
    try {
        const doc = await CategorizacionVial.findById(req.params.id)
            .populate('idJornada',    'municipio dpto codMunicipio codDepto fechaJornada estado')
            .populate('creadoPor',    'nombres apellidos')
            .populate('modificadoPor','nombres apellidos');
        if (!doc) return res.status(404).json({ message: 'Categorización no encontrada' });
        res.json(doc);
    } catch (err) {
        res.status(500).json({ message: 'Error al obtener categorización', error: err.message });
    }
};

// ── POST /categorizacion-vial ────────────────────────────────────────────────
exports.create = async (req, res) => {
    try {
        const { funcionalidad, tpd, disenoGeometrico, poblacion } = req.body;

        // Calcular puntajes y clasificación automáticamente
        const scoring = calcularCategorizacion({ funcionalidad, tpd, disenoGeometrico, poblacion });

        const { nombreFuncionario, entidadFuncionario, fechaClasificacion, ...restBody } = req.body;
        const merged = await mergePayloadConJornada(restBody);

        const doc = new CategorizacionVial({
            ...merged,
            ...scoring,
            nombreFuncionario,
            entidadFuncionario,
            fechaClasificacion: fechaClasificacion ? new Date(fechaClasificacion) : new Date(),
            creadoPor: req.user?.id
        });

        await doc.save();
        const out = await CategorizacionVial.findById(doc._id)
            .populate('idJornada', 'municipio dpto codMunicipio codDepto fechaJornada estado')
            .populate('creadoPor', 'nombres apellidos')
            .populate('modificadoPor', 'nombres apellidos');
        res.status(201).json(out);
    } catch (err) {
        if (err.statusCode === 400) {
            return res.status(400).json({ message: err.message });
        }
        if (err.name === 'ValidationError') {
            return res.status(400).json({ message: err.message });
        }
        res.status(500).json({ message: 'Error al crear categorización', error: err.message });
    }
};

// ── PUT /categorizacion-vial/:id ─────────────────────────────────────────────
exports.update = async (req, res) => {
    try {
        const { funcionalidad, tpd, disenoGeometrico, poblacion } = req.body;

        const scoring = calcularCategorizacion({ funcionalidad, tpd, disenoGeometrico, poblacion });

        const { nombreFuncionario, entidadFuncionario, fechaClasificacion, ...restBody } = req.body;

        let patch = { ...restBody };
        const jVal = restBody.idJornada;
        if (jVal === null || jVal === '') {
            patch.idJornada = null;
        } else if (jVal !== undefined) {
            patch = await mergePayloadConJornada(patch);
        }

        const doc = await CategorizacionVial.findByIdAndUpdate(
            req.params.id,
            {
                ...patch,
                ...scoring,
                nombreFuncionario,
                entidadFuncionario,
                ...(fechaClasificacion !== undefined && fechaClasificacion !== null && fechaClasificacion !== ''
                    ? { fechaClasificacion: new Date(fechaClasificacion) }
                    : {}),
                modificadoPor:     req.user?.id,
                fechaModificacion: new Date()
            },
            { new: true, runValidators: true }
        )
            .populate('idJornada', 'municipio dpto codMunicipio codDepto fechaJornada estado')
            .populate('creadoPor', 'nombres apellidos')
            .populate('modificadoPor', 'nombres apellidos');

        if (!doc) return res.status(404).json({ message: 'Categorización no encontrada' });
        res.json(doc);
    } catch (err) {
        if (err.statusCode === 400) {
            return res.status(400).json({ message: err.message });
        }
        if (err.name === 'ValidationError') {
            return res.status(400).json({ message: err.message });
        }
        res.status(500).json({ message: 'Error al actualizar categorización', error: err.message });
    }
};

// ── DELETE /categorizacion-vial/:id ─────────────────────────────────────────
exports.remove = async (req, res) => {
    try {
        const doc = await CategorizacionVial.findByIdAndDelete(req.params.id);
        if (!doc) return res.status(404).json({ message: 'Categorización no encontrada' });
        res.json({ message: 'Categorización eliminada' });
    } catch (err) {
        res.status(500).json({ message: 'Error al eliminar categorización', error: err.message });
    }
};

// ── GET /categorizacion-vial/preview ─────────────────────────────────────────
// Calcula el resultado sin guardar (para vista previa en el formulario)
exports.preview = async (req, res) => {
    try {
        const { funcionalidad, tpd, disenoGeometrico, poblacion } = req.query;
        if (!funcionalidad || !tpd || !disenoGeometrico || !poblacion) {
            return res.status(400).json({ message: 'Faltan parámetros' });
        }
        const scoring = calcularCategorizacion({ funcionalidad, tpd, disenoGeometrico, poblacion });
        res.json(scoring);
    } catch (err) {
        res.status(500).json({ message: 'Error al calcular preview', error: err.message });
    }
};

// ── GET /categorizacion-vial/estadisticas ────────────────────────────────────
exports.estadisticas = async (req, res) => {
    try {
        const resumen = await CategorizacionVial.aggregate([
            {
                $group: {
                    _id: '$clasificacion',
                    total: { $sum: 1 }
                }
            }
        ]);

        const totales = { PRIMARIA: 0, SECUNDARIA: 0, TERCIARIA: 0 };
        resumen.forEach(r => { totales[r._id] = r.total; });

        const totalRegistros = totales.PRIMARIA + totales.SECUNDARIA + totales.TERCIARIA;

        res.json({ totalRegistros, ...totales });
    } catch (err) {
        res.status(500).json({ message: 'Error al obtener estadísticas', error: err.message });
    }
};
