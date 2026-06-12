import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { AppConfig } from './../src/config/configuration';

describe('App (e2e)', () => {
  let app: INestApplication<App>;
  let apiPrefix: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );

    const configService =
      app.get<ConfigService<AppConfig, true>>(ConfigService);
    apiPrefix = configService.get('apiPrefix', { infer: true });
    app.setGlobalPrefix(apiPrefix);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health -> 200 ok', () => {
    return request(app.getHttpServer())
      .get(`/${apiPrefix}/health`)
      .expect(200)
      .expect((res) => {
        expect(res.body.status).toBe('ok');
        expect(res.body.database).toBe('up');
      });
  });

  it('GET /teams -> 200 publico, paginado', () => {
    return request(app.getHttpServer())
      .get(`/${apiPrefix}/teams`)
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.meta).toHaveProperty('total');
      });
  });

  it('GET /matches -> 200 publico, paginado', () => {
    return request(app.getHttpServer())
      .get(`/${apiPrefix}/matches`)
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.meta).toHaveProperty('total');
      });
  });

  it('POST /teams -> 201 crea un equipo', () => {
    return request(app.getHttpServer())
      .post(`/${apiPrefix}/teams`)
      .send({
        name: 'Test FC E2E',
        shortName: 'TFE',
        country: 'Test',
        confederation: 'UEFA',
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.name).toBe('Test FC E2E');
        expect(res.body.id).toBeDefined();
      });
  });

  it('GET /competitions -> 200 publico, paginado', () => {
    return request(app.getHttpServer())
      .get(`/${apiPrefix}/competitions`)
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.meta).toHaveProperty('total');
      });
  });

  it('POST /competitions -> 201 crea una competicion', () => {
    return request(app.getHttpServer())
      .post(`/${apiPrefix}/competitions`)
      .send({
        name: 'Test Cup E2E',
        type: 'FRIENDLY',
        season: '2026',
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.name).toBe('Test Cup E2E');
        expect(res.body.id).toBeDefined();
      });
  });

  it('GET /competitions/:id/standings -> 200 tabla de posiciones', async () => {
    const createRes = await request(app.getHttpServer())
      .post(`/${apiPrefix}/competitions`)
      .send({
        name: 'Test Standings Cup E2E',
        type: 'FRIENDLY',
        season: '2026',
        startDate: '2026-02-01',
        endDate: '2026-02-28',
      })
      .expect(201);

    const competitionId = createRes.body.id as string;

    await request(app.getHttpServer())
      .get(`/${apiPrefix}/competitions/${competitionId}/standings`)
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
      });
  });

  describe('Stats', () => {
    let teamAId: string;
    let teamBId: string;

    beforeAll(async () => {
      const teamARes = await request(app.getHttpServer())
        .post(`/${apiPrefix}/teams`)
        .send({
          name: 'Test Stats FC A',
          shortName: 'TSA',
          country: 'Test',
          confederation: 'UEFA',
        })
        .expect(201);
      teamAId = teamARes.body.id as string;

      const teamBRes = await request(app.getHttpServer())
        .post(`/${apiPrefix}/teams`)
        .send({
          name: 'Test Stats FC B',
          shortName: 'TSB',
          country: 'Test',
          confederation: 'UEFA',
        })
        .expect(201);
      teamBId = teamBRes.body.id as string;
    });

    it('GET /stats/teams/:id -> 200 forma reciente de un equipo', () => {
      return request(app.getHttpServer())
        .get(`/${apiPrefix}/stats/teams/${teamAId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.team.id).toBe(teamAId);
          expect(Array.isArray(res.body.recentMatches)).toBe(true);
          expect(Array.isArray(res.body.form)).toBe(true);
        });
    });

    it('GET /stats/head-to-head -> 200 historial entre dos equipos', () => {
      return request(app.getHttpServer())
        .get(`/${apiPrefix}/stats/head-to-head`)
        .query({ teamA: teamAId, teamB: teamBId })
        .expect(200)
        .expect((res) => {
          expect(res.body.teamA.id).toBe(teamAId);
          expect(res.body.teamB.id).toBe(teamBId);
          expect(Array.isArray(res.body.matches)).toBe(true);
        });
    });

    it('GET /stats/head-to-head -> 400 si los equipos son el mismo', () => {
      return request(app.getHttpServer())
        .get(`/${apiPrefix}/stats/head-to-head`)
        .query({ teamA: teamAId, teamB: teamAId })
        .expect(400);
    });
  });

  describe('Predictions', () => {
    let matchId: string;

    beforeAll(async () => {
      const homeRes = await request(app.getHttpServer())
        .post(`/${apiPrefix}/teams`)
        .send({
          name: 'Test Predictions FC Home',
          shortName: 'TPH',
          country: 'Test',
          confederation: 'UEFA',
        })
        .expect(201);
      const homeTeamId = homeRes.body.id as string;

      const awayRes = await request(app.getHttpServer())
        .post(`/${apiPrefix}/teams`)
        .send({
          name: 'Test Predictions FC Away',
          shortName: 'TPA',
          country: 'Test',
          confederation: 'UEFA',
        })
        .expect(201);
      const awayTeamId = awayRes.body.id as string;

      const competitionRes = await request(app.getHttpServer())
        .post(`/${apiPrefix}/competitions`)
        .send({
          name: 'Test Predictions Cup E2E',
          type: 'FRIENDLY',
          season: '2026',
          startDate: '2026-03-01',
          endDate: '2026-03-31',
        })
        .expect(201);
      const competitionId = competitionRes.body.id as string;

      const matchRes = await request(app.getHttpServer())
        .post(`/${apiPrefix}/matches`)
        .send({
          competitionId,
          homeTeamId,
          awayTeamId,
          matchDate: '2026-03-10T18:00:00.000Z',
          stage: 'FRIENDLY',
          status: 'FINISHED',
          homeGoals: 2,
          awayGoals: 1,
        })
        .expect(201);
      matchId = matchRes.body.id as string;
    });

    it('GET /predictions/matches/:id -> 200 vacio si no hay predicciones generadas', () => {
      return request(app.getHttpServer())
        .get(`/${apiPrefix}/predictions/matches/${matchId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual([]);
        });
    });

    it('POST /predictions/matches/:id/generate -> 201 genera predicciones Elo, Poisson y Ensemble', () => {
      return request(app.getHttpServer())
        .post(`/${apiPrefix}/predictions/matches/${matchId}/generate`)
        .expect(201)
        .expect((res) => {
          const predictions = res.body as Array<Record<string, number>>;
          expect(predictions).toHaveLength(3);
          expect((predictions.map((p) => p.model) as unknown[]).sort()).toEqual(
            ['ELO', 'ENSEMBLE', 'POISSON'],
          );

          for (const prediction of predictions) {
            const sum =
              prediction.homeWinProbability +
              prediction.drawProbability +
              prediction.awayWinProbability;
            expect(sum).toBeCloseTo(1, 5);
            expect(prediction.homeWinProbability).toBeGreaterThanOrEqual(0);
            expect(prediction.homeWinProbability).toBeLessThanOrEqual(1);
            expect(prediction.drawProbability).toBeGreaterThanOrEqual(0);
            expect(prediction.drawProbability).toBeLessThanOrEqual(1);
            expect(prediction.awayWinProbability).toBeGreaterThanOrEqual(0);
            expect(prediction.awayWinProbability).toBeLessThanOrEqual(1);
          }
        });
    });

    it('GET /predictions/matches/:id -> 200 devuelve las predicciones generadas', () => {
      return request(app.getHttpServer())
        .get(`/${apiPrefix}/predictions/matches/${matchId}`)
        .expect(200)
        .expect((res) => {
          const predictions = res.body as Array<{ model: string }>;
          expect(predictions).toHaveLength(3);
          expect(predictions.map((p) => p.model).sort()).toEqual([
            'ELO',
            'ENSEMBLE',
            'POISSON',
          ]);
        });
    });

    it('POST /predictions/matches/:id/generate -> 404 si el partido no existe', () => {
      return request(app.getHttpServer())
        .post(
          `/${apiPrefix}/predictions/matches/00000000-0000-0000-0000-000000000000/generate`,
        )
        .expect(404);
    });
  });

  describe('Elo recalculation', () => {
    it('PATCH /matches/:id a FINISHED recalcula el eloRating de ambos equipos', async () => {
      const homeRes = await request(app.getHttpServer())
        .post(`/${apiPrefix}/teams`)
        .send({
          name: 'Test Elo FC Home',
          shortName: 'TEH',
          country: 'Test',
          confederation: 'UEFA',
        })
        .expect(201);
      const homeTeamId = homeRes.body.id as string;
      const initialHomeElo = homeRes.body.eloRating as number;

      const awayRes = await request(app.getHttpServer())
        .post(`/${apiPrefix}/teams`)
        .send({
          name: 'Test Elo FC Away',
          shortName: 'TEA',
          country: 'Test',
          confederation: 'UEFA',
        })
        .expect(201);
      const awayTeamId = awayRes.body.id as string;
      const initialAwayElo = awayRes.body.eloRating as number;

      const competitionRes = await request(app.getHttpServer())
        .post(`/${apiPrefix}/competitions`)
        .send({
          name: 'Test Elo Cup E2E',
          type: 'FRIENDLY',
          season: '2026',
          startDate: '2026-04-01',
          endDate: '2026-04-30',
        })
        .expect(201);
      const competitionId = competitionRes.body.id as string;

      const matchRes = await request(app.getHttpServer())
        .post(`/${apiPrefix}/matches`)
        .send({
          competitionId,
          homeTeamId,
          awayTeamId,
          matchDate: '2026-04-10T18:00:00.000Z',
          stage: 'FRIENDLY',
        })
        .expect(201);
      const matchId = matchRes.body.id as string;

      await request(app.getHttpServer())
        .patch(`/${apiPrefix}/matches/${matchId}`)
        .send({ status: 'FINISHED', homeGoals: 3, awayGoals: 0 })
        .expect(200);

      const homeAfter = await request(app.getHttpServer())
        .get(`/${apiPrefix}/teams/${homeTeamId}`)
        .expect(200);
      const awayAfter = await request(app.getHttpServer())
        .get(`/${apiPrefix}/teams/${awayTeamId}`)
        .expect(200);

      expect(homeAfter.body.eloRating as number).toBeGreaterThan(
        initialHomeElo,
      );
      expect(awayAfter.body.eloRating as number).toBeLessThan(initialAwayElo);
    });
  });

  describe('Competition teams', () => {
    let competitionId: string;
    let teamAId: string;
    let teamBId: string;

    beforeAll(async () => {
      const competitionRes = await request(app.getHttpServer())
        .post(`/${apiPrefix}/competitions`)
        .send({
          name: 'Test Competition Teams Cup E2E',
          type: 'WORLD_CUP',
          season: '2026',
          startDate: '2026-05-01',
          endDate: '2026-05-31',
        })
        .expect(201);
      competitionId = competitionRes.body.id as string;

      const teamARes = await request(app.getHttpServer())
        .post(`/${apiPrefix}/teams`)
        .send({
          name: 'Test Competition Teams FC A',
          shortName: 'TCA',
          country: 'Test',
          confederation: 'UEFA',
        })
        .expect(201);
      teamAId = teamARes.body.id as string;

      const teamBRes = await request(app.getHttpServer())
        .post(`/${apiPrefix}/teams`)
        .send({
          name: 'Test Competition Teams FC B',
          shortName: 'TCB',
          country: 'Test',
          confederation: 'UEFA',
        })
        .expect(201);
      teamBId = teamBRes.body.id as string;
    });

    it('PUT /competitions/:id/teams/:teamId -> 200 asigna grupo y seed', () => {
      return request(app.getHttpServer())
        .put(`/${apiPrefix}/competitions/${competitionId}/teams/${teamAId}`)
        .send({ groupName: 'Grupo A', seed: 1 })
        .expect(200)
        .expect((res) => {
          expect(res.body.teamId).toBe(teamAId);
          expect(res.body.groupName).toBe('Grupo A');
          expect(res.body.seed).toBe(1);
          expect(res.body.team.id).toBe(teamAId);
        });
    });

    it('GET /competitions/:id/teams -> 200 lista los equipos asignados', async () => {
      await request(app.getHttpServer())
        .put(`/${apiPrefix}/competitions/${competitionId}/teams/${teamBId}`)
        .send({ groupName: 'Grupo B', seed: 1 })
        .expect(200);

      await request(app.getHttpServer())
        .get(`/${apiPrefix}/competitions/${competitionId}/teams`)
        .expect(200)
        .expect((res) => {
          const teams = res.body as Array<{ teamId: string }>;
          expect(teams.map((t) => t.teamId).sort()).toEqual(
            [teamAId, teamBId].sort(),
          );
        });
    });

    it('DELETE /competitions/:id/teams/:teamId -> 204 quita un equipo', async () => {
      await request(app.getHttpServer())
        .delete(`/${apiPrefix}/competitions/${competitionId}/teams/${teamBId}`)
        .expect(204);

      await request(app.getHttpServer())
        .get(`/${apiPrefix}/competitions/${competitionId}/teams`)
        .expect(200)
        .expect((res) => {
          const teams = res.body as Array<{ teamId: string }>;
          expect(teams.map((t) => t.teamId)).toEqual([teamAId]);
        });
    });

    it('DELETE /competitions/:id/teams/:teamId -> 404 si el equipo no esta asignado', () => {
      return request(app.getHttpServer())
        .delete(`/${apiPrefix}/competitions/${competitionId}/teams/${teamBId}`)
        .expect(404);
    });
  });

  describe('Simulations', () => {
    let competitionId: string;
    let teamIds: string[];
    let simulationId: string;
    let simulationTeamId: string;

    beforeAll(async () => {
      const competitionRes = await request(app.getHttpServer())
        .post(`/${apiPrefix}/competitions`)
        .send({
          name: 'Test Simulations World Cup E2E',
          type: 'WORLD_CUP',
          season: '2026',
          startDate: '2026-06-01',
          endDate: '2026-06-30',
        })
        .expect(201);
      competitionId = competitionRes.body.id as string;

      teamIds = [];
      for (let i = 1; i <= 6; i++) {
        const teamRes = await request(app.getHttpServer())
          .post(`/${apiPrefix}/teams`)
          .send({
            name: `Test Simulations FC ${i}`,
            shortName: `TS${i}`,
            country: 'Test',
            confederation: 'UEFA',
          })
          .expect(201);
        teamIds.push(teamRes.body.id as string);
      }

      const [a1, a2, a3, b1, b2, b3] = teamIds;

      for (const [teamId, groupName] of [
        [a1, 'Grupo A'],
        [a2, 'Grupo A'],
        [a3, 'Grupo A'],
        [b1, 'Grupo B'],
        [b2, 'Grupo B'],
        [b3, 'Grupo B'],
      ]) {
        await request(app.getHttpServer())
          .put(`/${apiPrefix}/competitions/${competitionId}/teams/${teamId}`)
          .send({ groupName })
          .expect(200);
      }

      const groupStageMatches = [
        { homeTeamId: a1, awayTeamId: a2, homeGoals: 2, awayGoals: 0 },
        { homeTeamId: a1, awayTeamId: a3, homeGoals: 1, awayGoals: 1 },
        { homeTeamId: a2, awayTeamId: a3, homeGoals: null, awayGoals: null },
        { homeTeamId: b1, awayTeamId: b2, homeGoals: 0, awayGoals: 1 },
        { homeTeamId: b1, awayTeamId: b3, homeGoals: null, awayGoals: null },
        { homeTeamId: b2, awayTeamId: b3, homeGoals: 2, awayGoals: 2 },
      ];

      for (const match of groupStageMatches) {
        const isFinished = match.homeGoals !== null;
        await request(app.getHttpServer())
          .post(`/${apiPrefix}/matches`)
          .send({
            competitionId,
            homeTeamId: match.homeTeamId,
            awayTeamId: match.awayTeamId,
            matchDate: '2026-06-05T18:00:00.000Z',
            stage: 'GROUP_STAGE',
            status: isFinished ? 'FINISHED' : 'SCHEDULED',
            ...(isFinished
              ? { homeGoals: match.homeGoals, awayGoals: match.awayGoals }
              : {}),
          })
          .expect(201);
      }
    });

    it('POST /simulations -> 400 si la competicion no tiene fase de grupos', async () => {
      const otherCompetitionRes = await request(app.getHttpServer())
        .post(`/${apiPrefix}/competitions`)
        .send({
          name: 'Test Simulations No Groups Cup E2E',
          type: 'FRIENDLY',
          season: '2026',
          startDate: '2026-07-01',
          endDate: '2026-07-31',
        })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/${apiPrefix}/simulations`)
        .send({ competitionId: otherCompetitionRes.body.id, iterations: 100 })
        .expect(400);
    });

    it('POST /simulations -> 404 si la competicion no existe', () => {
      return request(app.getHttpServer())
        .post(`/${apiPrefix}/simulations`)
        .send({
          competitionId: '00000000-0000-0000-0000-000000000000',
          iterations: 100,
        })
        .expect(404);
    });

    it('POST /simulations -> 201 ejecuta una simulacion Monte Carlo completa', async () => {
      const res = await request(app.getHttpServer())
        .post(`/${apiPrefix}/simulations`)
        .send({ competitionId, iterations: 100 })
        .expect(201);

      expect(res.body.status).toBe('COMPLETED');
      expect(res.body.competitionId).toBe(competitionId);
      expect(res.body.iterations).toBe(100);

      const teamResults = res.body.teamResults as Array<{
        team: { id: string };
        groupStageProbability: number;
        roundOf16Probability: number | null;
        quarterFinalProbability: number | null;
        semiFinalProbability: number | null;
        finalProbability: number | null;
        championProbability: number;
        expectedPosition: number;
      }>;

      expect(teamResults).toHaveLength(6);
      expect(teamResults.map((r) => r.team.id).sort()).toEqual(
        [...teamIds].sort(),
      );

      const totalChampionProbability = teamResults.reduce(
        (sum, r) => sum + r.championProbability,
        0,
      );
      expect(totalChampionProbability).toBeCloseTo(1, 1);

      for (const result of teamResults) {
        expect(result.groupStageProbability).toBeGreaterThanOrEqual(0);
        expect(result.groupStageProbability).toBeLessThanOrEqual(1);
        expect(result.roundOf16Probability).toBeNull();
        expect(result.quarterFinalProbability).toBeNull();
        expect(result.semiFinalProbability).not.toBeNull();
        expect(result.finalProbability).not.toBeNull();
      }

      simulationId = res.body.id as string;
      simulationTeamId = teamResults[0].team.id;
    });

    it('GET /simulations/:id -> 200 estado de la simulacion', () => {
      return request(app.getHttpServer())
        .get(`/${apiPrefix}/simulations/${simulationId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(simulationId);
          expect(res.body.status).toBe('COMPLETED');
        });
    });

    it('GET /simulations/:id/results -> 200 resultados por equipo', () => {
      return request(app.getHttpServer())
        .get(`/${apiPrefix}/simulations/${simulationId}/results`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(simulationId);
          expect(res.body.teamResults).toHaveLength(6);
        });
    });

    it('GET /simulations/:id/results/teams/:teamId -> 200 resultado de un equipo', () => {
      return request(app.getHttpServer())
        .get(
          `/${apiPrefix}/simulations/${simulationId}/results/teams/${simulationTeamId}`,
        )
        .expect(200)
        .expect((res) => {
          expect(res.body.team.id).toBe(simulationTeamId);
          expect(res.body.championProbability).toBeGreaterThanOrEqual(0);
        });
    });

    it('GET /simulations/:id/results/teams/:teamId -> 404 si el equipo es ajeno a la simulacion', () => {
      return request(app.getHttpServer())
        .get(
          `/${apiPrefix}/simulations/${simulationId}/results/teams/00000000-0000-0000-0000-000000000000`,
        )
        .expect(404);
    });
  });
});
