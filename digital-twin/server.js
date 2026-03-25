import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mqtt from 'mqtt';
import { spawn } from 'child_process';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const MQTT_BROKER = 'mqtt://localhost:1884';
let mqttClient = null;
let pythonProcess = null;

// Connect to Mosquitto
mqttClient = mqtt.connect(MQTT_BROKER);

mqttClient.on('connect', () => {
  console.log('Connected to local Mosquitto broker');
  mqttClient.subscribe('smartplug/+/telemetry');
  mqttClient.subscribe('smartplug/+/inference');
});

mqttClient.on('message', (topic, message) => {
  try {
    const payload = JSON.parse(message.toString());
    if (topic.endsWith('/telemetry')) {
      io.emit('telemetry', payload);
    } else if (topic.endsWith('/inference')) {
      io.emit('inference', payload);
    }
  } catch (err) {
    console.error('Error parsing MQTT message:', err);
  }
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
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
  });

  socket.on('stop_simulation', () => {
    if (pythonProcess) {
      console.log('Stopping simulation...');
      pythonProcess.kill('SIGINT');
      pythonProcess = null;
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    if (io.engine.clientsCount === 0 && pythonProcess) {
      pythonProcess.kill('SIGINT');
      pythonProcess = null;
    }
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
