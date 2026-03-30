import React, { useState, useCallback, useEffect } from 'react';
import { io } from 'socket.io-client';
import LiveReadings from './components/LiveReadings';
import MLOutput from './components/MLOutput';
import InteractiveSocket from './components/InteractiveSocket';
import { APPLIANCES } from './constants';

const socket = io('http://localhost:3001');

export default function App() {
  const [selectedId, setSelectedId] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [faultMode, setFaultMode] = useState(null);
  const [sessionPlugId, setSessionPlugId] = useState('twin-001'); // Initialize with a default or a unique ID
  const [theme, setTheme] = useState('dark');

  const [latestSample, setLatestSample] = useState(null);
  const [history, setHistory] = useState([]);
  const [inference, setInference] = useState(null);

  const selectedAppliance = APPLIANCES.find(a => a.id === selectedId);

  // Effect for initializing and updating theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('smart-plug-theme') || 'dark';
    setTheme(savedTheme);
  }, []);

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
    localStorage.setItem('smart-plug-theme', theme);
  }, [theme]);

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
          loadClass: payload.load_class || 'Unknown',
          confidence: payload.confidence || 0.0,
          stability: payload.stability || 0.0,
          isAnomaly: payload.is_anomaly || false,
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

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

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
            width: '10px', height: '10px', borderRadius: '50%',
            background: 'var(--accent-blue)',
            marginRight: '14px',
          }} />
          <h1 style={{
            color: 'var(--text-primary)', margin: 0, fontSize: '22px', letterSpacing: '-0.3px',
            fontWeight: 700,
          }}>
            IoT Smart Plug Simulator
            <span style={{
              color: 'var(--accent-blue)', fontSize: '12px', verticalAlign: 'middle',
              marginLeft: '12px', fontWeight: 600,
            }}>Digital Twin</span>
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {selectedAppliance && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '6px 16px', borderRadius: '20px',
              background: 'rgba(56, 189, 248, 0.06)',
              border: '1px solid rgba(56, 189, 248, 0.15)',
            }}>
              <span style={{ fontSize: '18px' }}>{selectedAppliance.icon}</span>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: '13px',
                color: 'var(--accent-blue)',
              }}>{selectedAppliance.name}</span>
            </div>
          )}
          <button
            onClick={toggleTheme}
            title="Toggle Theme"
            style={{
              background: 'var(--bg-card-solid)',
              border: '1px solid var(--border-subtle)',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
            }}
          >{theme === 'light' ? '🌙' : '☀️'}</button>
        </div>
      </div>

      {/* Hero Visual Digital Twin */}
      <div style={{ marginBottom: '30px' }}>
        <InteractiveSocket
          isRunning={isRunning}
          power={currentPower}
          faultMode={faultMode}
          isAnomaly={inference?.isAnomaly}
          selectedAppliance={selectedAppliance}
          onTogglePower={handleTogglePower}
          onSelectDevice={handleSelectDevice}
          onFaultChange={handleFaultChange}
        />
      </div>

      {/* Analytics Layer: ML Output & Live Readings */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'minmax(350px, 1fr) 2fr', gap: '24px',
      }}>
        <MLOutput inference={inference} isRunning={isRunning} />
        <LiveReadings latestSample={latestSample} history={history} isRunning={isRunning} />
      </div>

      {/* Footer */}
      <div style={{
        marginTop: '30px', padding: '16px 0', textAlign: 'center',
        borderTop: '1px solid var(--border-subtle)',
        color: 'var(--text-muted)', fontSize: '12px', letterSpacing: '0.3px',
      }}>
        Smart Plug Digital Twin — Connected to Live Python Simulation Backend
      </div>
    </div>
  );
}
