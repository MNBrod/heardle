# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# Stage 2: Final image
FROM node:20-alpine

RUN apk add --no-cache ffmpeg

# Backend
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --omit=dev
COPY backend/src/ ./src/
COPY backend/config.json ./

# Frontend static files
COPY --from=frontend-builder /app/dist /app/frontend/dist

EXPOSE 3000

CMD ["node", "src/server.js"]
