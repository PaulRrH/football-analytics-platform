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
});
