FROM python:3.11-slim

RUN apt-get update && apt-get install -y \
    libpq-dev gcc g++ curl poppler-utils tesseract-ocr \
    libgl1 libglib2.0-0 libsm6 libxrender1 libxext6 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install https://github.com/explosion/spacy-models/releases/download/en_core_web_sm-3.8.0/en_core_web_sm-3.8.0.tar.gz

RUN mkdir -p /tmp/documind

COPY . .

ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1