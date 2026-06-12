# Plataforma de Análisis y Predicción - Mundial de Fútbol

Plataforma SaaS de analítica y predicción deportiva enfocada inicialmente en
el Mundial de Fútbol (FIFA World Cup). Permite gestionar selecciones,
partidos y estadísticas históricas, y sienta las bases para un motor de
predicción (Elo, Poisson, Monte Carlo) y simulación de torneos.

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | Angular 20 (standalone), Angular Material, ApexCharts, RxJS |
| Backend | NestJS, TypeScript, JWT + RBAC, Swagger |
| Base de datos | PostgreSQL + Prisma ORM |
| Infraestructura | Docker, GitHub Actions, Vercel (frontend), Railway/Render (backend) |

## Estructura del repositorio

```
/
├── backend/    # API REST NestJS (Clean Architecture por módulo)
├── frontend/   # SPA Angular 20
├── docs/       # Documentación de arquitectura, BD, API y motor de predicción
└── docker-compose.yml
```

Cada proyecto (`backend/` y `frontend/`) es independiente: tiene su propio
`package.json`, `Dockerfile` y pipeline de despliegue (Railway/Render para el
backend, Vercel para el frontend).

## Documentación

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - Arquitectura general, decisiones de stack y seguridad.
- [docs/DATABASE.md](docs/DATABASE.md) - Modelo de datos (ERD) y descripción de entidades.
- [docs/API.md](docs/API.md) - Catálogo de endpoints REST (implementados y roadmap).
- [docs/PREDICTION_ENGINE.md](docs/PREDICTION_ENGINE.md) - Diseño del motor de predicción (Elo/Poisson/Monte Carlo).

## Puesta en marcha (desarrollo local)

### Requisitos

- Node.js 20+
- Docker y Docker Compose (para PostgreSQL local)

### 1. Base de datos

```bash
docker compose up -d postgres
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
npx prisma migrate dev
npm run seed
npm run start:dev
```

La API queda disponible en `http://localhost:3000/api/v1`, con la
documentación Swagger en `http://localhost:3000/api/v1/docs`.

### 3. Frontend

```bash
cd frontend
npm install
npm start
```

La SPA queda disponible en `http://localhost:4200`.

### 4. Todo junto con Docker Compose

```bash
docker compose up --build
```

La primera vez, con los contenedores arriba, aplica el esquema y carga los
datos semilla contra la base de datos de Docker Compose:

```bash
cd backend
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/football_analytics?schema=public" npx prisma migrate dev
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/football_analytics?schema=public" npm run seed
```

## Calidad

```bash
# Backend
cd backend && npm run lint && npm run build && npm run test

# Frontend
cd frontend && npm run lint && npm run build && npm run test
```

## Roadmap

Esta primera fase entrega la arquitectura completa, el esquema de base de
datos íntegro y dos módulos de referencia end-to-end (`teams` y `matches`)
que sirven de plantilla para el resto de módulos. Las fases siguientes
(competiciones, motor estadístico, motor de predicción, simulaciones Monte
Carlo, dashboard en tiempo real y panel de administración) están descritas en
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#roadmap-fases-futuras).
