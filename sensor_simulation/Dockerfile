FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN mkdir sensor_simulation

COPY requirements.txt /app/sensor_simulation
RUN pip install --no-cache-dir -r /app/sensor_simulation/requirements.txt

COPY . /app/sensor_simulation/

CMD ["python", "-m", "sensor_simulation.test_multi_sockets"]