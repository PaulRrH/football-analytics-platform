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
});
