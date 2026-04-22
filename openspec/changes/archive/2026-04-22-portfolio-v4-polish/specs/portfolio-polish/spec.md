# Specification: portfolio-v4-polish

## Context
**Stack**: Astro 5.0+, React 19, Vercel KV, Vercel Cron.
**Target**: Refactorizar la integración con GitHub para centralizar la seguridad en el backend, mejorar la robustez del procesado de metadatos y optimizar la performance mediante una estrategia de Warm Cache.

## Requirements (RFC 2119)
1. El cliente (Navegador) **MUST NOT** realizar llamadas directas a `api.github.com`.
2. El proxy de backend **MUST** utilizar la variable de entorno secreta `GITHUB_TOKEN` para todas las peticiones autenticadas.
3. El sistema de cache **MUST** utilizar Vercel KV para persistir los datos de los proyectos.
4. El parser de README **MUST** soportar Frontmatter en formatos YAML y JSON.
5. En ausencia de Frontmatter, el parser **MUST** intentar extraer datos mediante las expresiones regulares existentes (Fallback).
6. La sincronización por Cron **MUST** procesar proyectos en lotes (batches) de máximo 5 elementos por ejecución para respetar los límites de Vercel KV.

---

## Scenarios

### 1. Seguridad (GitHub Proxy)

**Scenario 1.1: Consulta exitosa de repositorio desde el Proxy**
- **Given**: Una sesión de usuario activa en el Portfolio.
- **When**: Un componente solicita detalles de un repositorio a través de `/api/github?action=getRepoDetails&repo=my-repo`.
- **Then**: El servidor **MUST** inyectar el `GITHUB_TOKEN` privado en los headers de la petición a GitHub.
- **Then**: La respuesta **MUST** llegar al cliente sin exponer tokens ni headers sensibles en la pestaña de red del navegador.

**Scenario 1.2: Fetch de actividad pública sin exposición de credenciales**
- **Given**: El componente `LogTerminal` intentando mostrar los últimos eventos.
- **When**: Se invoca la acción `getActivity` en el endpoint de la API local.
- **Then**: El backend **MUST** filtrar y devolver únicamente los datos necesarios para el terminal, eliminando metadatos internos de GitHub.

### 2. Robustez del Parser (README)

**Scenario 2.1: Parseo de metadatos mediante YAML Frontmatter**
- **Given**: Un archivo README.md que inicia con un bloque `---` conteniendo claves como `title`, `description` y `techstack`.
- **When**: El servicio `getRepoDetails` procesa el contenido del archivo.
- **Then**: Los metadatos **MUST** ser extraídos y tipados correctamente según la interfaz `ProjectMetadata`.

**Scenario 2.2: Parseo de metadatos mediante JSON Frontmatter**
- **Given**: Un archivo README.md que inicia con un bloque `---json` o similar.
- **When**: El parser detecta la estructura JSON.
- **Then**: El sistema **MUST** procesar el bloque como JSON válido y extraer las propiedades correspondientes.

**Scenario 2.3: Fallback a expresiones regulares (Double-Pass)**
- **Given**: Un README.md antiguo sin bloques de Frontmatter.
- **When**: El primer pase del parser falla al no encontrar delimitadores `---`.
- **Then**: El sistema **MUST** ejecutar un segundo pase usando Regex para buscar secciones de encabezados específicos (ej: `## Tech Stack`).

### 3. Warm Cache (Vercel KV & Cron)

**Scenario 3.1: Sincronización incremental por lotes**
- **Given**: Una lista total de 15 proyectos y un cursor de sincronización `sync_cursor` con valor `0` en Vercel KV.
- **When**: Se ejecuta la tarea programada (Vercel Cron) cada hora.
- **Then**: El script **MUST** sincronizar los proyectos del 0 al 4.
- **Then**: Al finalizar, **MUST** actualizar el `sync_cursor` a `5`.

**Scenario 3.2: Reinicio del ciclo de sincronización**
- **Given**: El `sync_cursor` se encuentra al final de la lista de proyectos.
- **When**: El Cron se ejecuta nuevamente.
- **Then**: El sistema **MUST** resetear el `sync_cursor` a `0` y comenzar un nuevo ciclo de actualización.

### 4. UX Sync (Core Logs)

**Scenario 4.1: Detección de desfase de caché local**
- **Given**: El administrador ha realizado cambios en los datos de un proyecto que se guardaron en `localStorage`.
- **When**: Se abre el `AdminPanel` y se compara el hash de los datos locales con el hash del cache en Vercel KV.
- **Then**: Si los hashes no coinciden, el terminal Core **MUST** mostrar el mensaje: `[WARN] LOCAL_BUFFER_OUT_OF_SYNC: Changes pending server synchronization`.

### 5. Manejo de Errores y Límites

**Scenario 5.1: Agotamiento de Rate Limit en GitHub API**
- **Given**: La API de GitHub devuelve un código `403` o `429` (Rate Limit Exceeded).
- **When**: El Proxy de backend detecta este estado.
- **Then**: El Proxy **SHOULD** servir la última copia válida desde Vercel KV (stale-while-revalidate pattern) incluyendo un header `X-Cache-Status: Stale`.

**Scenario 5.2: Fallo de conexión con Vercel KV**
- **Given**: Un problema de red impide la conexión con el almacenamiento KV.
- **When**: Se intenta realizar una lectura o escritura.
- **Then**: El sistema **MUST** fallar de forma segura (graceful degradation), intentando obtener datos directamente de GitHub si es posible, o mostrando un error controlado al usuario.
