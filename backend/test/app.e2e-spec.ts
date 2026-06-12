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
});
