import React, { useState, useEffect } from 'react';

// The 5 core appliance archetypes and their specific fault modes
const APPLIANCES = [
  { id: 'Fan', name: 'Fan', fault: 'bearing_wear' },
  { id: 'Laptop', name: 'Laptop', fault: 'bearing_wear' },
  { id: 'Incandescent Light Bulb', name: 'Incandescent Light Bulb', fault: 'flicker' },
  { id: 'Compact Flourescent Lamp', name: 'Compact Flourescent Lamp', fault: 'flicker' },
  { id: 'Heater', name: 'Heater', fault: 'coil_damage' },
  { id: 'Microwave', name: 'Microwave', fault: 'coil_damage' },
  { id: 'Hairdryer', name: 'Hairdryer', fault: 'coil_damage' },
  { id: 'Fridge', name: 'Fridge', fault: 'compressor_degradation' },
  { id: 'Air Conditioner', name: 'Air Conditioner', fault: 'compressor_degradation' },
  { id: 'Washing Machine', name: 'Washing Machine', fault: 'drum_imbalance' },

];

const generateRandomPlugId = () => `plug-${Math.floor(Math.random() * 9000 + 1000)}-sim`;

export default function DeviceManager({ onOpenDashboard }) {
  const [plugId, setPlugId] = useState(generateRandomPlugId());
  const [appliance, setAppliance] = useState(APPLIANCES[0].id);
  const [injectAnomaly, setInjectAnomaly] = useState(false);
  
  // Track active deployed devices to manage them later
  const [deployedDevices, setDeployedDevices] = useState(() => {
    const saved = localStorage.getItem('deployedDevices');
    return saved ? JSON.parse(saved) : [];
  });

  // Save to localStorage whenever the deployed devices change
  useEffect(() => {
    localStorage.setItem('deployedDevices', JSON.stringify(deployedDevices));
  }, [deployedDevices]);

  const selectedAppliance = APPLIANCES.find(a => a.id === appliance);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (deployedDevices.find(d => d.plugId === plugId)) {
      alert("A device with this Plug ID is already deployed!");
      return;
    }

    const command = {
      plugId,
      appliance,
      state: 'ON',
      fault: injectAnomaly ? selectedAppliance.fault : null
    };
    
    try {
      const response = await fetch('http://localhost:8000/api/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(command)
      });
      
      if (!response.ok) throw new Error("Backend API rejected request");
      
      setDeployedDevices([...deployedDevices, command]);
      setPlugId(generateRandomPlugId());
      setInjectAnomaly(false);
    } catch (err) {
      alert("Failed to connect. Ensure backend/device_api.py is running on port 5000!");
    }
  };

  const toggleDeviceState = async (device) => {
    const newState = device.state === 'ON' ? 'OFF' : 'ON';
    const updatedDevice = { ...device, state: newState };
    
    try {
      await fetch(`http://localhost:8000/api/devices/${device.plugId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatedDevice) });
      setDeployedDevices(deployedDevices.map(d => d.plugId === device.plugId ? updatedDevice : d));
    } catch (err) { alert("API Error"); }
  };

  const toggleDeviceAnomaly = async (device) => {
    const appInfo = APPLIANCES.find(a => a.id === device.appliance);
    const newFault = device.fault ? null : appInfo.fault;
    
    // Anomaly toggle always ensures the device is ON (kills and respawns terminal)
    const updatedDevice = { ...device, fault: newFault, state: 'ON' }; 
    
    try {
      await fetch(`http://localhost:8000/api/devices/${device.plugId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatedDevice) });
      setDeployedDevices(deployedDevices.map(d => d.plugId === device.plugId ? updatedDevice : d));
    } catch (err) { alert("API Error"); }
  };

  const deleteDevice = async (plugId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/devices/${plugId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error("Backend API rejected request");

      setDeployedDevices(deployedDevices.filter(d => d.plugId !== plugId));
    } catch (err) { alert("Backend Error: Ensure device_api.py is running and has been restarted recently!"); }
  };

  return (
    <div style={{ width: '95%', maxWidth: '800px', margin: '40px auto', padding: '30px', borderRadius: '24px', fontFamily: '"Roboto", "Segoe UI", system-ui, sans-serif', background: '#050810', backgroundImage: 'radial-gradient(ellipse at top, #0f172a 0%, #050810 70%)', color: '#e2e8f0', boxShadow: '0 0 50px rgba(0,0,0,0.5)', border: '1px solid #1e293b', boxSizing: 'border-box' }}>
      
      <h1 style={{ textAlign: 'center', color: '#00d8ff', fontSize: '32px', letterSpacing: '3px', textTransform: 'uppercase', textShadow: '0 0 20px rgba(0,216,255,0.5)', margin: '10px 0 40px 0' }}>Welcome to Smart Plug !!</h1>

      {/* Header */}
      <div style={{ marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid rgba(0, 216, 255, 0.15)', display: 'flex', alignItems: 'center' }}>
        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#00d8ff', boxShadow: '0 0 15px #00d8ff', marginRight: '15px' }}></div>
        <h2 style={{ color: '#fff', margin: 0, fontSize: '28px', letterSpacing: '2px', textTransform: 'uppercase', textShadow: '0 0 15px rgba(255,255,255,0.3)' }}>Device Command Center</h2>
      </div>

      {/* Form Container */}
      <div style={{ background: 'linear-gradient(180deg, rgba(16,24,40,0.6) 0%, rgba(9,13,20,0.8) 100%)', padding: '30px', borderRadius: '16px', border: '1px solid rgba(0, 216, 255, 0.15)', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(10px)' }}>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Plug ID Input */}
            <div>
              <label style={{ display: 'block', color: '#8b9bb4', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Plug ID</label>
              <input 
                type="text" 
                value={plugId}
                readOnly
                style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.4)', color: '#64748b', border: '1px dashed rgba(0, 216, 255, 0.3)', outline: 'none', fontSize: '14px', fontFamily: '"Roboto Mono", monospace', cursor: 'not-allowed', boxSizing: 'border-box' }}
              />
            </div>

            {/* Appliance Selector */}
            <div>
              <label style={{ display: 'block', color: '#8b9bb4', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Appliance Profile</label>
              <select 
                value={appliance}
                onChange={(e) => setAppliance(e.target.value)}
                style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.8)', color: '#00d8ff', border: '1px solid rgba(0, 216, 255, 0.3)', boxShadow: '0 0 15px rgba(0, 216, 255, 0.1) inset', outline: 'none', fontSize: '14px', cursor: 'pointer', fontFamily: '"Roboto Mono", monospace', boxSizing: 'border-box' }}
              >
                {APPLIANCES.map(app => (
                  <option key={app.id} value={app.id}>{app.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'center' }}>
            {/* Initial Anomaly Switch */}
            <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '12px 16px', borderRadius: '8px', border: '1px dashed rgba(0, 216, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxSizing: 'border-box', height: '100%' }}>
              <div>
                <label style={{ color: '#8b9bb4', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px', display: 'block' }}>Initial Fault</label>
                <div style={{ height: '12px', color: '#ff3333', fontSize: '10px', fontFamily: '"Roboto Mono", monospace', opacity: injectAnomaly ? 1 : 0, transition: 'opacity 0.3s' }}>
                  {selectedAppliance?.fault || 'None'}
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setInjectAnomaly(!injectAnomaly)}
                style={{ 
                  padding: '6px 16px', borderRadius: '20px', 
                  border: `2px solid ${injectAnomaly ? '#ff3333' : '#555'}`, 
                  background: injectAnomaly ? 'rgba(255, 51, 51, 0.1)' : 'transparent', 
                  color: injectAnomaly ? '#ff3333' : '#888', 
                  fontSize: '12px', fontWeight: 'bold', cursor: 'pointer',
                  textShadow: injectAnomaly ? '0 0 10px rgba(255,51,51,0.5)' : 'none',
                  boxShadow: injectAnomaly ? '0 0 10px rgba(255,51,51,0.2) inset' : 'none',
                  transition: 'all 0.3s ease'
                }}
              >
                {injectAnomaly ? 'ANOMALY' : 'NORMAL'}
              </button>
            </div>

            {/* Submit Button */}
            <button 
              type="submit"
              style={{ 
                padding: '14px 16px', borderRadius: '8px', 
                background: '#00d8ff', color: '#000', border: 'none', 
                fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', 
                letterSpacing: '1.5px', cursor: 'pointer',
                boxShadow: '0 0 15px rgba(0,216,255,0.4)', transition: 'all 0.2s', boxSizing: 'border-box', height: '100%'
              }}
            >
              Deploy Virtual Device
            </button>
          </div>
        </form>
      </div>

      {/* Deployed Devices List */}
      {deployedDevices.length > 0 && (
        <div style={{ marginTop: '40px' }}>
          <h3 style={{ color: '#00d8ff', fontSize: '16px', textTransform: 'uppercase', letterSpacing: '2px', textShadow: '0 0 10px rgba(0,216,255,0.4)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ width: '8px', height: '8px', background: '#00e676', borderRadius: '50%', boxShadow: '0 0 10px #00e676' }}></span>
            Active Deployments
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
            {deployedDevices.map((dev) => (
              <div key={dev.plugId} style={{ background: 'linear-gradient(90deg, rgba(15,23,42,0.8) 0%, rgba(9,13,20,0.8) 100%)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(0, 216, 255, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <button 
                    onClick={() => deleteDevice(dev.plugId)}
                    title="Remove Device"
                    style={{ 
                      padding: '8px 12px', borderRadius: '8px', 
                      border: '1px solid rgba(255, 51, 51, 0.4)', 
                      background: 'rgba(255, 51, 51, 0.1)', 
                      color: '#ff3333', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                  <div>
                    <div style={{ color: '#fff', fontSize: '18px', fontWeight: 'bold', fontFamily: '"Roboto Mono", monospace' }}>{dev.plugId}</div>
                    <div style={{ color: '#8b9bb4', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '5px' }}>{dev.appliance}</div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                  <button 
                    onClick={() => toggleDeviceState(dev)}
                    style={{ 
                      padding: '8px 20px', borderRadius: '8px', 
                      border: `1px solid ${dev.state === 'ON' ? '#00e676' : '#555'}`, 
                      background: dev.state === 'ON' ? 'rgba(0, 230, 118, 0.1)' : 'transparent', 
                      color: dev.state === 'ON' ? '#00e676' : '#888', 
                      fontSize: '12px', fontWeight: 'bold', cursor: 'pointer',
                      textShadow: dev.state === 'ON' ? '0 0 10px rgba(0,230,118,0.5)' : 'none',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {dev.state === 'ON' ? 'POWER: ON' : 'POWER: OFF'}
                  </button>

                  <button 
                    onClick={() => toggleDeviceAnomaly(dev)}
                    disabled={dev.state === 'OFF'}
                    style={{ 
                      padding: '8px 20px', borderRadius: '8px', 
                      border: `1px solid ${dev.fault ? '#ff3333' : '#00d8ff'}`, 
                      background: dev.fault ? 'rgba(255, 51, 51, 0.1)' : 'rgba(0, 216, 255, 0.1)', 
                      color: dev.fault ? '#ff3333' : '#00d8ff', 
                      fontSize: '12px', fontWeight: 'bold', cursor: dev.state === 'OFF' ? 'not-allowed' : 'pointer',
                      opacity: dev.state === 'OFF' ? 0.3 : 1,
                      textShadow: dev.fault ? '0 0 10px rgba(255,51,51,0.5)' : '0 0 10px rgba(0,216,255,0.5)',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {dev.fault ? 'STATE: FAULTY' : 'STATE: HEALTHY'}
                  </button>
                  
                  <button 
                    onClick={() => onOpenDashboard(dev.plugId)}
                    style={{ 
                      padding: '8px 20px', borderRadius: '8px', 
                      border: `1px solid #b088f9`, 
                      background: 'rgba(176, 136, 249, 0.1)', 
                      color: '#b088f9', 
                      fontSize: '12px', fontWeight: 'bold', cursor: 'pointer',
                      textShadow: '0 0 10px rgba(176, 136, 249, 0.5)',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    VIEW DASHBOARD
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}