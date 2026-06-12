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

### Competitions (`/api/v1/competitions`)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/competitions` | Listado paginado. Filtros: `type`, `status`, `season`, `search` (nombre, case-insensitive). |
| GET | `/competitions/:id` | Detalle de una competición. |
| GET | `/competitions/:id/standings` | Tabla(s) de posiciones de una competición. |
| POST | `/competitions` | Crear competición (valida `startDate < endDate`). |
| PATCH | `/competitions/:id` | Actualizar competición (re-valida el rango de fechas si cambian). |
| DELETE | `/competitions/:id` | Eliminar competición. |

`GET /competitions/:id/standings` devuelve un array de grupos
(`{ groupName, standings[] }`):

- Si la competición tiene equipos inscritos (`CompetitionTeam`), devuelve una
  tabla por cada `groupName`, inicializada en cero para los equipos
  inscritos y actualizada con los partidos `FINISHED` cuyo local y visitante
  pertenezcan al mismo grupo.
- Si no hay equipos inscritos, devuelve una única tabla general
  (`groupName: null`) calculada solo a partir de los partidos `FINISHED`,
  descubriendo los equipos participantes en esos partidos.
- Cada fila (`standings[]`) incluye `team` (`id`, `name`, `shortName`,
  `logoUrl`), `played`, `won`, `drawn`, `lost`, `goalsFor`, `goalsAgainst`,
  `goalDifference` y `points` (victoria = 3, empate = 1), ordenadas por
  puntos, diferencia de gol, goles a favor y nombre.

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

## Fase 2 (implementados)

### Stats (`/api/v1/stats`)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/stats/teams/:id` | Forma reciente de un equipo (últimos `limit` partidos `FINISHED`, 1-20, default 5). |
| GET | `/stats/head-to-head?teamA=&teamB=` | Historial de enfrentamientos directos `FINISHED` entre dos equipos. |

`GET /stats/teams/:id` devuelve `TeamFormResponseDto`: datos del equipo
(`team`), agregados de los últimos `limit` partidos finalizados
(`matchesPlayed`, `wins`, `drawn`, `losses`, `goalsFor`, `goalsAgainst`,
`points`), `form` (racha de resultados `W`/`D`/`L` en orden cronológico, del
más antiguo al más reciente) y `recentMatches` (detalle de cada partido, del
más reciente al más antiguo, con `opponent`, `isHome`, `goalsFor`,
`goalsAgainst` y `result`).

`GET /stats/head-to-head?teamA=&teamB=` devuelve `HeadToHeadResponseDto`:
datos de ambos equipos (`teamA`, `teamB`), agregados del historial
(`totalMatches`, `teamAWins`, `teamBWins`, `draws`, `teamAGoals`,
`teamBGoals`) y `matches` (detalle de cada partido finalizado entre ambos,
del más reciente al más antiguo). Responde `400 Bad Request` si `teamA` y
`teamB` son el mismo equipo.

## Roadmap (no implementado en Fase 2)

| Fase | Endpoints | Descripción |
|---|---|---|
| 3 | `GET /predictions/matches/:id`, `POST /predictions/matches/:id/generate` | Predicción Elo + Poisson para un partido |
| 4 | `POST /simulations`, `GET /simulations/:id`, `GET /simulations/:id/results[/teams/:teamId]` | Simulación Monte Carlo de torneo (async, BullMQ) |
| 5 | `GET /dashboard/summary`, `GET /dashboard/rankings`, WS `/ws` (`prediction.updated`, `simulation.progress`) | Dashboard agregado y eventos en tiempo real |
