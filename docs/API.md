# Catálogo de Endpoints REST

Prefijo global: `/api/v1` (configurable vía `API_PREFIX`). Documentación
interactiva (Swagger) en `${API_PREFIX}/docs`.

Convenciones:

- **Acceso**: todos los endpoints son públicos, no requieren autenticación.
- **Listados**: paginados vía `PaginationQueryDto` (`page`, `limit`) y
  devueltos como `PaginatedResponseDto<T>` (`{ data: T[], meta: { total,
  page, limit, totalPages } }`).
- **Errores**: formato uniforme vía `AllExceptionsFilter`:
  `{ statusCode, error, message, path, timestamp }`.

## Fase 1 (implementados)

### Teams (`/api/v1/teams`)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/teams` | Listado paginado. Filtros: `confederation`, `search` (nombre/país, case-insensitive). |
| GET | `/teams/:id` | Detalle de un equipo. |
| GET | `/teams/:id/ranking-history` | Serie temporal de ranking FIFA / Elo. |
| POST | `/teams` | Crear equipo (nombre único). |
| PATCH | `/teams/:id` | Actualizar equipo (re-valida unicidad de nombre). |
| DELETE | `/teams/:id` | Eliminar equipo. |

### Matches (`/api/v1/matches`)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/matches` | Listado paginado. Filtros: `competitionId`, `teamId` (local o visitante), `status`, `dateFrom`/`dateTo`. |
| GET | `/matches/:id` | Detalle de un partido, incluye `statistics[]` por equipo. |
| POST | `/matches` | Crear partido (valida `homeTeamId !== awayTeamId`). |
| PATCH | `/matches/:id` | Actualizar partido (re-valida equipos distintos si cambian). |
| DELETE | `/matches/:id` | Eliminar partido. |
| PUT | `/matches/:id/statistics` | Upsert de estadísticas de un equipo participante (`matchId` + `teamId` único). |

### Health (`/api/v1/health`)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/health` | Estado de la API y conectividad con PostgreSQL. |

## Roadmap (no implementado en Fase 1)

| Fase | Endpoints | Descripción |
|---|---|---|
| 2 | `GET/POST/PATCH/DELETE /competitions[/:id]`, `GET /competitions/:id/standings` | CRUD de competiciones y tabla de posiciones |
| 2 | `GET /stats/teams/:id`, `GET /stats/head-to-head?teamA=&teamB=` | Motor estadístico: forma reciente, enfrentamientos directos |
| 3 | `GET /predictions/matches/:id`, `POST /predictions/matches/:id/generate` | Predicción Elo + Poisson para un partido |
| 4 | `POST /simulations`, `GET /simulations/:id`, `GET /simulations/:id/results[/teams/:teamId]` | Simulación Monte Carlo de torneo (async, BullMQ) |
| 5 | `GET /dashboard/summary`, `GET /dashboard/rankings`, WS `/ws` (`prediction.updated`, `simulation.progress`) | Dashboard agregado y eventos en tiempo real |
