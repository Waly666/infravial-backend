const catalogoService = require('../services/catalogo.service');
const path = require('path');

function makeController(nombre) {
    return {
        getAll: async (req, res) => {
            try {
                const datos = await catalogoService[nombre].getAll(req.query);
                res.json({ message: `${nombre} INFRAVIAL`, datos });
            } catch (err) {
                res.status(500).json({ message: err.message });
            }
        },
        getById: async (req, res) => {
            try {
                const dato = await catalogoService[nombre].getById(req.params.id);
                if (!dato) return res.status(404).json({ message: `${nombre} no encontrado INFRAVIAL` });
                res.json({ message: `${nombre} INFRAVIAL`, dato });
            } catch (err) {
                res.status(500).json({ message: err.message });
            }
        },
        create: async (req, res) => {
            try {
                // Si viene archivo adjunto agregar URL
                if (req.file) {
                    const campo = getCampoImagen(nombre);
                    req.body[campo] = `/uploads/catalogos/${getCarpeta(nombre)}/${req.file.filename}`;
                }
                const dato = await catalogoService[nombre].create(req.body);
                res.status(201).json({ message: `${nombre} creado INFRAVIAL`, dato });
            } catch (err) {
                res.status(400).json({ message: err.message });
            }
        },
        update: async (req, res) => {
            try {
                if (req.file) {
                    const campo = getCampoImagen(nombre);
                    req.body[campo] = `/uploads/catalogos/${getCarpeta(nombre)}/${req.file.filename}`;
                }
                const dato = await catalogoService[nombre].update(req.params.id, req.body);
                res.json({ message: `${nombre} actualizado INFRAVIAL`, dato });
            } catch (err) {
                res.status(400).json({ message: err.message });
            }
        },
        remove: async (req, res) => {
            try {
                await catalogoService[nombre].remove(req.params.id);
                res.json({ message: `${nombre} eliminado INFRAVIAL` });
            } catch (err) {
                res.status(500).json({ message: err.message });
            }
        }
    };
}

// Busqueda especial DIVIPOL
async function buscarDivipol(req, res) {
    try {
        const { q } = req.query;
        if (!q) return res.status(400).json({ message: 'Parámetro q requerido INFRAVIAL' });
        const datos = await catalogoService.divipol.buscar(q);
        res.json({ message: 'Búsqueda DIVIPOL INFRAVIAL', datos });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

function getCampoImagen(nombre) {
    const mapa = {
        esquemaPerfil: 'urlImgEsq',
        senVert:       'urlImgSenVert',
        ubicSenHor:    'urlImgUbic',
        demarcacion:   'urlDemImg'
    };
    return mapa[nombre] || 'urlImg';
}

function getCarpeta(nombre) {
    const mapa = {
        esquemaPerfil: 'esquema-perfil',
        senVert:       'sen-vert',
        ubicSenHor:    'ubic-sen-hor',
        demarcacion:   'demarcaciones'
    };
    return mapa[nombre] || nombre;
}

module.exports = {
    esquemaPerfil:  makeController('esquemaPerfil'),
    senVert:        makeController('senVert'),
    ubicSenHor:     makeController('ubicSenHor'),
    demarcacion:    makeController('demarcacion'),
    observacionVia: makeController('observacionVia'),
    observacionSV:  makeController('observacionSV'),
    observacionSH:  makeController('observacionSH'),
    obsSemaforo:    makeController('obsSemaforo'),
    divipol:        { ...makeController('divipol'), buscar: buscarDivipol },
    zat:            makeController('zat'),
    comuna:         makeController('comuna'),
    barrio:         makeController('barrio'),
    preguntaEncVia: makeController('preguntaEncVia')
};