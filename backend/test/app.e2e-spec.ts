import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'crypto';
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

  it('POST /teams sin autenticacion -> 401', () => {
    return request(app.getHttpServer())
      .post(`/${apiPrefix}/teams`)
      .send({
        name: 'Test FC',
        shortName: 'TFC',
        country: 'Test',
        confederation: 'UEFA',
      })
      .expect(401);
  });

  describe('Flujo de autenticacion', () => {
    const email = `e2e-${randomUUID()}@worldcup-analytics.com`;
    const password = 'Password123!';
    let accessToken: string;

    it('POST /auth/register -> 201 crea un usuario con rol USER', async () => {
      const res = await request(app.getHttpServer())
        .post(`/${apiPrefix}/auth/register`)
        .send({ email, password, fullName: 'Usuario E2E' })
        .expect(201);

      expect(res.body.user.email).toBe(email);
      expect(res.body.user.role).toBe('USER');
      expect(res.body.tokens.accessToken).toBeDefined();
      accessToken = res.body.tokens.accessToken;
    });

    it('GET /auth/me -> 200 con el perfil del usuario autenticado', () => {
      return request(app.getHttpServer())
        .get(`/${apiPrefix}/auth/me`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.email).toBe(email);
        });
    });

    it('POST /teams con rol USER -> 403 (requiere ANALYST/SUPER_ADMIN)', () => {
      return request(app.getHttpServer())
        .post(`/${apiPrefix}/teams`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Test FC',
          shortName: 'TFC',
          country: 'Test',
          confederation: 'UEFA',
        })
        .expect(403);
    });

    it('POST /auth/login -> 200 con credenciales validas', () => {
      return request(app.getHttpServer())
        .post(`/${apiPrefix}/auth/login`)
        .send({ email, password })
        .expect(200)
        .expect((res) => {
          expect(res.body.tokens.accessToken).toBeDefined();
        });
    });

    it('POST /auth/login -> 401 con credenciales invalidas', () => {
      return request(app.getHttpServer())
        .post(`/${apiPrefix}/auth/login`)
        .send({ email, password: 'incorrecta' })
        .expect(401);
    });
  });
});
