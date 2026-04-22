# Change Proposal: portfolio-v4-polish

## Intent
Reforzar la seguridad, robustez y performance del ecosistema del portfolio mediante la centralización de la lógica de datos en el servidor, la implementación de una estrategia de warm-cache persistente y la mejora en la precisión del procesado de metadatos de proyectos.

## Objectives
1. **Seguridad (Tokens)**: Eliminar la exposición de `PUBLIC_GITHUB_TOKEN` migrando todos los consumos de la API de GitHub al backend (Proxy).
2. **Robustez README**: Implementar un parser híbrido (Frontmatter YAML/JSON + Fallback Regex) para extraer metadatos de proyectos de forma precisa.
3. **Warm Cache**: Implementar Vercel KV + Vercel Cron para mantener una copia de los datos de GitHub en el servidor, evitando rate limits y mejorando el tiempo de respuesta.
4. **UX Sync (Core Logic)**: Proveer feedback al administrador sobre el desfase entre el buffer local (`localStorage`) y el estado sincronizado en el servidor.
5. **Bugfix (Char Encoding)**: Reemplazar el uso de `atob` en el cliente por un decodificado robusto en el servidor que soporte caracteres no-ASCII.

## Scope
### Affected Files
- `src/pages/api/github.ts`: Se expandirá para manejar múltiples acciones (`GET` y `POST`).
- `src/lib/github.ts`: Se eliminará la dependencia de `PUBLIC_GITHUB_TOKEN` y se convertirá en un cliente del proxy interno.
- `src/components/admin/AdminPanel.tsx`: Migración de lógica de parseo al backend y adición de lógica de diffing.
- `src/components/systemlogs/LogTerminal.tsx`: Migración del fetch de actividad al proxy.
- `src/components/deployments/ProjectModal.tsx`: Migración del fetch de README al proxy.
- `src/pages/api/cron/sync.ts`: **NUEVO**. Orquestador de sincronización en batches.
- `vercel.json`: **NUEVO/MODIFICADO**. Configuración del cron schedule.

### Dependencies
- `@vercel/kv`: Para la persistencia del cache y el cursor de sincronización.

## Risks & Mitigations
- **Downtime en Sync**: Un error en el cron podría dejar el cache desactualizado. *Mitigación*: Implementar logs detallados en Vercel y fallback a datos locales en caso de fallo crítico.
- **Breaking Changes en READMEs**: El nuevo parser podría no detectar secciones en READMEs antiguos. *Mitigación*: Mantener las regex actuales como fallback de última instancia (Double-Pass Parsing).
- **Vercel KV Limits**: Exceder los límites de lectura/escritura en el tier gratuito. *Mitigación*: Batching de 5 proyectos por hora y TTL (Time-To-Live) optimizado.

## Action Plan
1. **Fase 1: Backend Foundations**
   - Instalar `@vercel/kv`.
   - Refactorizar `src/pages/api/github.ts` para soportar acciones: `getCache`, `getActivity`, `getRepoDetails`.
   - Implementar `Buffer.from(data, 'base64').toString('utf-8')` para evitar errores de codificación.
2. **Fase 2: Warm Cache & Cron**
   - Crear el endpoint de cron en `src/pages/api/cron/sync.ts`.
   - Implementar lógica de batches (5 proyectos) usando un puntero en KV.
   - Configurar `vercel.json` para ejecutar el cron cada hora.
3. **Fase 3: Parser de Metadatos**
   - Implementar parser de Frontmatter (YAML/JSON) en el backend.
   - Integrarlo en la acción `getRepoDetails`.
4. **Fase 4: Proxy Integration**
   - Actualizar `src/lib/github.ts` para apuntar a `/api/github`.
   - Refactorizar componentes (`LogTerminal`, `ProjectModal`, `AdminPanel`) para eliminar llamadas directas a GitHub.
5. **Fase 5: UX & Diffing**
   - Implementar comparación de hashes entre `localStorage` y Vercel KV en el `AdminPanel`.
   - Añadir aviso `[WARN] LOCAL_BUFFER_OUT_OF_SYNC` en la consola Core.

## Success Criteria
- No hay menciones a `PUBLIC_GITHUB_TOKEN` ni `api.github.com` en los archivos `.tsx`.
- El `AdminPanel` carga instantáneamente los datos de estrellas y lenguajes desde el cache.
- Los READMEs con Frontmatter YAML/JSON se parsean correctamente sin necesidad de secciones específicas.
- El log del sistema muestra la sincronización de batches sin errores de encoding.
