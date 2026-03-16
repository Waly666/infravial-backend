const EsquemaPerfil  = require('../models/EsquemaPerfil');
const SenVert        = require('../models/SenVert');
const UbicSenHor     = require('../models/UbicSenHor');
const Demarcacion    = require('../models/Demarcacion');
const ObservacionVia = require('../models/ObservacionVia');
const ObservacionSV  = require('../models/ObservacionSV');
const ObservacionSH  = require('../models/ObservacionSH');
const ObsSemaforo    = require('../models/ObsSemaforo');
const Divipol        = require('../models/Divipol');
const Zat            = require('../models/Zat');
const Comuna         = require('../models/Comuna');
const Barrio         = require('../models/Barrio');
const PreguntaEncVia = require('../models/PreguntaEncVia');

// Función genérica CRUD
function crudService(Model) {
    return {
        getAll:    async (filtros = {}) => await Model.find(filtros),
        getById:   async (id)          => await Model.findById(id),
        create:    async (data)        => await new Model(data).save(),
        update:    async (id, data)    => await Model.findByIdAndUpdate(id, data, { new: true }),
        remove:    async (id)          => await Model.findByIdAndDelete(id)
    };
}

module.exports = {
    esquemaPerfil:  crudService(EsquemaPerfil),
    senVert:        crudService(SenVert),
    ubicSenHor:     crudService(UbicSenHor),
    demarcacion:    crudService(Demarcacion),
    observacionVia: crudService(ObservacionVia),
    observacionSV:  crudService(ObservacionSV),
    observacionSH:  crudService(ObservacionSH),
    obsSemaforo:    crudService(ObsSemaforo),
    divipol: {
        getAll:  async (filtros = {}) => await Divipol.find(filtros),
        getById: async (id)           => await Divipol.findById(id),
        buscar:  async (q)            => await Divipol.find({
            $or: [
                { divipolMunicipio: { $regex: q, $options: 'i' } },
                { divipolDepto:     { $regex: q, $options: 'i' } },
                { divipolMunCod:    { $regex: q, $options: 'i' } }
            ]
        }).limit(20),
        create:  async (data) => await new Divipol(data).save(),
        update:  async (id, data) => await Divipol.findByIdAndUpdate(id, data, { new: true }),
        remove:  async (id) => await Divipol.findByIdAndDelete(id)
    },
    zat:     crudService(Zat),
    comuna:  crudService(Comuna),
    barrio:  crudService(Barrio),
    preguntaEncVia: crudService(PreguntaEncVia)
};