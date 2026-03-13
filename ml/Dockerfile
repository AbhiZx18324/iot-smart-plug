FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN mkdir ml

COPY requirements.txt /app/ml/
RUN pip install --no-cache-dir -r /app/ml/requirements.txt

COPY . /app/ml/

CMD ["python", "-m", "ml.ml_service"]