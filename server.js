require('dotenv').config();
const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
const path       = require('path');
const { logger } = require('./middlewares/logger.middleware');

// ── Rutas ──────────────────────────────────────────
const authRoutes         = require('./routes/auth.routes');
const userRoutes         = require('./routes/user.routes');
const jornadaRoutes      = require('./routes/jornada.routes');
const viaTramoRoutes     = require('./routes/viaTramo.routes');
const existSenVertRoutes = require('./routes/senVert.routes');
const existSenHorRoutes  = require('./routes/senHor.routes');
const semaforoRoutes     = require('./routes/semaforo.routes');
const controlSemRoutes   = require('./routes/controlSem.routes');
const cajaInspRoutes     = require('./routes/cajaInsp.routes');
const encuestaRoutes     = require('./routes/encuestaVial.routes');
const catalogoRoutes     = require('./routes/catalogo.routes');
const uploadRoutes       = require('./routes/upload.routes');
const auditRoutes        = require('./routes/audit.routes');
const dashboardRoutes    = require('./routes/dashboard.routes');
const backupRoutes       = require('./routes/backup.routes');
const importRoutes       = require('./routes/import.routes');
const dataTransferRoutes      = require('./routes/data-transfer.routes');
const categorizacionVialRoutes = require('./routes/categorizacion-vial.routes');
const sincRoutes               = require('./routes/sinc.routes');

const app = express();

// ── Middlewares globales ───────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(logger);

// ── Archivos estáticos (fotos) ─────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Bienvenida ─────────────────────────────────────
app.get('/', (req, res) => res.send('BIENVENIDO A INFRAVIAL API 🛣️'));

// ── Registro de rutas ──────────────────────────────
app.use('/auth',             authRoutes);
app.use('/users',            userRoutes);
app.use('/jornadas',         jornadaRoutes);
app.use('/via-tramos',       viaTramoRoutes);
app.use('/sen-vert',         existSenVertRoutes);
app.use('/sen-hor',          existSenHorRoutes);
app.use('/semaforos',        semaforoRoutes);
app.use('/control-semaforo', controlSemRoutes);
app.use('/cajas-inspeccion', cajaInspRoutes);
app.use('/encuesta-vial',    encuestaRoutes);
app.use('/catalogos',        catalogoRoutes);
app.use('/upload',           uploadRoutes);
app.use('/audit',            auditRoutes);
app.use('/dashboard',        dashboardRoutes);
app.use('/backups',          backupRoutes);
app.use('/imports',          importRoutes);
app.use('/data-transfer',      dataTransferRoutes);
app.use('/categorizacion-vial', categorizacionVialRoutes);
app.use('/sinc',                sincRoutes);

// ── Conexión MongoDB ───────────────────────────────
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('Conectado a MongoDB ✅');
        app.listen(process.env.PORT, () => {
            console.log(`Servidor INFRAVIAL escuchando en el puerto ${process.env.PORT} ✅`);
        });
    })
    .catch(err => console.error('Error conectando a MongoDB:', err));