# Motor de Predicción

Este documento describe el diseño matemático y de software del motor de
predicción. Las entidades `Prediction`, `TournamentSimulation` y
`TeamSimulationResult` existen en
[`schema.prisma`](../backend/prisma/schema.prisma) (ver
[DATABASE.md](DATABASE.md)).

**Estado**: §1-3 (Elo, Poisson, Ensemble) implementados en Fase 3 — módulo
`predictions` (`GET /predictions/matches/:id`,
`POST /predictions/matches/:id/generate`, ver [API.md](API.md)) y recálculo
de Elo al finalizar partidos. §4 (Monte Carlo) implementado en Fase 4 — módulo
`simulations` (`POST /simulations`, `GET /simulations/:id`,
`GET /simulations/:id/results[/teams/:teamId]`, ver [API.md](API.md)). §5
(ML) es diseño para una fase futura.

## 1. Modelo Elo (implementado)

Cada `Team` mantiene un `eloRating` (default `1500`). Para un partido entre
un equipo local y uno visitante:

**Probabilidad esperada de victoria local** (con ventaja de local
`HomeAdv`):

```
E_home = 1 / (1 + 10^((R_away - R_home - HomeAdv) / 400))
E_away = 1 - E_home
```

**Actualización tras el resultado real**:

```
R'_home = R_home + K · (S_home - E_home)
R'_away = R_away + K · (S_away - E_away)
```

donde `S_home`/`S_away` ∈ `{1, 0.5, 0}` (victoria/empate/derrota) y `K` es un
factor de ajuste que crece con:

- la **diferencia de goles** del resultado (goal difference multiplier, ver
  metodología World Football Elo Ratings), y
- la **importancia del torneo** (amistoso < clasificatorio < fase final de
  Mundial).

Cada actualización de Elo genera además una fila en `TeamRankingHistory`
(`eloRating`, `recordedAt`) para alimentar las gráficas de tendencia del
dashboard. Este recálculo se dispara como *domain event* desde
`MatchesService.update()` cuando un partido pasa a `FINISHED` con marcador
definido (`EloRatingService.applyMatchResult`, módulo `teams`).

`E_home`/`E_away` se combinan con una probabilidad de empate fija para
obtener `homeWinProbability`/`drawProbability`/`awayWinProbability` de una
`Prediction` con `model = ELO`:

```
homeWinProbability = E_home · (1 - BASE_DRAW_PROBABILITY)
drawProbability    = BASE_DRAW_PROBABILITY
awayWinProbability = E_away · (1 - BASE_DRAW_PROBABILITY)
```

**Constantes implementadas** (`backend/src/common/utils/elo.util.ts`):

| Constante | Valor | Uso |
|---|---|---|
| `HOME_ADVANTAGE_ELO` | `100` | `HomeAdv` en `E_home`/`E_away` |
| `BASE_DRAW_PROBABILITY` | `0.25` | probabilidad de empate del modelo ELO |
| `ELO_K_FACTOR` | `20` | factor base `K` |

`K = ELO_K_FACTOR · goalDiffMultiplier(|Δgoles|) · stageMultiplier(stage)`,
con:

- `goalDiffMultiplier`: `1` si `Δgoles ≤ 1`; `1.5` si `Δgoles = 2`;
  `(11 + Δgoles) / 8` si `Δgoles ≥ 3`.
- `stageMultiplier`: `FRIENDLY = 1`, `QUALIFIER = 1.5`, `FINAL = 2`, resto de
  fases (`GROUP_STAGE`, `ROUND_OF_16`, `QUARTER_FINAL`, `SEMI_FINAL`,
  `THIRD_PLACE`) `= 1.75`.

El nuevo rating se redondea a 1 decimal.

## 2. Modelo Poisson (implementado)

A partir del historial de `Match` `FINISHED`, se calculan fuerzas de
ataque/defensa relativas por equipo (normalizadas respecto al promedio de
goles de la competición):

```
attack[team]  = goles_marcados_promedio[team]  / goles_promedio_liga
defense[team] = goles_recibidos_promedio[team] / goles_promedio_liga
```

**Goles esperados** para un partido `home` vs `away`:

```
λ_home = attack[home] · defense[away] · goles_promedio_liga · HomeAdvFactor
λ_away = attack[away] · defense[home] · goles_promedio_liga
```

**Matriz de probabilidades de marcador** (truncada, p. ej. 0–6 goles):

```
P(i, j) = Poisson(i; λ_home) · Poisson(j; λ_away)
```

Agregando la matriz:

```
P(victoria_local) = Σ P(i,j) para i > j
P(empate)         = Σ P(i,j) para i = j
P(victoria_visit) = Σ P(i,j) para i < j
```

`predictedHomeGoals = λ_home`, `predictedAwayGoals = λ_away` se guardan en
`Prediction` con `model = POISSON`.

**Constantes implementadas** (`backend/src/common/utils/poisson.util.ts`):

| Constante | Valor | Uso |
|---|---|---|
| `MAX_GOALS` | `6` | truncamiento de la matriz `P(i,j)` (0-6 goles) |
| `POISSON_HOME_ADVANTAGE_FACTOR` | `1.2` | `HomeAdvFactor` en `λ_home` |
| `DEFAULT_LEAGUE_AVERAGE_GOALS` | `1.35` | fallback de `goles_promedio_liga` si no hay partidos `FINISHED` |

Si un equipo no tiene partidos `FINISHED` registrados, `attack`/`defense` se
toman como `1` (fuerza igual a la media de la liga).

## 3. Ensemble (implementado)

Combinación ponderada de Elo y Poisson:

```
P_ensemble = w_elo · P_elo + w_poisson · P_poisson      (w_elo + w_poisson = 1)
```

**Constantes implementadas** (`backend/src/modules/predictions/application/prediction-calculator.ts`):
`ENSEMBLE_WEIGHT_ELO = 0.5`, `ENSEMBLE_WEIGHT_POISSON = 0.5`. Pueden
recalibrarse en el futuro comparando contra resultados históricos (Brier
score / log-loss).

`predictedHomeGoals`/`predictedAwayGoals` del ensemble son los del modelo
Poisson (`λ_home`/`λ_away`). Se persiste como `Prediction` con
`model = ENSEMBLE`.

## 4. Simulación Monte Carlo de torneos (implementado, síncrono)

Implementado en el módulo `simulations` (`POST /simulations`,
`GET /simulations/:id`, `GET /simulations/:id/results[/teams/:teamId]`, ver
[API.md](API.md)). `runTournamentSimulation`
(`backend/src/modules/simulations/application/tournament-simulator.ts`) es
una función pura que recibe los equipos/grupos (`CompetitionTeam.groupName`),
los partidos de fase de grupos (`Match.stage = GROUP_STAGE`), las fuerzas de
ataque/defensa (§2) y el `eloRating` (§1) de cada equipo, y ejecuta
`iterations` (100-5000, default 1000 — `MIN_ITERATIONS`/`MAX_ITERATIONS`/
`DEFAULT_ITERATIONS`) repeticiones de:

1. **Fase de grupos**: para cada partido, si ya tiene marcador (`FINISHED`)
   se usa tal cual; si no, se calculan `λ_home`/`λ_away` (§2,
   `calculatePoissonPrediction`) y se muestrean goles con
   `samplePoissonGoals` (algoritmo de Knuth,
   `backend/src/common/utils/poisson.util.ts`). La clasificación de cada
   grupo se calcula con `applyMatchResult`/`sortStandings`
   (`backend/src/common/utils/standings.util.ts`, las mismas funciones que
   usa `GET /competitions/:id/standings`).
2. **Clasificados**: los mejores `QUALIFIERS_PER_GROUP = 2` de cada grupo
   pasan a eliminatorias. El orden de siembra agrupa primero todos los
   primeros de grupo (orden alfabético de `groupName`), luego todos los
   segundos, etc.
3. **Bracket**: `bracketSize = nextPowerOfTwo(clasificados.length)`. Los
   slots se asignan según `generateBracketSeedOrder(bracketSize)` (algoritmo
   recursivo estándar de seeding: `seeds(2) = [1,2]`, `seeds(2n)` intercala
   `[s, 2n+1-s]` para cada `s` de `seeds(n)`); los slots sobrantes quedan
   vacíos (*bye*, el equipo del slot opuesto avanza automáticamente).
4. **Eliminatorias**: cada cruce se resuelve con `calculateEnsemblePrediction`
   (§3, Elo+Poisson) muestreando victoria/empate/derrota y, si aplica, un
   marcador Poisson. Un empate se resuelve con
   `calculateEloOutcomeProbabilities` usando `drawProbability = 0` (reparto
   puro Elo entre los dos equipos, sin probabilidad de empate) y se muestrea
   el ganador.
5. Se registra, por equipo, si alcanzó cada ronda rastreada
   (`TRACKED_BRACKET_SIZES = [16, 8, 4, 2]` → octavos/cuartos/semifinal/final)
   y si fue campeón.

Al terminar las `iterations`, se agregan las frecuencias relativas en
`TeamSimulationResult`:

- `groupStageProbability` = fracción de iteraciones en las que el equipo
  terminó entre los `QUALIFIERS_PER_GROUP` primeros de su grupo.
- `expectedPosition` = posición media del equipo dentro de su grupo a lo
  largo de las iteraciones (`1` = siempre primero).
- `roundOf16Probability` / `quarterFinalProbability` / `semiFinalProbability`
  / `finalProbability` = fracción de iteraciones en las que el equipo alcanzó
  esa ronda; `null` si el bracket de la competición es demasiado pequeño para
  que esa ronda exista (p. ej. con 2 grupos x 2 clasificados,
  `bracketSize = 4` y solo existen semifinal y final).
- `championProbability` = fracción de iteraciones en las que el equipo ganó
  el torneo (siempre numérico, `0` si nunca clasificó o nunca ganó).

**Ejecución síncrona**: `POST /simulations` corre la simulación dentro del
propio request y persiste el `TournamentSimulation` ya como `COMPLETED`
(`startedAt`/`completedAt` se fijan en el mismo instante). Los estados
`RUNNING`/`FAILED` de `SimulationStatus` y la cola BullMQ/Redis (ver
[ARCHITECTURE.md](ARCHITECTURE.md)) quedan reservados para una futura
migración a ejecución asíncrona si el volumen de iteraciones lo requiere, sin
cambiar el contrato público (`PENDING`/`COMPLETED` ya cubren el flujo
síncrono). El progreso por WebSocket (`simulation.progress`) también queda
para esa fase futura.

## 5. Extensión futura: modelos ML (documentado, no implementado)

Fase 3 implementa Elo/Poisson/Ensemble como funciones puras
(`calculateEloPrediction`, `calculatePoissonPrediction`,
`calculateEnsemblePrediction` en `prediction-calculator.ts`), invocadas desde
`PredictionsService.generatePredictions`. Una futura extensión con modelos ML
podría introducir el patrón **Strategy**:

```typescript
interface PredictionStrategy {
  readonly model: PredictionModel;
  predict(match: MatchWithContext): Promise<PredictionResult>;
}
```

Una `MLModelStrategy` podría delegar a un microservicio Python/FastAPI (p.
ej. un modelo de gradient boosting o red neuronal entrenado con `xG`,
posesión, forma reciente, etc.) implementando la misma interfaz — sin cambios
en el resto del core ni en los controladores.
