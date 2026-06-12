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

## Fase 3 (implementados)

### Predictions (`/api/v1/predictions`)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/predictions/matches/:id` | Predicciones más recientes (una por modelo) de un partido. `404` si el partido no existe. |
| POST | `/predictions/matches/:id/generate` | Genera y persiste predicciones Elo, Poisson y Ensemble para un partido. `404` si el partido no existe. |

Ambos devuelven un array de `PredictionResponseDto`: `id`, `matchId`,
`model` (`ELO` | `POISSON` | `MONTE_CARLO` | `ENSEMBLE`),
`homeWinProbability`, `drawProbability`, `awayWinProbability`
(probabilidades en `[0,1]`, suman 1 por modelo), `predictedHomeGoals` /
`predictedAwayGoals` (goles esperados, solo en `POISSON` y `ENSEMBLE`) y
`generatedAt`.

`POST /predictions/matches/:id/generate` calcula:

- **ELO**: a partir del `eloRating` actual de ambos equipos
  (ver [PREDICTION_ENGINE.md](./PREDICTION_ENGINE.md) §1).
- **POISSON**: a partir de la media de goles anotados/recibidos por cada
  equipo en sus partidos `FINISHED` y la media de goles de la liga
  (ver [PREDICTION_ENGINE.md](./PREDICTION_ENGINE.md) §2).
- **ENSEMBLE**: combinación de los dos modelos anteriores
  (ver [PREDICTION_ENGINE.md](./PREDICTION_ENGINE.md) §3).

Cada llamada agrega una nueva fila por modelo (historial); `GET
/predictions/matches/:id` siempre devuelve solo la más reciente de cada uno.

## Fase 4 (implementados)

### Competition teams (bajo `/api/v1/competitions/:id`)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/competitions/:id/teams` | Lista los equipos inscritos en la competición (`groupName`, `seed`). |
| PUT | `/competitions/:id/teams/:teamId` | Asigna o actualiza `groupName`/`seed` de un equipo en la competición (upsert). |
| DELETE | `/competitions/:id/teams/:teamId` | Quita un equipo de la competición. `404` si no estaba inscrito. |

`GET /competitions/:id/teams` y `PUT /competitions/:id/teams/:teamId`
devuelven `CompetitionTeamResponseDto[]`/`CompetitionTeamResponseDto`:
`teamId`, `groupName` (`string | null`), `seed` (`number | null`) y `team`
(`id`, `name`, `shortName`, `logoUrl`). `PUT` acepta
`{ groupName?: string | null, seed?: number | null }`.

### Simulations (`/api/v1/simulations`)

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/simulations` | Ejecuta una simulación Monte Carlo del torneo de una competición y persiste el resultado. |
| GET | `/simulations/:id` | Estado/metadatos de una simulación. |
| GET | `/simulations/:id/results` | Resultado completo de una simulación, incluyendo `teamResults`. |
| GET | `/simulations/:id/results/teams/:teamId` | Resultado de un equipo concreto dentro de una simulación. |

`POST /simulations` recibe `{ competitionId, iterations? }` (`iterations`
entre 100 y 5000, default 1000 — `MIN_ITERATIONS`/`MAX_ITERATIONS`/
`DEFAULT_ITERATIONS`). `404` si `competitionId` no existe; `400 Bad Request`
si la competición no tiene ningún `CompetitionTeam.groupName` configurado
(ver Competition teams arriba).

**Ejecución síncrona**: la simulación corre dentro del propio request — la
respuesta ya tiene `status: 'COMPLETED'` (sin colas ni worker). Devuelve
`SimulationResultsResponseDto`: `id`, `competitionId`, `iterations`,
`status`, `startedAt`, `completedAt`, `createdAt` y `teamResults[]` (ordenado
por `championProbability` descendente). Cada elemento de `teamResults[]`
(`TeamSimulationResultDto`) incluye `id`, `team` (`id`, `name`, `shortName`,
`logoUrl`), `groupStageProbability`, `expectedPosition`,
`roundOf16Probability`, `quarterFinalProbability`, `semiFinalProbability`,
`finalProbability` (en `[0,1]`, `null` si esa fase no existe en el bracket de
la competición — p. ej. con `QUALIFIERS_PER_GROUP = 2` clasificados de 2
grupos solo hay semifinal y final) y `championProbability` (siempre
numérico).

`GET /simulations/:id` devuelve `SimulationResponseDto` (igual que arriba sin
`teamResults`). `GET /simulations/:id/results/teams/:teamId` devuelve un
único `TeamSimulationResultDto`; `404` si la simulación o el equipo no
existen.

## Fase 5 (implementados)

### Dashboard (`/api/v1/dashboard`)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/dashboard/summary` | Resumen agregado de la plataforma. |
| GET | `/dashboard/rankings` | Ranking Elo paginado de todas las selecciones. |

`GET /dashboard/summary` devuelve `DashboardSummaryResponseDto`:

- `counts`: totales de `teams`, `competitions`, `matches`, `predictions` y
  `simulations`.
- `matchesByStatus`: número de partidos por `MatchStatus`
  (`scheduled`, `live`, `finished`, `postponed`, `cancelled`).
- `topTeams`: top 10 selecciones por `eloRating` (`id`, `name`, `shortName`,
  `logoUrl`, `eloRating`, `fifaRanking`).
- `upcomingMatches` / `recentResults`: los próximos 5 partidos `SCHEDULED`
  (orden ascendente por `matchDate`) y los últimos 5 partidos `FINISHED`
  (orden descendente), cada uno con `homeTeam`/`awayTeam`
  (`id`, `name`, `shortName`, `logoUrl`), `competition` (`id`, `name`),
  `matchDate`, `stage`, `homeGoals`, `awayGoals`.

`GET /dashboard/rankings` está paginado vía `PaginationQueryDto` (`page`,
`limit`) y devuelve `PaginatedResponseDto<DashboardRankingDto>`: todas las
selecciones ordenadas por `eloRating` descendente, cada una con `rank`
(posición global, no solo dentro de la página), `id`, `name`, `shortName`,
`logoUrl`, `confederation`, `eloRating`, `fifaRanking`.

### WebSocket (`/ws`)

Gateway Socket.io en el namespace `/ws`. Eventos emitidos:

- **`prediction.updated`** — `{ matchId, predictions }` (mismo
  `PredictionResponseDto[]` que devuelve `GET /predictions/matches/:id`),
  emitido tras `POST /predictions/matches/:id/generate`.
- **`simulation.progress`** — `{ simulationId, competitionId, status:
  'COMPLETED', progress: 100 }`, emitido una vez al completar `POST
  /simulations`. La ejecución de simulaciones es síncrona (sin colas), por
  lo que no hay progreso incremental real; eso queda para una futura
  migración a ejecución asíncrona.

Ambos eventos se publican internamente vía `EventEmitter2`
(`prediction.updated` / `simulation.progress`) y `EventsGateway` los
retransmite por WebSocket a todos los clientes conectados.
