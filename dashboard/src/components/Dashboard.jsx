import React from 'react';
import { useLiveInflux } from '../hooks/useLiveInflux';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Your backend metadata
const MEASUREMENT = "telemetry"; 
const FIELD = "power_active";

const FLUX_QUERY = `
  from(bucket: "${import.meta.env.VITE_INFLUX_BUCKET}")
    |> range(start: -5m)
    |> filter(fn: (r) => r._measurement == "${MEASUREMENT}")
    |> filter(fn: (r) => r._field == "${FIELD}")
    |> aggregateWindow(every: 2s, fn: mean, createEmpty: false)
`;

export default function Dashboard() {
  const liveData = useLiveInflux(FLUX_QUERY, 2000);

  return (
    /* Outer container to handle centering */
    <div style={{ 
    width: '95%', 
    maxWidth: '1400px', 
    margin: '20px' // Provides a small gap from screen edges
  }}>
    <div style={{ 
      background: '#111111', 
      padding: '24px', 
      borderRadius: '12px',
      border: '1px solid #333',
      boxShadow: '0 4px 20px rgba(0,0,0,0.8)'
    }}>
        
        {/* Header with Telemetry & Field Info */}
        <div style={{ marginBottom: '20px', borderBottom: '1px solid #333', paddingBottom: '15px' }}>
          <h2 style={{ color: '#00d8ff', margin: 0 }}>Live System Telemetry</h2>
          <div style={{ display: 'flex', gap: '20px', marginTop: '10px', fontSize: '14px', color: '#888' }}>
            <span><strong>Measurement:</strong> <span style={{color: '#ccc'}}>{MEASUREMENT}</span></span>
            <span><strong>Field:</strong> <span style={{color: '#ccc'}}>{FIELD}</span></span>
            <span style={{ marginLeft: 'auto', color: '#00ff88' }}>● Live</span>
          </div>
        </div>

        {/* Chart Section */}
        <div style={{ height: '450px', width: '100%' }}>
          {liveData.length === 0 ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <p>Searching for {FIELD} in {MEASUREMENT}...</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={liveData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <XAxis 
                    dataKey="time" 
                    stroke="#555" 
                    tick={{fill: '#888', fontSize: 12}} 
                    minTickGap={30}
                />
                <YAxis stroke="#555" tick={{fill: '#888'}} domain={['auto', 'auto']} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#222', border: '1px solid #444', borderRadius: '8px' }}
                  itemStyle={{ color: '#00d8ff' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#00d8ff" 
                  strokeWidth={3} 
                  dot={false} 
                  animationDuration={400}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}