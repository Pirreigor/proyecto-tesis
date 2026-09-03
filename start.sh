#!/bin/bash
set -e

# Iniciar Flask API en segundo plano
MODEL_PATH=${MODEL_PATH:-/app/models/best_caries_v3.pt}
cd /app/api && MODEL_PATH=$MODEL_PATH python main.py &

# Esperar a que Flask arranque
sleep 3

# Iniciar Node.js (sirve React + API)
cd /app/backend && NODE_ENV=production node src/index.js
