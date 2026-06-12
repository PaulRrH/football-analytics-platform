# Catálogo de Endpoints REST

Prefijo global: `/api/v1` (configurable vía `API_PREFIX`). Documentación
interactiva (Swagger) en `${API_PREFIX}/docs`.

Convenciones:

- **Acceso**: `Público` (decorado con `@Public()`, no requiere token) o
  `Autenticado` / `<rol>` (requiere `Authorization: Bearer <accessToken>` y,
  cuando aplica, uno de los roles indicados).
- **Listados**: paginados vía `PaginationQueryDto` (`page`, `limit`) y
  devueltos como `PaginatedResponseDto<T>` (`{ data: T[], meta: { total,
  page, limit, totalPages } }`).
- **Errores**: formato uniforme vía `AllExceptionsFilter`:
  `{ statusCode, error, message, path, timestamp }`.

## Fase 1 (implementados)

### Auth (`/api/v1/auth`)

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| POST | `/auth/register` | Público (rate-limited: 5/min) | Crea un usuario con rol `USER`. Devuelve perfil + tokens. |
| POST | `/auth/login` | Público (rate-limited: 5/min) | Login con email/contraseña. Devuelve perfil + tokens. |
| POST | `/auth/refresh` | Público (rate-limited: 5/min) | Rota access+refresh token a partir de un refresh token válido. |
| POST | `/auth/logout` | Autenticado | Revoca el refresh token indicado. |
| GET | `/auth/me` | Autenticado | Perfil del usuario autenticado. |

### Users (`/api/v1/users`) — `SUPER_ADMIN`

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/users` | Crear usuario (con rol arbitrario). |
| GET | `/users` | Listado paginado. |
| GET | `/users/:id` | Detalle de usuario. |
| PATCH | `/users/:id` | Actualizar datos/rol/estado. |
| DELETE | `/users/:id` | Eliminar usuario. |

### Teams (`/api/v1/teams`)

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/teams` | Público | Listado paginado. Filtros: `confederation`, `search` (nombre/país, case-insensitive). |
| GET | `/teams/:id` | Público | Detalle de un equipo. |
| GET | `/teams/:id/ranking-history` | Público | Serie temporal de ranking FIFA / Elo. |
| POST | `/teams` | `ANALYST`, `SUPER_ADMIN` | Crear equipo (nombre único). |
| PATCH | `/teams/:id` | `ANALYST`, `SUPER_ADMIN` | Actualizar equipo (re-valida unicidad de nombre). |
| DELETE | `/teams/:id` | `ANALYST`, `SUPER_ADMIN` | Eliminar equipo. |

### Matches (`/api/v1/matches`)

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/matches` | Público | Listado paginado. Filtros: `competitionId`, `teamId` (local o visitante), `status`, `dateFrom`/`dateTo`. |
| GET | `/matches/:id` | Público | Detalle de un partido, incluye `statistics[]` por equipo. |
| POST | `/matches` | `ANALYST`, `SUPER_ADMIN` | Crear partido (valida `homeTeamId !== awayTeamId`). |
| PATCH | `/matches/:id` | `ANALYST`, `SUPER_ADMIN` | Actualizar partido (re-valida equipos distintos si cambian). |
| DELETE | `/matches/:id` | `ANALYST`, `SUPER_ADMIN` | Eliminar partido. |
| PUT | `/matches/:id/statistics` | `ANALYST`, `SUPER_ADMIN` | Upsert de estadísticas de un equipo participante (`matchId` + `teamId` único). |

### Health (`/api/v1/health`)

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/health` | Público | Estado de la API y conectividad con PostgreSQL. |

## Roadmap (no implementado en Fase 1)

| Fase | Endpoints | Descripción |
|---|---|---|
| 2 | `GET/POST/PATCH/DELETE /competitions[/:id]`, `GET /competitions/:id/standings` | CRUD de competiciones y tabla de posiciones |
| 2 | `GET /stats/teams/:id`, `GET /stats/head-to-head?teamA=&teamB=` | Motor estadístico: forma reciente, enfrentamientos directos |
| 3 | `GET /predictions/matches/:id`, `POST /predictions/matches/:id/generate` | Predicción Elo + Poisson para un partido |
| 4 | `POST /simulations`, `GET /simulations/:id`, `GET /simulations/:id/results[/teams/:teamId]` | Simulación Monte Carlo de torneo (async, BullMQ) |
| 5 | `GET /dashboard/summary`, `GET /dashboard/rankings`, WS `/ws` (`prediction.updated`, `simulation.progress`) | Dashboard agregado y eventos en tiempo real |
