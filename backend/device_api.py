import os
import sys
import subprocess
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Dictionary to keep track of running terminal processes: { "plug_id": process_object }
active_processes = {}

def spawn_terminal(plug_id, appliance, fault):
    """Kills any existing process for this plug, then spawns a new visible terminal."""
    kill_terminal(plug_id)
    
    cmd = [sys.executable, "-m", "sensor_simulation.mqtt_publisher", plug_id, appliance]
    if fault:
        cmd.append(fault)
        
    print(f"[*] Spawning new terminal: {' '.join(cmd)}")
    
    kwargs = {}
    if os.name == 'nt':
        kwargs['creationflags'] = subprocess.CREATE_NO_WINDOW
        
    p = subprocess.Popen(cmd, **kwargs)
    active_processes[plug_id] = p

def kill_terminal(plug_id):
    """Kills the terminal process if it is currently running."""
    if plug_id in active_processes:
        print(f"[*] Killing terminal for {plug_id}")
        p = active_processes[plug_id]
        p.terminate()
        del active_processes[plug_id]

@app.route('/api/devices', methods=['POST'])
def deploy_device():
    data = request.json
    spawn_terminal(data.get('plugId'), data.get('appliance'), data.get('fault'))
    return jsonify({"status": "success", "message": "Terminal spawned"})

@app.route('/api/devices/<plug_id>', methods=['PUT'])
def update_device(plug_id):
    data = request.json
    if data.get('state') == "ON": 
        spawn_terminal(plug_id, data.get('appliance'), data.get('fault'))
    elif data.get('state') == "OFF":
        kill_terminal(plug_id)
    return jsonify({"status": "success"})

@app.route('/api/devices/<plug_id>', methods=['DELETE'])
def remove_device(plug_id):
    kill_terminal(plug_id)
    return jsonify({"status": "success", "message": "Device deleted"})

if __name__ == '__main__':
    print("Starting Local Device API on http://localhost:8000")
    app.run(port=8000)
