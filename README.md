# 🛣️ INFRAVIAL — Backend

### Tracking de Infraestructura Vial

API REST para el sistema de inventario vial. Gestiona vías, señales verticales, señales horizontales, semáforos, controladores semafóricos y cajas de inspección, con georreferenciación GeoJSON, control de jornadas y auditoría completa.

---

## 🛠️ Stack Tecnológico

| Tecnología     | Descripción                                   |
| -------------- | --------------------------------------------- |
| Node.js v18+   | Entorno de ejecución                          |
| Express v5     | Framework web                                 |
| MongoDB        | Base de datos NoSQL                           |
| Mongoose       | ODM para MongoDB                              |
| JWT            | Access Token (20min) + Refresh Token (7 días) |
| Bcrypt         | Encriptación de contraseñas (10 rondas)       |
| Multer         | Subida de fotos al servidor                   |
| Morgan + Audit | Logging dual: MongoDB + archivo diario        |

---

## 🗂️ Estructura del Proyecto

```
backend/
├── controllers/       # Lógica HTTP de respuesta
├── services/          # Lógica de negocio
├── models/            # Esquemas Mongoose (22 modelos)
├── routes/            # Endpoints y middlewares
├── middlewares/       # auth, jornada, logger, upload
├── seeds/             # Scripts de carga inicial de datos
├── uploads/           # Fotos de campo y catálogos
├── logs/              # Archivos de log diarios
├── data/              # Archivos Excel de catálogos
├── .env               # Variables de entorno
└── server.js          # Punto de entrada
```

---

## ⚙️ Instalación

```bash
git clone https://github.com/Waly666/infravial-backend.git
cd infravial-backend
npm install
```

Crea el archivo `.env`:

```
PORT=3000
MONGO_URI=mongodb://localhost:27017/infravialDB
SECRET_KEY=infravial_secret_123
REFRESH_SECRET_KEY=infravial_refresh_456
```

Carga los datos iniciales:

```bash
node seeds/seedUsers.js
node seeds/seedDivipol.js
node seeds/seedCatalogos.js
node seeds/seedEncuesta.js
```

Inicia el servidor:

```bash
npm run dev     # desarrollo
npm start       # producción
```

---

## 🔐 Roles y Permisos

| Rol           | Descripción                                                         |
| ------------- | ------------------------------------------------------------------- |
| `admin`       | Acceso total. Crea/finaliza jornadas, gestiona usuarios y catálogos |
| `supervisor`  | Ve todos los registros, aprueba y genera reportes                   |
| `encuestador` | Captura datos en campo con jornada activa                           |
| `invitado`    | Solo lectura                                                        |

---

## 🔄 Flujo de Jornadas

```
Admin crea Jornada (EN PROCESO)
        ↓
Encuestadores capturan datos
        ↓
Via_Tramos → Sen. Verticales, Sen. Horizontales, Semáforos
        ↓
Admin finaliza Jornada (FINALIZADO)
```

> ⚠️ Sin jornada activa los encuestadores no pueden registrar datos.

---

## 📡 Endpoints

### 🔑 Autenticación

| Método | Ruta            | Descripción                 |
| ------ | --------------- | --------------------------- |
| POST   | `/auth/login`   | Login con cédula + password |
| POST   | `/auth/refresh` | Renovar access token        |

### 👤 Usuarios

| Método | Ruta         | Auth  |
| ------ | ------------ | ----- |
| GET    | `/users`     | admin |
| POST   | `/users`     | admin |
| PUT    | `/users/:id` | admin |
| DELETE | `/users/:id` | admin |

### 📋 Jornadas

| Método | Ruta                      | Auth  |
| ------ | ------------------------- | ----- |
| GET    | `/jornadas`               | todos |
| GET    | `/jornadas/activa`        | todos |
| POST   | `/jornadas`               | admin |
| PUT    | `/jornadas/:id/finalizar` | admin |

### 🛣️ Vía Tramos

| Método | Ruta              | Auth         |
| ------ | ----------------- | ------------ |
| GET    | `/via-tramos`     | todos        |
| POST   | `/via-tramos`     | encuestador+ |
| PUT    | `/via-tramos/:id` | encuestador+ |
| DELETE | `/via-tramos/:id` | supervisor+  |

### 🚦 Señales y Semáforos

| Ruta base           | Descripción                     |
| ------------------- | ------------------------------- |
| `/sen-vert`         | Señales verticales existentes   |
| `/sen-hor`          | Señales horizontales existentes |
| `/semaforos`        | Semáforos                       |
| `/control-semaforo` | Controladores semafóricos       |
| `/cajas-inspeccion` | Cajas de inspección             |

### 📚 Catálogos

| Ruta                           | Descripción                        |
| ------------------------------ | ---------------------------------- |
| `/catalogos/divipol`           | Municipios Colombia (1104)         |
| `/catalogos/divipol/buscar?q=` | Búsqueda selectiva                 |
| `/catalogos/esquema-perfil`    | Esquemas de perfil vial            |
| `/catalogos/sen-vert`          | Catálogo señales verticales (331)  |
| `/catalogos/ubic-sen-hor`      | Ubicaciones señales horizontales   |
| `/catalogos/demarcaciones`     | Demarcaciones (64)                 |
| `/catalogos/obs-vias`          | Observaciones vía tramos           |
| `/catalogos/obs-sv`            | Observaciones señales verticales   |
| `/catalogos/obs-sh`            | Observaciones señales horizontales |
| `/catalogos/obs-semaforos`     | Observaciones semáforos            |
| `/catalogos/zats`              | Zonas de Análisis de Tránsito      |
| `/catalogos/comunas`           | Comunas                            |
| `/catalogos/barrios`           | Barrios                            |
| `/catalogos/preguntas-enc`     | 32 preguntas encuesta vial         |

### 📷 Subida de Fotos

| Ruta                       | Destino                    |
| -------------------------- | -------------------------- |
| POST `/upload/via-tramo`   | uploads/fotos/via-tramos/  |
| POST `/upload/sen-vert`    | uploads/fotos/sen-vert/    |
| POST `/upload/sen-hor`     | uploads/fotos/sen-hor/     |
| POST `/upload/semaforo`    | uploads/fotos/semaforos/   |
| POST `/upload/control-sem` | uploads/fotos/control-sem/ |

---

## 🗄️ Modelos MongoDB (22 colecciones)

| Modelo                                                    | Tipo                            |
| --------------------------------------------------------- | ------------------------------- |
| User                                                      | Seguridad                       |
| Audit                                                     | Logging                         |
| Divipol                                                   | Catálogo                        |
| Jornada                                                   | Control                         |
| ViaTramo                                                  | Inventario principal            |
| Zat, Comuna, Barrio                                       | Catálogos geográficos           |
| EsquemaPerfil                                             | Catálogo con imagen             |
| SenVert                                                   | Catálogo señales verticales     |
| ExistSenVert                                              | Inventario señales verticales   |
| UbicSenHor                                                | Catálogo con imagen             |
| Demarcacion                                               | Catálogo con imagen             |
| ExistSenHor                                               | Inventario señales horizontales |
| Semaforo                                                  | Inventario semáforos            |
| ControlSemaforo                                           | Inventario controladores        |
| CajaInspeccion                                            | Inventario cajas                |
| ObservacionVia, ObservacionSV, ObservacionSH, ObsSemaforo | Catálogos observaciones         |
| PreguntaEncVia, RespuestaEncVia                           | Encuesta vial                   |

---

## 📊 Lógica de Negocio Automática

**Clasificación vial** — se calcula automáticamente al guardar un via_tramo:

| Campo              | Lógica                                                   |
| ------------------ | -------------------------------------------------------- |
| `anchoTotalPerfil` | Suma de todas las medidas del perfil                     |
| `clasNacional`     | V1 a V9 según anchoTotalPerfil                           |
| `clasPrelacion`    | Autopistas/Arterias/etc según tipoVia y anchoTotalPerfil |

---

## 🔍 Auditoría Dual

| Canal                         | Descripción                                      |
| ----------------------------- | ------------------------------------------------ |
| MongoDB (colección audit)     | Consultas, filtros y reportes desde el dashboard |
| Archivo access-YYYY-MM-DD.log | Backup si MongoDB falla                          |

---

## 👥 Usuarios de Prueba

| Cédula   | Password | Rol         |
| -------- | -------- | ----------- |
| 12345678 | NIS00227 | admin       |
| 87654321 | Super123 | supervisor  |
| 11223344 | Encue123 | encuestador |
| 44332211 | Invit123 | invitado    |
