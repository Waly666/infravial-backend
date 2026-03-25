# Rutina profesional de backup y restore (MongoDB)

Esta rutina aplica para el despliegue Docker de INFRAVIAL y cubre:
- Generacion de copia (`mongodump` comprimido)
- Integridad (SHA256)
- Registro de eventos (`backup-registry.jsonl`)
- Restore controlado con backup preventivo
- Retencion automatica por dias

## Requisitos

- VPS con Docker
- Contenedor Mongo corriendo con nombre `infravial-mongo` (ajustable por variable)
- Herramientas en host: `bash`, `sha256sum`, `rg`

## Scripts

- `scripts/backup_mongo.sh`
- `scripts/restore_mongo.sh`

> Recomendado: ejecutarlos desde el servidor, dentro del repo `backend`.

## Permisos iniciales

```bash
chmod +x scripts/backup_mongo.sh scripts/restore_mongo.sh
```

## Variables soportadas

- `BACKUP_DIR` (default: `/var/backups/infravial`)
- `REGISTRY_FILE` (default: `$BACKUP_DIR/backup-registry.jsonl`)
- `MONGO_CONTAINER` (default: `infravial-mongo`)
- `MONGO_DB` (default: `infravialDB`)
- `RETENTION_DAYS` (default: `30`)
- `ACTOR` (identifica quien ejecuta la accion)

## Backup manual

```bash
ACTOR="admin-walter" ./scripts/backup_mongo.sh
```

Salida esperada:
- ruta del archivo generado
- hash SHA256
- tamano
- registro en `backup-registry.jsonl`

## Restore manual

```bash
ACTOR="admin-walter" ./scripts/restore_mongo.sh /var/backups/infravial/infravial_infravialDB_YYYYMMDDTHHMMSSZ.archive.gz
```

Comportamiento:
1. Verifica existencia de archivo.
2. Valida checksum contra registro (si existe).
3. Crea backup preventivo.
4. Ejecuta restore con `--drop`.
5. Registra evento de restore.

## Programacion automatica (cron)

Ejemplo diario a las 02:30 UTC:

```bash
crontab -e
```

Agregar:

```cron
30 2 * * * cd /ruta/backend && ACTOR=cron-nightly ./scripts/backup_mongo.sh >> /var/log/infravial-backup.log 2>&1
```

## Auditoria y trazabilidad

- El registro queda en JSON Lines (`backup-registry.jsonl`) para parseo y evidencias.
- Cada entrada contiene timestamps, actor, archivo y hash.
- Se puede integrar con SIEM o collector de logs sin cambiar formato.

## Buenas practicas recomendadas

- Copia externa (offsite): sincronizar `/var/backups/infravial` a otro servidor/S3.
- Cifrado en reposo: disco cifrado (LUKS) o bucket cifrado.
- Prueba de restore mensual en entorno de staging.
- Politica sugerida: 30 dias diarios + 12 mensuales.

