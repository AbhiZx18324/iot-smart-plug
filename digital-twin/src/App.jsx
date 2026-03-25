import React, { useState, useCallback, useEffect } from 'react';
import { io } from 'socket.io-client';
import DeviceSelector from './components/DeviceSelector';
import ControlPanel from './components/ControlPanel';
import LiveReadings from './components/LiveReadings';
import MLOutput from './components/MLOutput';
import PlugVisual from './components/PlugVisual';
import { APPLIANCES } from './constants';

const socket = io('http://localhost:3001');

export default function App() {
  const [selectedId, setSelectedId] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [faultMode, setFaultMode] = useState(null);
  const [sessionPlugId, setSessionPlugId] = useState('twin-001'); // Initialize with a default or a unique ID

  const [latestSample, setLatestSample] = useState(null);
  const [history, setHistory] = useState([]);
  const [inference, setInference] = useState(null);

  const selectedAppliance = APPLIANCES.find(a => a.id === selectedId);

  useEffect(() => {
    const handleTelemetry = (payload) => {
      // Only accept telemetry if the UI explicitly started the simulation
      if (isRunning && payload.plug_id === sessionPlugId) {
        setLatestSample(payload);
        setHistory(prev => [...prev.slice(-199), payload]);
      }
    };

    const handleInference = (payload) => {
      if (isRunning && payload.plug_id === sessionPlugId) {
        setInference({
          loadClass: payload.predicted_class || 'Unknown',
          confidence: payload.confidence || 0.0,
          stability: 1.0, 
          isAnomaly: payload.anomaly_score > 0.8,
          anomalyScore: payload.anomaly_score || 0.0
        });
      }
    };

    socket.on('telemetry', handleTelemetry);
    socket.on('inference', handleInference);

    return () => {
      socket.off('telemetry', handleTelemetry);
      socket.off('inference', handleInference);
    };
  }, [isRunning, selectedAppliance, sessionPlugId]);

  const startSimulation = useCallback(() => {
    if (!selectedId) return;
    setIsRunning(true);
    setHistory([]);
    setLatestSample(null);
    setInference(null);

    const newPlugId = `twin-${Date.now()}`;
    setSessionPlugId(newPlugId);

    const appliance = APPLIANCES.find(a => a.id === selectedId);
    socket.emit('start_simulation', {
      plugId: newPlugId,
      appliance: appliance.id,
      faultMode: faultMode ? appliance.fault : null
    });
  }, [selectedId, faultMode]);

  const stopSimulation = useCallback(() => {
    setIsRunning(false);
    socket.emit('stop_simulation');
  }, []);

  const handleTogglePower = useCallback(() => {
    if (isRunning) {
      stopSimulation();
    } else {
      startSimulation();
    }
  }, [isRunning, startSimulation, stopSimulation]);

  const handleFaultChange = useCallback((newFaultVal) => {
    if (!isRunning) return;
    const actualFault = newFaultVal === 'none' ? null : newFaultVal;
    setFaultMode(actualFault);
    
    // Clear the history immediately so the ML graphs don't lag behind the physical state change
    setHistory([]);
    setLatestSample(null);
    setInference(null);

    const newPlugId = `twin-${Date.now()}`;
    setSessionPlugId(newPlugId);

    // Provide immediate restart parameter to backend
    socket.emit('start_simulation', {
      plugId: newPlugId,
      appliance: selectedAppliance.id,
      faultMode: actualFault
    });
  }, [isRunning, selectedAppliance]);

  const handleSelectDevice = useCallback((id) => {
    if (isRunning) stopSimulation();
    setSelectedId(id);
    setFaultMode(null);
  }, [isRunning, stopSimulation]);

  const currentPower = latestSample?.electrical?.power_active || 0;

  return (
    <div style={{
      maxWidth: '1400px', margin: '0 auto', padding: '30px 40px',
      minHeight: '100vh',
    }}>
      {/* Header */}
      <div style={{
        marginBottom: '30px', paddingBottom: '20px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{
            width: '14px', height: '14px', borderRadius: '50%',
            background: 'var(--accent-cyan)',
            boxShadow: '0 0 20px var(--accent-cyan)',
            marginRight: '16px',
          }} />
          <h1 style={{
            color: '#fff', margin: 0, fontSize: '26px', letterSpacing: '2px',
            textTransform: 'uppercase', fontWeight: 800,
            textShadow: '0 0 15px rgba(255,255,255,0.2)',
          }}>
            Digital Twin
            <span style={{
              color: 'var(--accent-cyan)', fontSize: '12px', verticalAlign: 'middle',
              marginLeft: '12px', textShadow: 'none', fontWeight: 600,
            }}>Smart Plug Simulator</span>
          </h1>
        </div>

        {selectedAppliance && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '6px 16px', borderRadius: '20px',
            background: 'rgba(0, 216, 255, 0.08)',
            border: '1px solid rgba(0, 216, 255, 0.2)',
          }}>
            <span style={{ fontSize: '18px' }}>{selectedAppliance.icon}</span>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: '13px',
              color: 'var(--accent-cyan)',
            }}>{selectedAppliance.name}</span>
          </div>
        )}
      </div>

      {/* Device Selector */}
      <DeviceSelector selectedId={selectedId} onSelect={handleSelectDevice} />

      {/* Control Panel */}
      <div style={{ marginBottom: '24px' }}>
        <ControlPanel
          isRunning={isRunning}
          faultMode={faultMode}
          onTogglePower={handleTogglePower}
          onFaultChange={handleFaultChange}
          selectedAppliance={selectedAppliance}
        />
      </div>

      {/* Main Content: Twin Visual + ML | Live Readings */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '320px 1fr',
        gap: '20px',
      }}>
        {/* Left column: Visual + ML */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <PlugVisual
            isRunning={isRunning}
            power={currentPower}
            faultMode={faultMode}
            isAnomaly={inference?.isAnomaly}
          />
          <MLOutput
            inference={inference}
            isRunning={isRunning}
          />
        </div>

        {/* Right column: Live Readings */}
        <LiveReadings
          latestSample={latestSample}
          history={history}
          isRunning={isRunning}
        />
      </div>

      {/* Footer */}
      <div style={{
        marginTop: '30px', padding: '16px 0', textAlign: 'center',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        color: 'var(--text-muted)', fontSize: '12px', letterSpacing: '0.5px',
      }}>
        IoT Smart Plug Digital Twin — Connected to Live Python Simulation Backend
      </div>
    </div>
  );
}
