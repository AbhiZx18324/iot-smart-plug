import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import DeviceManager from './components/Device';

function App() {
  // State to track if we are viewing a specific dashboard
  const [selectedPlug, setSelectedPlug] = useState(null);

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', backgroundColor: '#050810', overflow: 'auto', fontFamily: '"Roboto", "Segoe UI", system-ui, sans-serif', backgroundImage: 'radial-gradient(ellipse at top, rgba(15, 23, 42, 0.5) 0%, rgba(5, 8, 16, 0.5) 70%)' }}>
      <div style={{ flex: 1, padding: '40px' }}>
        {selectedPlug ? (
          <Dashboard targetPlugId={selectedPlug} onBack={() => setSelectedPlug(null)} />
        ) : (
          <DeviceManager onOpenDashboard={setSelectedPlug} />
        )}
      </div>

    </div>
  );
}

export default App;