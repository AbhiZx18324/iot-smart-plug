import React, { useState, useEffect } from 'react';
import { useLiveInflux } from '../hooks/useLiveInflux';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// --- Configuration ---
const TELEMETRY_OPTIONS = [
  { id: 'power_active', label: 'Active Power', unit: 'W', color: '#00d8ff' },
  { id: 'voltage_rms', label: 'RMS Voltage', unit: 'V', color: '#ffb74d' },
  { id: 'current_rms', label: 'RMS Current', unit: 'A', color: '#f06292' },
  { id: 'frequency', label: 'Frequency', unit: 'Hz', color: '#0f860b' }
];

// --- Query to detect active devices dynamically ---
const PLUGS_QUERY = `
  import "influxdata/influxdb/schema"
  schema.tagValues(
    bucket: "${import.meta.env.VITE_INFLUX_BUCKET}",
    tag: "plug_id",
    start: -5m
  )
`;

// --- Helper Function: Generate Flux Queries ---
const generateFluxQuery = (measurement, field, plugId, isNumeric = true) => {
  if (!plugId) return '';
  return `
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
};

// --- Reusable Metadata Card ---
const StatusCard = ({ title, measurement, field, color, plugId }) => { // Added plugId parameter
  // Pass the plugId correctly to the query generator
  const query = generateFluxQuery(measurement, field, plugId, false);
  const liveData = useLiveInflux(query, 2000);
  
  let latestValue = liveData.length > 0 ? liveData[liveData.length - 1].value : '--';
  if (typeof latestValue === 'boolean') {
    latestValue = latestValue ? 'TRUE' : 'FALSE';
  } else if (typeof latestValue === 'number' && !Number.isInteger(latestValue)) {
    latestValue = latestValue.toFixed(2);
  }

  return (
    <div style={{ background: 'linear-gradient(180deg, rgba(16,24,40,0.6) 0%, rgba(9,13,20,0.8) 100%)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(0, 216, 255, 0.15)', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ color: '#8b9bb4', margin: '0 0 8px 0', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>{title}</h3>
      <div style={{ fontSize: '32px', fontWeight: '800', color: color, textShadow: `0 0 20px ${color}66`, fontFamily: '"Space Mono", "Courier New", monospace' }}>
        {latestValue}
      </div>
    </div>
  );
};

// --- Inference Card ---
const InferenceCard = ({ plugId }) => {
  const classData = useLiveInflux(generateFluxQuery('inference', 'load_class', plugId, false), 2000);
  const confData = useLiveInflux(generateFluxQuery('inference', 'confidence', plugId, false), 2000);
  const stabData = useLiveInflux(generateFluxQuery('inference', 'stability', plugId, false), 2000);
  const anomData = useLiveInflux(generateFluxQuery('inference', 'is_anomaly', plugId, false), 2000);
  const scoreData = useLiveInflux(generateFluxQuery('inference', 'anomaly_score', plugId, false), 2000);
  
  const getValue = (data) => {
    let val = data.length > 0 ? data[data.length - 1].value : '--';
    if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
    if (typeof val === 'number' && !Number.isInteger(val)) return val.toFixed(2);
    return val;
  };

  const loadClass = getValue(classData);
  const confidence = getValue(confData);
  const stability = getValue(stabData);
  const isAnomaly = getValue(anomData);
  const anomalyScore = getValue(scoreData);

  return (
    <div style={{ background: 'linear-gradient(180deg, rgba(16,24,40,0.6) 0%, rgba(9,13,20,0.8) 100%)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(0, 216, 255, 0.15)', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <h3 style={{ color: '#00d8ff', margin: '0 0 20px 0', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '2px', textShadow: '0 0 10px rgba(0,216,255,0.4)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{width: '8px', height: '8px', background: '#00d8ff', borderRadius: '50%', boxShadow: '0 0 8px #00d8ff'}}></span>
        ML Inference Engine
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        <div>
          <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Predicted Class</div>
          <div style={{ color: '#00d8ff', textShadow: '0 0 15px rgba(0,216,255,0.5)', fontFamily: '"Space Mono", "Courier New", monospace', fontSize: String(loadClass).length > 15 ? '14px' : String(loadClass).length > 10 ? '16px' : '20px', fontWeight: 'bold' }}>{loadClass}</div>
        </div>
        <div>
          <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Anomaly State</div>
          <div style={{ color: isAnomaly === 'TRUE' ? '#ff3333' : '#00e676', textShadow: isAnomaly === 'TRUE' ? '0 0 15px rgba(255,51,51,0.5)' : '0 0 15px rgba(0,230,118,0.5)', fontFamily: '"Space Mono", "Courier New", monospace', fontSize: '20px', fontWeight: 'bold' }}>
            {isAnomaly} {isAnomaly === 'TRUE' && <span style={{fontSize: '12px', color: '#e96417'}}>({anomalyScore})</span>}
          </div>
        </div>
        <div>
          <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Confidence</div>
          <div style={{ color: '#ffb74d', textShadow: '0 0 15px rgba(255,183,77,0.5)', fontFamily: '"Space Mono", "Courier New", monospace', fontSize: '20px', fontWeight: 'bold' }}>{confidence}</div>
        </div>
        <div>
          <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Stability</div>
          <div style={{ color: '#f06292', textShadow: '0 0 15px rgba(240,98,146,0.5)', fontFamily: '"Space Mono", "Courier New", monospace', fontSize: '20px', fontWeight: 'bold' }}>{stability}</div>
        </div>
      </div>
    </div>
  );
};

// --- Main Dashboard Assembly ---
export default function Dashboard() {
  // Fetch distinct plug IDs that have sent data in the last 5 minutes
  const livePlugsData = useLiveInflux(PLUGS_QUERY, 5000);
  const dynamicPlugs = Array.from(new Set(livePlugsData.map(d => d.value))).filter(Boolean);

  const [activePlug, setActivePlug] = useState('');
  const [selectedFieldId, setSelectedFieldId] = useState(TELEMETRY_OPTIONS[0].id);
  const [isOffline, setIsOffline] = useState(false);

  // Auto-select the first available plug if none is selected
  useEffect(() => {
    if (!activePlug && dynamicPlugs.length > 0) {
      setActivePlug(dynamicPlugs[0]);
    }
  }, [dynamicPlugs, activePlug]);

  // Define currentSelection by finding the matching object in TELEMETRY_OPTIONS
  const currentSelection = TELEMETRY_OPTIONS.find(opt => opt.id === selectedFieldId);

  // Generate the chartQuery dynamically based on the active plug AND selected field
  const chartQuery = generateFluxQuery('telemetry', currentSelection.id, activePlug, true);
  
  // Pass the generated query to the hook
  const liveChartData = useLiveInflux(chartQuery, 2000);

  useEffect(() => {
    let timeoutId;
    if (activePlug && liveChartData.length === 0) {
      setIsOffline(false);
      timeoutId = setTimeout(() => {
        setIsOffline(true);
      }, 5000);
    } else {
      setIsOffline(false);
    }
    return () => clearTimeout(timeoutId);
  }, [activePlug, liveChartData.length]);

  return (
    <div style={{ width: '95%', maxWidth: '100%', marginLeft: '20px', minHeight: '95vh', padding: '30px', borderRadius: '24px', fontFamily: '"Orbitron", "Rajdhani", system-ui, sans-serif', background: '#050810', backgroundImage: 'radial-gradient(ellipse at top, #0f172a 0%, #050810 70%)', color: '#e2e8f0', boxShadow: '0 0 50px rgba(0,0,0,0.5)', border: '1px solid #1e293b', boxSizing: 'border-box' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid rgba(0, 216, 255, 0.15)', display: 'flex', alignItems: 'center' }}>
        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#00d8ff', boxShadow: '0 0 15px #00d8ff', marginRight: '15px' }}></div>
        <h2 style={{ color: '#fff', margin: 0, fontSize: '28px', letterSpacing: '2px', textTransform: 'uppercase', textShadow: '0 0 15px rgba(255,255,255,0.3)' }}>Smart Plug Analytics <span style={{color: '#00d8ff', fontSize: '14px', verticalAlign: 'middle', marginLeft: '10px', textShadow: 'none'}}>v2.0</span></h2>
      </div>

      {/* DYNAMIC Device Selector */}
      <div style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '15px' }}>
        <h3 style={{ margin: 0, color: '#8b9bb4', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>Active Uplink:</h3>
        {dynamicPlugs.length === 0 ? (
          <div style={{ color: '#00d8ff', fontSize: '14px', fontStyle: 'italic' }}>Scanning network for active plugs...</div>
        ) : (
          <select 
            value={activePlug} 
            onChange={(e) => setActivePlug(e.target.value)}
            style={{ 
              padding: '10px 16px', 
              borderRadius: '8px', 
              background: 'rgba(15, 23, 42, 0.8)', 
              color: '#00d8ff', 
              border: '1px solid rgba(0, 216, 255, 0.3)',
              boxShadow: '0 0 15px rgba(0, 216, 255, 0.1) inset',
              cursor: 'pointer',
              outline: 'none',
              fontSize: '14px',
              fontWeight: '600',
              letterSpacing: '1px',
              textTransform: 'uppercase'
            }}
          >
            {dynamicPlugs.map(plug => (
              <option key={plug} value={plug}>
                {plug}
              </option>
            ))}
          </select>
        )}
      </div>


      {/* Top Row: State Metadata */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        {activePlug ? (
          <>
            <StatusCard title="Appliance Truth" measurement="state_metadata" field="appliance_truth" color="#b088f9" plugId={activePlug} />
            <StatusCard title="Relay Status" measurement="state_metadata" field="relay" color="#00e676" plugId={activePlug} />
            <InferenceCard plugId={activePlug} />
          </>
        ) : (
          <div style={{ color: '#64748b', padding: '30px', background: 'rgba(16,24,40,0.4)', borderRadius: '16px', border: '1px dashed #1e293b', fontStyle: 'italic' }}>
            No devices currently active.
          </div>
        )}
      </div>


      {/* Interactive Chart Section */}
      <div style={{ background: 'linear-gradient(180deg, rgba(16,24,40,0.6) 0%, rgba(9,13,20,0.8) 100%)', padding: '30px', borderRadius: '16px', border: '1px solid rgba(0, 216, 255, 0.15)', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(10px)' }}>
        
        {/* Dropdown Menu Control */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, color: currentSelection.color, textTransform: 'uppercase', letterSpacing: '1.5px', textShadow: `0 0 15px ${currentSelection.color}80` }}>
            {currentSelection.label} ({currentSelection.unit})
          </h3>
          
          <select 
            value={selectedFieldId} 
            onChange={(e) => setSelectedFieldId(e.target.value)}
            style={{ 
              padding: '10px 16px', 
              borderRadius: '8px', 
              background: 'rgba(15, 23, 42, 0.8)', 
              color: currentSelection.color, 
              border: `1px solid ${currentSelection.color}40`,
              boxShadow: `0 0 15px ${currentSelection.color}20 inset`,
              cursor: 'pointer',
              outline: 'none',
              fontWeight: '600',
              letterSpacing: '1px'
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
          {!activePlug || liveChartData.length === 0 ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#64748b', fontStyle: 'italic', letterSpacing: '1px' }}>
              <p>{!activePlug ? 'Waiting for a device to be selected...' : isOffline ? 'System is offline' : `Loading ${currentSelection.label} for ${activePlug}...`}</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={liveChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="time" stroke="#334155" tick={{fill: '#64748b', fontSize: 12, fontFamily: '"Space Mono", "Courier New", monospace'}} minTickGap={30} />
                <YAxis stroke="#334155" tick={{fill: '#64748b', fontSize: 12, fontFamily: '"Space Mono", "Courier New", monospace'}} domain={['auto', 'auto']} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(15,23,42,0.9)', border: '1px solid rgba(0,216,255,0.3)', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)' }}
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