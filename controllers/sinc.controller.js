const sincService = require('../services/sinc.service');
const SincEje                = require('../models/SincEje');
const SincFotoEje            = require('../models/SincFotoEje');
const SincPuente             = require('../models/SincPuente');
const SincMuro               = require('../models/SincMuro');
const SincTunel              = require('../models/SincTunel');
const SincSitioCritico       = require('../models/SincSitioCritico');
const SincObraDrenaje        = require('../models/SincObraDrenaje');
const SincPropiedades        = require('../models/SincPropiedades');
// Nivel Detallado Mc
const SincMcModels = require('../models/SincMc');

// ─── DOMINIOS (catálogos en memoria) ─────────────────────────────────────────

function getDominios(req, res) {
    res.json({
        // Eje
        tipoRed:      SincEje.D_TIPORED,
        tipoEje:      SincEje.D_TIPOEJE,
        sentido:      SincEje.D_SENTIDO,
        categoria:    SincEje.D_CATEGORIA,
        // FotoEje
        calzada:      SincFotoEje.D_CALZADA,
        // Propiedades de segmento
        tipoSuperf:   SincPropiedades.D_TIPOSUPERF,
        tipoTerr:     SincPropiedades.D_TIPOTERR,
        estadoVia:    SincPropiedades.D_ESTADO,
        // Puentes
        tipoEstruc:   SincPuente.D_TIPOESTRUC,
        materialPte:  SincPuente.D_MATERIAL,
        estadoPte:    SincPuente.D_ESTADOPTE,
        // Muros
        ladoMuro:     SincMuro.D_LADO,
        // Túneles
        estadoTunel:  SincTunel.D_ESTADO,
        // Sitios críticos
        tipoSitio:    SincSitioCritico.D_TIPO,
        severidadSitio: SincSitioCritico.D_SEVERIDAD,
        ladoSitio:    SincSitioCritico.D_LADO,
        // Obras de drenaje
        tipoObd:      SincObraDrenaje.D_TIPO,
        materialObd:  SincObraDrenaje.D_MATERIAL,
        estadoServObd: SincObraDrenaje.D_ESTADOSERV,
        estadoGenObd: SincObraDrenaje.D_ESTADOGEN,
        // Nivel Detallado — Mc
        mc: {
            berma:         {
                nivelTransito:     SincMcModels.SincMcBerma.D_NIVEL_TRANSITO,
                tipoPavimento:     SincMcModels.SincMcBerma.D_TIPO_PAVIMENTO,
                unidadFuncional:   SincMcModels.SincMcBerma.D_UNIDAD_FUNCIONAL,
                proyecto:          SincMcModels.SincMcBerma.D_PROYECTO_CARRETERO,
                municipio:         SincMcModels.SincMcBerma.D_MUNICIPIO,
                departamento:      SincMcModels.SincMcBerma.D_DEPARTAMENTO
            },
            calzada:       {
                nivelTransito:           SincMcModels.SincMcCalzada.D_NIVEL_TRANSITO,
                tipoPavimento:           SincMcModels.SincMcCalzada.D_TIPO_PAVIMENTO,
                tipoSubrasante:          SincMcModels.SincMcCalzada.D_TIPO_SUBRASANTE,
                materialSubrasante:      SincMcModels.SincMcCalzada.D_MATERIAL_SUBRASANTE,
                materialEstructPavimento: SincMcModels.SincMcCalzada.D_MATERIAL_ESTRUCT_PAV,
                unidadFuncional:         SincMcModels.SincMcCalzada.D_UNIDAD_FUNCIONAL,
                proyecto:                SincMcModels.SincMcCalzada.D_PROYECTO_CARRETERO,
                municipio:               SincMcModels.SincMcCalzada.D_MUNICIPIO,
                departamento:            SincMcModels.SincMcCalzada.D_DEPARTAMENTO
            },
            cco:           {
                estado:           SincMcModels.SincMcCco.D_ESTADO,
                unidadFuncional:  SincMcModels.SincMcCco.D_UNIDAD_FUNCIONAL,
                proyecto:         SincMcModels.SincMcCco.D_PROYECTO_CARRETERO,
                municipio:        SincMcModels.SincMcCco.D_MUNICIPIO,
                departamento:     SincMcModels.SincMcCco.D_DEPARTAMENTO
            },
            cicloruta:     {
                tipoPavimento:            SincMcModels.SincMcCicloruta.D_TIPO_PAVIMENTO,
                tipoSubrasante:           SincMcModels.SincMcCicloruta.D_TIPO_SUBRASANTE,
                materialSubrasante:       SincMcModels.SincMcCicloruta.D_MATERIAL_SUBRASANTE,
                materialEstructPavimento: SincMcModels.SincMcCicloruta.D_MATERIAL_ESTRUCT_PAV,
                estado:                   SincMcModels.SincMcCicloruta.D_ESTADO,
                unidadFuncional:          SincMcModels.SincMcCicloruta.D_UNIDAD_FUNCIONAL,
                proyecto:                 SincMcModels.SincMcCicloruta.D_PROYECTO_CARRETERO,
                municipio:                SincMcModels.SincMcCicloruta.D_MUNICIPIO,
                departamento:             SincMcModels.SincMcCicloruta.D_DEPARTAMENTO
            },
            cuneta:        {
                seccion:            SincMcModels.SincMcCuneta.D_SECCION,
                material:           SincMcModels.SincMcCuneta.D_MATERIAL,
                estado:             SincMcModels.SincMcCuneta.D_ESTADO,
                unidadFuncional:    SincMcModels.SincMcCuneta.D_UNIDAD_FUNCIONAL,
                proyecto:           SincMcModels.SincMcCuneta.D_PROYECTO_CARRETERO,
                municipio:          SincMcModels.SincMcCuneta.D_MUNICIPIO,
                departamento:       SincMcModels.SincMcCuneta.D_DEPARTAMENTO
            },
            defensaVial:   {
                estado:            SincMcModels.SincMcDefensaVial.D_ESTADO,
                material:          SincMcModels.SincMcDefensaVial.D_MATERIAL,
                pintura:           SincMcModels.SincMcDefensaVial.D_PINTURA,
                unidadFuncional:   SincMcModels.SincMcDefensaVial.D_UNIDAD_FUNCIONAL,
                proyecto:          SincMcModels.SincMcDefensaVial.D_PROYECTO_CARRETERO,
                municipio:         SincMcModels.SincMcDefensaVial.D_MUNICIPIO,
                departamento:      SincMcModels.SincMcDefensaVial.D_DEPARTAMENTO
            },
            its:           {
                tipo:                     SincMcModels.SincMcDispositivoIts.D_TIPO,
                estado:                   SincMcModels.SincMcDispositivoIts.D_ESTADO,
                estadoGeneral:            SincMcModels.SincMcDispositivoIts.D_ESTADO_GENERAL,
                tieneIPv6:                SincMcModels.SincMcDispositivoIts.D_TIENE_IPV6,
                tienePagoElectronico:     SincMcModels.SincMcDispositivoIts.D_TIENE_PAGO_ELECTRONICO,
                unidadFuncional:          SincMcModels.SincMcDispositivoIts.D_UNIDAD_FUNCIONAL,
                proyecto:                 SincMcModels.SincMcDispositivoIts.D_PROYECTO_CARRETERO,
                municipio:                SincMcModels.SincMcDispositivoIts.D_MUNICIPIO,
                departamento:             SincMcModels.SincMcDispositivoIts.D_DEPARTAMENTO,
                protocoloComunicacion:    SincMcModels.SincMcDispositivoIts.D_PROTOCOLO_COMUNICACION,
                tipoSuministroEnergetico: SincMcModels.SincMcDispositivoIts.D_TIPO_SUMINISTRO,
                medioTransmision:         SincMcModels.SincMcDispositivoIts.D_MEDIO_TRANSMISION,
                sentidoTrafico:           SincMcModels.SincMcDispositivoIts.D_SENTIDO_TRAFICO
            },
            drenaje:       {
                tipoDrenaje:          SincMcModels.SincMcDrenaje.D_TIPO_DRENAJE,
                material:             SincMcModels.SincMcDrenaje.D_MATERIAL,
                unidadFuncional:      SincMcModels.SincMcDrenaje.D_UNIDAD_FUNCIONAL,
                proyecto:             SincMcModels.SincMcDrenaje.D_PROYECTO_CARRETERO,
                municipio:            SincMcModels.SincMcDrenaje.D_MUNICIPIO,
                departamento:         SincMcModels.SincMcDrenaje.D_DEPARTAMENTO
            },
            peaje:         {
                unidadFuncional:      SincMcModels.SincMcEstacionPeaje.D_UNIDAD_FUNCIONAL,
                proyecto:             SincMcModels.SincMcEstacionPeaje.D_PROYECTO_CARRETERO,
                municipio:            SincMcModels.SincMcEstacionPeaje.D_MUNICIPIO,
                departamento:         SincMcModels.SincMcEstacionPeaje.D_DEPARTAMENTO
            },
            pesaje:        {
                unidadFuncional:      SincMcModels.SincMcEstacionPesaje.D_UNIDAD_FUNCIONAL,
                proyecto:             SincMcModels.SincMcEstacionPesaje.D_PROYECTO_CARRETERO,
                municipio:            SincMcModels.SincMcEstacionPesaje.D_MUNICIPIO,
                departamento:         SincMcModels.SincMcEstacionPesaje.D_DEPARTAMENTO,
                estado:               SincMcModels.SincMcEstacionPesaje.D_ESTADO
            },
            luminaria:     {
                unidadFuncional:      SincMcModels.SincMcLuminaria.D_UNIDAD_FUNCIONAL,
                municipio:            SincMcModels.SincMcLuminaria.D_MUNICIPIO,
                departamento:         SincMcModels.SincMcLuminaria.D_DEPARTAMENTO
            },
            muro:          {
                tipoMuro:             SincMcModels.SincMcMuro.D_TIPO_MURO,
                estadoMaterial:       SincMcModels.SincMcMuro.D_ESTADO_MATERIAL,
                unidadFuncional:      SincMcModels.SincMcMuro.D_UNIDAD_FUNCIONAL,
                proyecto:             SincMcModels.SincMcMuro.D_PROYECTO_CARRETERO,
                municipio:            SincMcModels.SincMcMuro.D_MUNICIPIO,
                departamento:         SincMcModels.SincMcMuro.D_DEPARTAMENTO
            },
            puente:        {
                tipoEstructura:       SincMcModels.SincMcPuente.D_TIPO_ESTRUCTURA,
                nivelTransito:        SincMcModels.SincMcPuente.D_NIVEL_TRANSITO,
                unidadFuncional:      SincMcModels.SincMcPuente.D_UNIDAD_FUNCIONAL,
                proyecto:             SincMcModels.SincMcPuente.D_PROYECTO_CARRETERO,
                municipio:            SincMcModels.SincMcPuente.D_MUNICIPIO,
                departamento:         SincMcModels.SincMcPuente.D_DEPARTAMENTO
            },
            senalVertical: {
                claseSenal:         SincMcModels.SincMcSenalVertical.D_CLASE_SENAL,
                tipoSenal:          SincMcModels.SincMcSenalVertical.D_TIPO_SENAL_VERTICAL,
                ladoSenal:          SincMcModels.SincMcSenalVertical.D_LADO_SENAL,
                formaSenal:         SincMcModels.SincMcSenalVertical.D_FORMA_SENAL,
                estadoSenal:        SincMcModels.SincMcSenalVertical.D_ESTADO_SENAL,
                ubicaSenal:         SincMcModels.SincMcSenalVertical.D_UBICA_SENAL,
                faseSenal:          SincMcModels.SincMcSenalVertical.D_FASE_SENAL,
                soporteSenal:       SincMcModels.SincMcSenalVertical.D_SOPORTE_SENAL,
                estadoSoporte:      SincMcModels.SincMcSenalVertical.D_ESTADO_SOPORTE,
                materialPlaca:      SincMcModels.SincMcSenalVertical.D_MATERIAL_PLACA,
                laminaRefectante:   SincMcModels.SincMcSenalVertical.D_LAMINA_REFLECTANTE,
                accionSenal:        SincMcModels.SincMcSenalVertical.D_ACCION_SENAL,
                departamentoUbic:   SincMcModels.SincMcSenalVertical.D_DEPARTAMENTO,
                divipola:           SincMcModels.SincMcSenalVertical.D_DIVIPOLA,
                claseVia:           SincMcModels.SincMcSenalVertical.D_CLASE_VIA,
                calzada:            SincMcModels.SincMcSenalVertical.D_CALZADA,
                sentido:            SincMcModels.SincMcSenalVertical.D_SENTIDO,
                tipoSup:            SincMcModels.SincMcSenalVertical.D_TIPO_SUPERF
            },
            separador:     {
                tipoPavimento:        SincMcModels.SincMcSeparador.D_TIPO_PAVIMENTO,
                unidadFuncional:      SincMcModels.SincMcSeparador.D_UNIDAD_FUNCIONAL,
                proyecto:             SincMcModels.SincMcSeparador.D_PROYECTO_CARRETERO,
                municipio:            SincMcModels.SincMcSeparador.D_MUNICIPIO,
                departamento:         SincMcModels.SincMcSeparador.D_DEPARTAMENTO
            },
            tunel:         {
                nivelTransito:        SincMcModels.SincMcTunel.D_NIVEL_TRANSITO,
                tipoPavimento:        SincMcModels.SincMcTunel.D_TIPO_PAVIMENTO,
                unidadFuncional:      SincMcModels.SincMcTunel.D_UNIDAD_FUNCIONAL,
                proyecto:             SincMcModels.SincMcTunel.D_PROYECTO_CARRETERO,
                municipio:            SincMcModels.SincMcTunel.D_MUNICIPIO,
                departamento:         SincMcModels.SincMcTunel.D_DEPARTAMENTO
            },
            zona:          {
                unidadFuncional:      SincMcModels.SincMcZonaServicio.D_UNIDAD_FUNCIONAL,
                proyecto:             SincMcModels.SincMcZonaServicio.D_PROYECTO_CARRETERO,
                municipio:            SincMcModels.SincMcZonaServicio.D_MUNICIPIO,
                departamento:         SincMcModels.SincMcZonaServicio.D_DEPARTAMENTO,
                estado:               SincMcModels.SincMcZonaServicio.D_ESTADO
            }
        }
    });
}

// ─── EJES ────────────────────────────────────────────────────────────────────

async function getAllEjes(req, res) {
    try {
        const ejes = await sincService.getAllEjes(req.query);
        res.json({ message: 'Ejes SINC', ejes });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function getEjeById(req, res) {
    try {
        const eje = await sincService.getEjeById(req.params.id);
        if (!eje) return res.status(404).json({ message: 'Eje no encontrado' });
        res.json({ message: 'Eje SINC', eje });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function getResumenEje(req, res) {
    try {
        const resumen = await sincService.getResumenEje(req.params.id);
        res.json({ message: 'Resumen eje SINC', resumen });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function createEje(req, res) {
    try {
        const eje = await sincService.createEje(req.body, req.user.id);
        res.status(201).json({ message: 'Eje creado', eje });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

async function updateEje(req, res) {
    try {
        const eje = await sincService.updateEje(req.params.id, req.body, req.user.id);
        if (!eje) return res.status(404).json({ message: 'Eje no encontrado' });
        res.json({ message: 'Eje actualizado', eje });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

async function removeEje(req, res) {
    try {
        await sincService.removeEje(req.params.id);
        res.json({ message: 'Eje eliminado (con todos sus elementos)' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// ─── FOTO EJE ────────────────────────────────────────────────────────────────

async function getFotosByEje(req, res) {
    try {
        const items = await sincService.getFotosByEje(req.params.idEje);
        res.json({ message: 'Fotos del eje', items });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function createFotoEje(req, res) {
    try {
        const item = await sincService.createFotoEje(req.body, req.user.id);
        res.status(201).json({ message: 'Foto de eje creada', item });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

async function updateFotoEje(req, res) {
    try {
        const item = await sincService.updateFotoEje(req.params.id, req.body, req.user.id);
        res.json({ message: 'Foto de eje actualizada', item });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

async function removeFotoEje(req, res) {
    try {
        await sincService.removeFotoEje(req.params.id);
        res.json({ message: 'Foto de eje eliminada' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// ─── PRS ────────────────────────────────────────────────────────────────────

async function getPrsByEje(req, res) {
    try {
        const items = await sincService.getPrsByEje(req.params.idEje);
        res.json({ message: 'PRS del eje', items });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function createPrs(req, res) {
    try {
        const item = await sincService.createPrs(req.body, req.user.id);
        res.status(201).json({ message: 'PRS creado', item });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

async function updatePrs(req, res) {
    try {
        const item = await sincService.updatePrs(req.params.id, req.body, req.user.id);
        res.json({ message: 'PRS actualizado', item });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

async function removePrs(req, res) {
    try {
        await sincService.removePrs(req.params.id);
        res.json({ message: 'PRS eliminado' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// ─── PROPIEDADES ─────────────────────────────────────────────────────────────

async function getPropiedadesByEje(req, res) {
    try {
        const items = await sincService.getPropiedadesByEje(req.params.idEje);
        res.json({ message: 'Propiedades del eje', items });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function createPropiedades(req, res) {
    try {
        const item = await sincService.createPropiedades(req.body, req.user.id);
        res.status(201).json({ message: 'Propiedades creadas', item });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

async function updatePropiedades(req, res) {
    try {
        const item = await sincService.updatePropiedades(req.params.id, req.body, req.user.id);
        res.json({ message: 'Propiedades actualizadas', item });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

async function removePropiedades(req, res) {
    try {
        await sincService.removePropiedades(req.params.id);
        res.json({ message: 'Propiedades eliminadas' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// ─── PUENTES ─────────────────────────────────────────────────────────────────

async function getPuentesByEje(req, res) {
    try {
        const items = await sincService.getPuentesByEje(req.params.idEje);
        res.json({ message: 'Puentes del eje', items });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function getPuenteById(req, res) {
    try {
        const item = await sincService.getPuenteById(req.params.id);
        if (!item) return res.status(404).json({ message: 'Puente no encontrado' });
        res.json({ message: 'Puente SINC', item });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function createPuente(req, res) {
    try {
        const item = await sincService.createPuente(req.body, req.user.id);
        res.status(201).json({ message: 'Puente creado', item });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

async function updatePuente(req, res) {
    try {
        const item = await sincService.updatePuente(req.params.id, req.body, req.user.id);
        res.json({ message: 'Puente actualizado', item });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

async function removePuente(req, res) {
    try {
        await sincService.removePuente(req.params.id);
        res.json({ message: 'Puente eliminado' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// ─── MUROS ───────────────────────────────────────────────────────────────────

async function getMurosByEje(req, res) {
    try {
        const items = await sincService.getMurosByEje(req.params.idEje);
        res.json({ message: 'Muros del eje', items });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function createMuro(req, res) {
    try {
        const item = await sincService.createMuro(req.body, req.user.id);
        res.status(201).json({ message: 'Muro creado', item });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

async function updateMuro(req, res) {
    try {
        const item = await sincService.updateMuro(req.params.id, req.body, req.user.id);
        res.json({ message: 'Muro actualizado', item });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

async function removeMuro(req, res) {
    try {
        await sincService.removeMuro(req.params.id);
        res.json({ message: 'Muro eliminado' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// ─── TÚNELES ─────────────────────────────────────────────────────────────────

async function getTunelesByEje(req, res) {
    try {
        const items = await sincService.getTunelesByEje(req.params.idEje);
        res.json({ message: 'Túneles del eje', items });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function createTunel(req, res) {
    try {
        const item = await sincService.createTunel(req.body, req.user.id);
        res.status(201).json({ message: 'Túnel creado', item });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

async function updateTunel(req, res) {
    try {
        const item = await sincService.updateTunel(req.params.id, req.body, req.user.id);
        res.json({ message: 'Túnel actualizado', item });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

async function removeTunel(req, res) {
    try {
        await sincService.removeTunel(req.params.id);
        res.json({ message: 'Túnel eliminado' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// ─── SITIOS CRÍTICOS ─────────────────────────────────────────────────────────

async function getSitiosByEje(req, res) {
    try {
        const items = await sincService.getSitiosByEje(req.params.idEje);
        res.json({ message: 'Sitios críticos del eje', items });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function createSitio(req, res) {
    try {
        const item = await sincService.createSitio(req.body, req.user.id);
        res.status(201).json({ message: 'Sitio crítico creado', item });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

async function updateSitio(req, res) {
    try {
        const item = await sincService.updateSitio(req.params.id, req.body, req.user.id);
        res.json({ message: 'Sitio crítico actualizado', item });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

async function removeSitio(req, res) {
    try {
        await sincService.removeSitio(req.params.id);
        res.json({ message: 'Sitio crítico eliminado' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// ─── OBRAS DE DRENAJE ────────────────────────────────────────────────────────

async function getObrasByEje(req, res) {
    try {
        const items = await sincService.getObrasByEje(req.params.idEje);
        res.json({ message: 'Obras de drenaje del eje', items });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function createObra(req, res) {
    try {
        const item = await sincService.createObra(req.body, req.user.id);
        res.status(201).json({ message: 'Obra de drenaje creada', item });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

async function updateObra(req, res) {
    try {
        const item = await sincService.updateObra(req.params.id, req.body, req.user.id);
        res.json({ message: 'Obra de drenaje actualizada', item });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

async function removeObra(req, res) {
    try {
        await sincService.removeObra(req.params.id);
        res.json({ message: 'Obra de drenaje eliminada' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// ─── NIVEL DETALLADO Mc — CRUD GENÉRICO ─────────────────────────────────────

async function getMcByEje(req, res) {
    try {
        const items = await sincService.getMcByEje(req.params.capa, req.params.idEje);
        res.json({ message: 'Elementos Mc', items });
    } catch (err) { res.status(err.message.includes('no válida') ? 400 : 500).json({ message: err.message }); }
}

async function createMc(req, res) {
    try {
        const item = await sincService.createMc(req.params.capa, req.body, req.user.id);
        res.status(201).json({ message: 'Elemento Mc creado', item });
    } catch (err) { res.status(400).json({ message: err.message }); }
}

async function updateMc(req, res) {
    try {
        const item = await sincService.updateMc(req.params.capa, req.params.id, req.body, req.user.id);
        res.json({ message: 'Elemento Mc actualizado', item });
    } catch (err) { res.status(400).json({ message: err.message }); }
}

async function removeMc(req, res) {
    try {
        await sincService.removeMc(req.params.capa, req.params.id);
        res.json({ message: 'Elemento Mc eliminado' });
    } catch (err) { res.status(500).json({ message: err.message }); }
}

module.exports = {
    getDominios,
    // Ejes
    getAllEjes, getEjeById, getResumenEje, createEje, updateEje, removeEje,
    // FotoEje
    getFotosByEje, createFotoEje, updateFotoEje, removeFotoEje,
    // PRS
    getPrsByEje, createPrs, updatePrs, removePrs,
    // Propiedades
    getPropiedadesByEje, createPropiedades, updatePropiedades, removePropiedades,
    // Puentes
    getPuentesByEje, getPuenteById, createPuente, updatePuente, removePuente,
    // Muros
    getMurosByEje, createMuro, updateMuro, removeMuro,
    // Túneles
    getTunelesByEje, createTunel, updateTunel, removeTunel,
    // Sitios críticos
    getSitiosByEje, createSitio, updateSitio, removeSitio,
    // Obras drenaje
    getObrasByEje, createObra, updateObra, removeObra,
    // Nivel Detallado Mc — genérico
    getMcByEje, createMc, updateMc, removeMc
};
