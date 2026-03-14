import React, { useState } from 'react';
import { useLiveInflux } from '../hooks/useLiveInflux';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// --- Configuration ---
const PLUGS = ['plug_01_motor', 'plug_02_light', 'plug_03_thermal', 'plug_04_hvac', 'plug_05_laundry']; // Added missing PLUGS array

const TELEMETRY_OPTIONS = [
  { id: 'power_active', label: 'Active Power', unit: 'W', color: '#00d8ff' },
  { id: 'voltage_rms', label: 'RMS Voltage', unit: 'V', color: '#ffb74d' },
  { id: 'current_rms', label: 'RMS Current', unit: 'A', color: '#f06292' },
  { id: 'frequency', label: 'Frequency', unit: 'Hz', color: '#4fc3f7' }
];

// --- Helper Function: Generate Flux Queries ---
const generateFluxQuery = (measurement, field, plugId, isNumeric = true) => `
  from(bucket: "${import.meta.env.VITE_INFLUX_BUCKET}")
    |> range(start: -5m)
    |> filter(fn: (r) => r._measurement == "${measurement}")
    |> filter(fn: (r) => r._field == "${field}")
    |> filter(fn: (r) => r.plug_id == "${plugId}")
    ${isNumeric 
      ? '|> aggregateWindow(every: 2s, fn: mean, createEmpty: false)' 
      : '|> last()'
    }
`;

// --- Reusable Metadata Card ---
const StatusCard = ({ title, measurement, field, color, plugId }) => { // Added plugId parameter
  // Pass the plugId correctly to the query generator
  const query = generateFluxQuery(measurement, field, plugId, false);
  const liveData = useLiveInflux(query, 2000);
  const latestValue = liveData.length > 0 ? liveData[liveData.length - 1].value : '--';

  return (
    <div style={{ background: '#111111', padding: '20px', borderRadius: '12px', border: '1px solid #333', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <h3 style={{ color: '#888', margin: '0 0 10px 0', fontSize: '14px', textTransform: 'uppercase' }}>{title}</h3>
      <div style={{ fontSize: '28px', fontWeight: 'bold', color: color }}>
        {latestValue}
      </div>
    </div>
  );
};

// --- Main Dashboard Assembly ---
export default function Dashboard() {
  // Initialize with the first plug so it doesn't crash on load
  const [activePlug, setActivePlug] = useState(PLUGS[0]);
  const [selectedFieldId, setSelectedFieldId] = useState(TELEMETRY_OPTIONS[0].id);

  // Define currentSelection by finding the matching object in TELEMETRY_OPTIONS
  const currentSelection = TELEMETRY_OPTIONS.find(opt => opt.id === selectedFieldId);

  // Generate the chartQuery dynamically based on the active plug AND selected field
  const chartQuery = generateFluxQuery('telemetry', currentSelection.id, activePlug, true);
  
  // Pass the generated query to the hook
  const liveChartData = useLiveInflux(chartQuery, 2000);

  return (
    <div style={{ width: '95%', maxWidth: '100%', marginLeft: '20px', fontFamily: 'sans-serif' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #333' }}>
        <h2 style={{ color: '#fff', margin: 0, fontSize: '24px' }}>Smart Plug Analytics</h2>
        <div style={{ display: 'flex', gap: '20px', marginTop: '8px', fontSize: '14px', color: '#00ff88' }}>
          <span>● System Online & Live</span>
        </div>
      </div>

      {/* Top Row: State Metadata */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        {/* Pass activePlug down to the StatusCards */}
        <StatusCard title="Appliance Truth" measurement="state_metadata" field="appliance_truth" color="#b088f9" plugId={activePlug} />
        <StatusCard title="Relay Status" measurement="state_metadata" field="relay" color="#00e676" plugId={activePlug} />
      </div>

      {/* DYNAMIC Tab Bar */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        {PLUGS.map(plug => (
          <button 
            key={plug} 
            onClick={() => setActivePlug(plug)}
            style={{
              padding: '10px 20px',
              backgroundColor: activePlug === plug ? '#00d8ff' : '#222',
              color: activePlug === plug ? '#000' : '#fff',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            {plug}
          </button>
        ))}
      </div>

      {/* Interactive Chart Section */}
      <div style={{ background: '#111111', padding: '24px', borderRadius: '12px', border: '1px solid #333' }}>
        
        {/* Dropdown Menu Control */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, color: currentSelection.color }}>
            {currentSelection.label} ({currentSelection.unit})
          </h3>
          
          <select 
            value={selectedFieldId} 
            onChange={(e) => setSelectedFieldId(e.target.value)}
            style={{ 
              padding: '8px 12px', 
              borderRadius: '6px', 
              background: '#222', 
              color: '#fff', 
              border: '1px solid #444',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            {TELEMETRY_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* The Single Dynamic Line Chart */}
        <div style={{ height: '400px', width: '100%' }}>
          {liveChartData.length === 0 ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#666' }}>
              <p>Loading {currentSelection.label} for {activePlug}...</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={liveChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <XAxis dataKey="time" stroke="#555" tick={{fill: '#888', fontSize: 12}} minTickGap={30} />
                <YAxis stroke="#555" tick={{fill: '#888', fontSize: 12}} domain={['auto', 'auto']} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#222', border: '1px solid #444', borderRadius: '8px' }}
                  itemStyle={{ color: currentSelection.color }}
                  formatter={(value) => [`${Number(value).toFixed(2)} ${currentSelection.unit}`, currentSelection.label]}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke={currentSelection.color} 
                  strokeWidth={3} 
                  dot={false} 
                  isAnimationActive={false} 
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}