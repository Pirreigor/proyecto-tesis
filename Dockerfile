# Etapa 1: compilar React
FROM node:20-slim AS frontend-builder
WORKDIR /build
COPY frontend/package.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# Etapa 2: imagen final con Python + Node.js
FROM python:3.11-slim

RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs libgl1 libglib2.0-0 && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Dependencias Python (Flask + Ultralytics)
COPY api/requirements.txt ./api/requirements.txt
RUN pip install --no-cache-dir -r api/requirements.txt

# Dependencias Node.js
COPY backend/package.json ./backend/
RUN cd backend && npm install --production

# Código de la aplicación
COPY api/     ./api/
COPY backend/ ./backend/
COPY models/  ./models/

# React compilado
COPY --from=frontend-builder /build/dist ./frontend/dist/

# Script de inicio
COPY start.sh ./
RUN chmod +x start.sh

EXPOSE 3001
CMD ["./start.sh"]
