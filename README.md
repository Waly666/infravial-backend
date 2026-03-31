# INFRAVIAL — Backend

Sistema de inventario vial: API REST para vías (tramos), señales verticales y horizontales, semáforos, controladores, cajas de inspección, encuesta vial, catálogos, jornadas, auditoría y respaldos. Datos georreferenciados (GeoJSON), fotos en disco y autenticación JWT.

---

## Stack tecnológico

| Tecnología | Uso |
|------------|-----|
| **Node.js** (v18+ recomendado) | Runtime |
| **Express 5** | Framework HTTP |
| **MongoDB** | Base de datos |
| **Mongoose 9** | ODM y esquemas |
| **JWT** (jsonwebtoken) | Access + refresh token |
| **Bcrypt** | Hash de contraseñas |
| **Multer** | Subida de archivos (fotos, Excel, restauración) |
| **Morgan + middleware propio** | Logging HTTP y auditoría |
| **BSON / EJSON** | Serialización en backups |
| **Archiver + Unzipper** | Backup ZIP completo (BD + carpeta `uploads/`) |
| **XLSX** | Importación Excel |
| **Dotenv** | Variables de entorno |
| **CORS** | Orígenes permitidos (SPA) |

---

## Estructura del proyecto

```
backend/
├── controllers/     # Manejo HTTP por dominio
├── services/        # Lógica de negocio; agregados MongoDB en `*.estadisticas.service.js` (vía tramo, ExistSenHor, ExistSenVert)
├── models/          # Esquemas Mongoose (+ _register.js para carga conjunta)
├── routes/          # Rutas Express
├── middlewares/     # auth, jornada, logger, upload
├── seeds/           # Datos iniciales (usuarios, divipol, catálogos, encuesta)
├── scripts/         # Importación CSV/Excel auxiliar
├── uploads/         # Fotos de campo y catálogos (/uploads/…)
├── backups/         # Archivos generados (.zip / legado .json.gz)
├── logs/            # Logs diarios (si aplica)
├── .env
└── server.js        # Entrada
```

Variables de entorno típicas:

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/infravialDB
SECRET_KEY=...
REFRESH_SECRET_KEY=...
# Opcional: carpeta de respaldos (por defecto ./backups)
# BACKUP_DIR=C:\datos\infravial-backups
```

---

## Instalación y arranque

```bash
cd backend
npm install
```

Crear `.env` (ver arriba). Luego seeds según necesidad:

```bash
node seeds/seedUsers.js
node seeds/seedDivipol.js
node seeds/seedCatalogos.js
node seeds/seedEncuesta.js
```

```bash
npm run dev    # nodemon
npm start      # producción
```

La API sirve estáticos en **`/uploads`** (fotos referenciadas desde MongoDB).

---

## Roles

| Rol | Alcance resumido |
|-----|------------------|
| **admin** | Usuarios, jornadas, catálogos, importación Excel, respaldos, purgas, auditoría, estadísticas agregadas |
| **supervisor** | Inventario amplio, reportes y **estadísticas agregadas** (vía tramos, SH, SV), sin gestión de usuarios/catálogos globales |
| **encuestador** | Alta/edición de inventario con jornada activa |
| **invitado** | Lectura (según rutas) |

---

## Rutas principales (resumen)

| Prefijo | Descripción |
|---------|-------------|
| `/auth` | Login, refresh |
| `/users` | CRUD usuarios (admin) |
| `/jornadas` | Jornadas y jornada activa |
| `/via-tramos` | Tramos (LineString GeoJSON, fotos) |
| `/sen-vert`, `/sen-hor` | Señales existentes |
| `/semaforos`, `/control-semaforo`, `/cajas-inspeccion` | Otros inventarios |
| `/encuesta-vial` | Preguntas/respuestas encuesta vial |
| `/catalogos/*` | Divipol, ZAT, comunas, barrios, catálogos de señalización, observaciones |
| `/upload/*` | Subida de imágenes por tipo de formulario |
| `/audit` | Auditoría |
| `/dashboard` | Agregados para panel |
| `/backups` | Crear/listar/descargar backup, restaurar (servidor o archivo), purga selectiva |
| `/imports` | Importación Excel (admin) |

### Estadísticas agregadas (admin y supervisor)

Endpoints **GET** con JWT y rol `admin` o `supervisor`. Devuelven bloques de conteos por campo (y en algunos casos rangos numéricos) para alimentar tablas, porcentajes y gráficos en el frontend.

| Ruta | Colección / alcance |
|------|----------------------|
| `GET /via-tramos/estadisticas` | `ViaTramo`: filtros directos por `idJornada`, `fechaDesde` / `fechaHasta` (`fechaCreacion`), `departamento`, `municipio`, `tipoLocalidad`. |
| `GET /sen-hor/estadisticas` | `ExistSenHor`: misma jornada y rango de fechas sobre la señal; corte geográfico vía tramos vinculados (`idViaTramo` ∈ tramos que cumplan departamento/municipio/tipo localidad). |
| `GET /sen-vert/estadisticas` | `ExistSenVert`: mismo esquema de filtros que señales horizontales (jornada, fechas de la señal, geo por tramo). |

Implementación: `services/viaTramo.estadisticas.service.js`, `services/existSenHor.estadisticas.service.js`, `services/existSenVert.estadisticas.service.js` y métodos `getEstadisticas` en los controladores/rutas correspondientes (**registrados antes** de rutas con `/:id`).

### Respaldos (`/backups`, solo admin)

- **POST `/backups/create`** — Genera **`infravial-full-backup-*.zip`**: `manifest.json`, `database.json.gz` (volcado de colecciones) y carpeta **`uploads/`**.
- **GET `/backups/logs`** — Historial (`BackupEvent`).
- **GET `/backups/download/:archivo`** — Descarga `.zip` o legado `.json.gz` del directorio de backups.
- **POST `/backups/restore`** — Body `{ "archivo": "nombre-en-servidor" }`. Si es `.zip`, restaura BD y **reemplaza** `uploads/`. Si es `.json.gz` antiguo, solo BD.
- **POST `/backups/restore-upload`** — `multipart/form-data`, campo **`file`**: `.zip` o `.json.gz` (archivo en disco temporal, límite configurable en controller).
- **POST `/backups/purge`** — Limpieza por grupos + confirmación `BORRAR` (ver implementación en `backup.service.js`).

---

## Modelos (referencia)

Incluyen entre otros: `User`, `Audit`, `BackupEvent`, `Jornada`, `Divipol`, `ViaTramo`, `Zat`, `Comuna`, `Barrio`, catálogos (`SenVert`, `EsquemaPerfil`, `UbicSenHor`, `Demarcacion`), inventario (`ExistSenVert`, `ExistSenHor`, `Semaforo`, `ControlSemaforo`, `CajaInspeccion`), observaciones, `PreguntaEncVia`, `RespuestaEncVia`. La lista exacta está en `models/` y `models/_register.js`.

---

## Lógica destacada

- **Clasificación vial** (tramos): cálculo automático de anchos y clasificación al guardar (servicio de vía tramo).
- **Auditoría**: registro en colección y/o logs según configuración.
- **GeoJSON**: coordenadas en esquemas de inventario; compatibles con mapas en el frontend.
- **Estadísticas**: agregaciones MongoDB (`$match`, `$group`) reutilizando criterios de filtro coherentes con listados y mapa.

---

## Usuarios de prueba (si aplica tras seed)

| Documento | Contraseña | Rol |
|-----------|------------|-----|
| 12345678 | NIS00227 | admin |
| 87654321 | Super123 | supervisor |
| 11223344 | Encue123 | encuestador |
| 44332211 | Invit123 | invitado |

*(Ajustar según `seedUsers.js` real del proyecto.)*

---

## Documentación ampliada

Ver en la raíz del repositorio (o carpeta `docs/`): **documento técnico** en Markdown/Word con arquitectura frontend + API y stack detallado.

---

**INFRAVIAL** — Backend API.
