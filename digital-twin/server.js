import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { InfluxDB } from '@influxdata/influxdb-client';
import { spawn } from 'child_process';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'dist')));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

let pythonProcess = null;

const INFLUX_URL = process.env.INFLUX_URL;
const INFLUX_TOKEN = process.env.INFLUX_TOKEN;
const INFLUX_ORG = process.env.INFLUX_ORG;
const INFLUX_BUCKET = process.env.INFLUX_BUCKET;

const influxDB = new InfluxDB({ url: INFLUX_URL, token: INFLUX_TOKEN });
const queryApi = influxDB.getQueryApi(INFLUX_ORG);


io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  let influxPollInterval = null;

  socket.on('start_simulation', (data) => {
    const { plugId, appliance, faultMode } = data;
    console.log(`Starting simulation for ${appliance} on ${plugId} with fault: ${faultMode || 'None'}`);

    if (pythonProcess) {
      pythonProcess.kill();
    }

    const args = ['-m', 'sensor_simulation.mqtt_publisher', plugId, appliance];
    if (faultMode) args.push(faultMode);

    const projectRoot = path.resolve('../');
    const pythonCmd = fs.existsSync(path.join(projectRoot, 'venv/bin/python3')) 
      ? path.join(projectRoot, 'venv/bin/python3') 
      : 'python3';
      
    pythonProcess = spawn(pythonCmd, args, { cwd: projectRoot });

    pythonProcess.stdout.on('data', (out) => {
      console.log(`[Python] ${out.toString().trim()}`);
    });

    pythonProcess.stderr.on('data', (err) => {
      console.error(`[Python Err] ${err.toString().trim()}`);
    });

    pythonProcess.on('close', (code) => {
      console.log(`Python process exited with code ${code}`);
      pythonProcess = null;
    });

    // Automatically start polling InfluxDB to simulate the live data stream
    if (influxPollInterval) clearInterval(influxPollInterval);
    
    influxPollInterval = setInterval (async () => {
      // Fetch the absolute latest record for all telemetry and inference fields in one optimized query
      const query = `
        from(bucket: "${INFLUX_BUCKET}")
          |> range(start: -1m)
          |> filter(fn: (r) => r._measurement == "telemetry" or r._measurement == "inference")
          |> filter(fn: (r) => r.plug_id == "${plugId}")
          |> last()
      `;

      try {
        const telemetryPayload = { electrical: {} };
        const inferencePayload = {};
        let hasTelemetry = false;
        let hasInference = false;
        
        for await (const { values, tableMeta } of queryApi.iterateRows(query)) {
          const row = tableMeta.toObject(values);
          if (row._measurement === 'telemetry') {
            telemetryPayload.electrical[row._field] = row._value;
            hasTelemetry = true;
          }
          if (row._measurement === 'inference') {
            inferencePayload[row._field] = row._value;
            hasInference = true;
          }
        }

        if (hasTelemetry) {
          telemetryPayload.plug_id = plugId;
          telemetryPayload.timestamp = new Date().toISOString();
          socket.emit('telemetry', telemetryPayload);
        }
        if (hasInference) {
          inferencePayload.plug_id = plugId;
          socket.emit('inference', inferencePayload);
        }
      } catch (error) {
        console.error('Error polling InfluxDB:', error.message);
      }
    }, 1000); // Poll every 1000 milliseconds (1 update per second)
  });

  socket.on('stop_simulation', () => {
    if (pythonProcess) {
      console.log('Stopping simulation...');
      pythonProcess.kill('SIGINT');
      pythonProcess = null;
    }
    if (influxPollInterval) {
      clearInterval(influxPollInterval);
      influxPollInterval = null;
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    if (influxPollInterval) {
      clearInterval(influxPollInterval);
      influxPollInterval = null;
    }
    if (io.engine.clientsCount === 0 && pythonProcess) {
      pythonProcess.kill('SIGINT');
      pythonProcess = null;
    }
  });
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
