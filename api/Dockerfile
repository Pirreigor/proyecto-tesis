FROM python:3.11-slim

RUN apt-get update && apt-get install -y libgl1 libglib2.0-0 && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY api/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY api/   ./api/
COPY models/ ./models/

ENV MODEL_PATH=/app/models/best_caries_v3.pt
ENV PORT=5000

EXPOSE 5000
CMD ["python", "api/main.py"]
