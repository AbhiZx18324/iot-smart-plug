FROM nikolaik/python-nodejs:python3.12-nodejs20-slim

WORKDIR /app

# Copy sensor_simulation so the python scripts are available
COPY sensor_simulation/ /app/sensor_simulation/
RUN pip install --no-cache-dir -r /app/sensor_simulation/requirements.txt --break-system-packages

# Set up the digital-twin app
WORKDIR /app/digital-twin
COPY digital-twin/package*.json ./
RUN npm install

# Build the frontend
COPY digital-twin/ .
RUN npm run build

EXPOSE 3001
CMD ["node", "server.js"]
