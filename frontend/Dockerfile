# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Etapa 1: dependencias
# ---------------------------------------------------------------------------
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# ---------------------------------------------------------------------------
# Etapa 2: build (compila la SPA Angular)
# ---------------------------------------------------------------------------
FROM node:20-alpine AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Esta imagen se usa para docker-compose (desarrollo local). La configuracion
# "development" apunta a http://localhost:3000/api/v1 (ver
# src/environments/environment.development.ts), que es accesible desde el
# navegador del host cuando el backend expone el puerto 3000. El despliegue
# en Vercel no usa este Dockerfile y construye con la configuracion por
# defecto (production).
RUN npm run build -- --configuration development

# ---------------------------------------------------------------------------
# Etapa 3: runtime (Nginx sirviendo los archivos estaticos)
# ---------------------------------------------------------------------------
FROM nginx:1.27-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
