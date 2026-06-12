# Motor de Predicción (diseño — Fases 3-4)

Este documento describe el diseño matemático y de software del motor de
predicción. **No implementado en Fase 1**: las entidades `Prediction`,
`TournamentSimulation` y `TeamSimulationResult` ya existen en
[`schema.prisma`](../backend/prisma/schema.prisma) (ver
[DATABASE.md](DATABASE.md)), pero los módulos NestJS correspondientes se
construyen en Fases 3 y 4.

## 1. Modelo Elo (Fase 3)

Cada `Team` mantiene un `eloRating` (default `1500`). Para un partido entre
un equipo local y uno visitante:

**Probabilidad esperada de victoria local** (con ventaja de local
`HomeAdv`, p. ej. `100` puntos):

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
dashboard.

`E_home`/`E_away` se usan directamente como
`homeWinProbability`/`awayWinProbability` de una `Prediction` con
`model = ELO` (la probabilidad de empate se reparte mediante el modelo
Poisson o un valor empírico fijo, ver §3 Ensemble).

## 2. Modelo Poisson (Fase 3)

A partir del historial de `Match`/`MatchStatistic`, se calculan fuerzas de
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

## 3. Ensemble (Fase 3)

Combinación ponderada de Elo y Poisson:

```
P_ensemble = w_elo · P_elo + w_poisson · P_poisson      (w_elo + w_poisson = 1)
```

Los pesos (`w_elo`, `w_poisson`) son configurables y se calibran comparando
contra resultados históricos (Brier score / log-loss). Se persiste como
`Prediction` con `model = ENSEMBLE`.

## 4. Simulación Monte Carlo de torneos (Fase 4)

Para un `TournamentSimulation` con `iterations` (p. ej. `10000`):

1. Para cada iteración:
   - Simular cada partido de fase de grupos muestreando un marcador desde la
     matriz Poisson (o desde `P_ensemble` para determinar
     victoria/empate/derrota y luego un marcador Poisson coherente).
   - Calcular la clasificación de cada grupo con las reglas habituales
     (puntos, diferencia de goles, goles a favor).
   - Simular cada ronda eliminatoria (`ROUND_OF_16` → `FINAL`) de la misma
     forma, sin empates (penales si aplica: 50/50 o ajustado por Elo).
   - Registrar, por equipo, en qué fase quedó eliminado y si fue campeón.
2. Agregar resultados de las `iterations` en `TeamSimulationResult`:
   - `groupStageProbability`, `roundOf16Probability`,
     `quarterFinalProbability`, `semiFinalProbability`,
     `finalProbability`, `championProbability` = frecuencia relativa de
     alcanzar/superar cada fase.
   - `expectedPosition` = posición final promedio.

**Ejecución asíncrona**: por su costo computacional, la simulación se encola
como job de BullMQ (Redis) y se procesa en el `worker` (ver
[ARCHITECTURE.md](ARCHITECTURE.md)). El estado (`PENDING` → `RUNNING` →
`COMPLETED`/`FAILED`) se expone vía `GET /simulations/:id`, y el progreso se
puede emitir por WebSocket (`simulation.progress`, Fase 5).

## 5. Extensión futura: modelos ML (documentado, no implementado)

El motor se diseña con el patrón **Strategy**:

```typescript
interface PredictionStrategy {
  readonly model: PredictionModel;
  predict(match: MatchWithContext): Promise<PredictionResult>;
}
```

Implementaciones actuales: `EloStrategy`, `PoissonStrategy`,
`EnsembleStrategy`. Una futura `MLModelStrategy` podría delegar a un
microservicio Python/FastAPI (p. ej. un modelo de gradient boosting o red
neuronal entrenado con `xG`, posesión, forma reciente, etc.) implementando la
misma interfaz — sin cambios en el resto del core ni en los controladores.
