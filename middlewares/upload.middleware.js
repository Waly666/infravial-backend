const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

function getStorage(carpeta) {
    return multer.diskStorage({
        destination: (req, file, cb) => {
            const dir = path.join(__dirname, `../uploads/${carpeta}`);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            cb(null, dir);
        },
        filename: (req, file, cb) => {
            const ext      = path.extname(file.originalname);
            const nombre   = `${carpeta}_${Date.now()}${ext}`;
            cb(null, nombre);
        }
    });
}

function getStorageCatalogo(carpeta) {
    return multer.diskStorage({
        destination: (req, file, cb) => {
            const dir = path.join(__dirname, `../uploads/catalogos/${carpeta}`);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            cb(null, dir);
        },
        filename: (req, file, cb) => {
            const ext    = path.extname(file.originalname);
            const nombre = req.body.codigo
                ? `${req.body.codigo}${ext}`
                : `${carpeta}_${Date.now()}${ext}`;
            cb(null, nombre);
        }
    });
}

const fileFilter = (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.bmp', '.gif'];
    const ext     = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten imágenes INFRAVIAL'), false);
    }
};

const limits = { fileSize: 5 * 1024 * 1024 }; // 5MB

// Fotos de campo
const uploadFotoViaTramo   = multer({ storage: getStorage('fotos/via-tramos'),   fileFilter, limits });
const uploadFotoSenVert    = multer({ storage: getStorage('fotos/sen-vert'),      fileFilter, limits });
const uploadFotoSenHor     = multer({ storage: getStorage('fotos/sen-hor'),       fileFilter, limits });
const uploadFotoSemaforo   = multer({ storage: getStorage('fotos/semaforos'),     fileFilter, limits });
const uploadFotoControlSem = multer({ storage: getStorage('fotos/control-sem'),   fileFilter, limits });

// Fotos de catálogos
const uploadCatSenVert     = multer({ storage: getStorageCatalogo('sen-vert'),       fileFilter, limits });
const uploadCatEsquema     = multer({ storage: getStorageCatalogo('esquema-perfil'), fileFilter, limits });
const uploadCatUbicSenHor  = multer({ storage: getStorageCatalogo('ubic-sen-hor'),   fileFilter, limits });
const uploadCatDemarcacion = multer({ storage: getStorageCatalogo('demarcaciones'),  fileFilter, limits });

module.exports = {
    uploadFotoViaTramo,
    uploadFotoSenVert,
    uploadFotoSenHor,
    uploadFotoSemaforo,
    uploadFotoControlSem,
    uploadCatSenVert,
    uploadCatEsquema,
    uploadCatUbicSenHor,
    uploadCatDemarcacion
};