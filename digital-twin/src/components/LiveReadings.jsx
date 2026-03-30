import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

const METRICS = [
  { key: 'power_active', label: 'Active Power', unit: 'W', color: '#38bdf8', decimals: 2 },
  { key: 'voltage_rms', label: 'RMS Voltage', unit: 'V', color: '#d97706', decimals: 2 },
  { key: 'current_rms', label: 'RMS Current', unit: 'A', color: '#db2777', decimals: 3 },
  { key: 'frequency', label: 'Frequency', unit: 'Hz', color: '#16a34a', decimals: 1 },
];

function GaugeCard({ label, value, unit, color, decimals }) {
  const displayVal = value !== null && value !== undefined
    ? Number(value).toFixed(decimals)
    : '--';

  return (
    <div style={{
      background: 'var(--bg-card)', padding: '20px', borderRadius: '14px',
      border: '1px solid var(--border-subtle)', boxShadow: 'var(--card-shadow)',
      display: 'flex', flexDirection: 'column',
      minWidth: 0,
    }}>
      <div style={{
        color: 'var(--text-secondary)', fontSize: '13px',
        letterSpacing: '0.2px', marginBottom: '8px', fontWeight: 600,
      }}>{label}</div>
      <div style={{
        fontSize: '28px', fontWeight: 800, color, fontFamily: 'var(--font-mono)',
        lineHeight: 1.1,
      }}>
        {displayVal}
      </div>
      <div style={{
        fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px',
        fontFamily: 'var(--font-mono)',
      }}>{unit}</div>
    </div>
  );
}

export default function LiveReadings({ latestSample, history, isRunning }) {
  const [selectedMetric, setSelectedMetric] = useState('power_active');
  const metric = METRICS.find(m => m.key === selectedMetric);

  const electrical = latestSample?.electrical || {};

  // Prepare chart data — last 100 points
  const chartData = history.slice(-100).map((sample, i) => ({
    idx: i,
    time: new Date(sample.timestamp).toLocaleTimeString('en-US', { hour12: false, minute: '2-digit', second: '2-digit' }),
    value: sample.electrical[selectedMetric],
  }));

  return (
    <div className="slide-up">
      {/* Gauge Cards */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '14px', marginBottom: '20px',
      }}>
        {METRICS.map(m => (
          <GaugeCard
            key={m.key}
            label={m.label}
            value={isRunning ? electrical[m.key] : null}
            unit={m.unit}
            color={m.color}
            decimals={m.decimals}
          />
        ))}
      </div>

      {/* Chart */}
      <div style={{
        background: 'var(--bg-card)', padding: '24px', borderRadius: '16px',
        border: '1px solid var(--border-subtle)', boxShadow: 'var(--card-shadow)',
      }}>
        {/* Chart header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '16px',
        }}>
          <h3 style={{
            margin: 0, color: metric.color, fontSize: '15px',
            letterSpacing: '0.2px', fontWeight: 700,
          }}>
            {metric.label} ({metric.unit})
          </h3>
          <select
            value={selectedMetric}
            onChange={e => setSelectedMetric(e.target.value)}
            style={{
              padding: '8px 14px', borderRadius: '8px',
              background: 'var(--bg-card-solid)', color: metric.color,
              border: `1px solid ${metric.color}40`,
              cursor: 'pointer', outline: 'none', fontWeight: 600,
              fontSize: '13px', letterSpacing: '0.2px',
              fontFamily: 'var(--font-body)',
            }}
          >
            {METRICS.map(m => (
              <option key={m.key} value={m.key}>{m.label}</option>
            ))}
          </select>
        </div>

        {/* Chart body */}
        <div style={{ height: '280px', width: '100%' }}>
          {!isRunning || chartData.length === 0 ? (
            <div style={{
              display: 'flex', justifyContent: 'center', alignItems: 'center',
              height: '100%', color: 'var(--text-muted)', fontStyle: 'italic',
              letterSpacing: '0.2px', fontSize: '15px',
            }}>
              {!isRunning ? 'Power on a device to begin streaming...' : 'Collecting data...'}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id={`grad-${selectedMetric}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={metric.color} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={metric.color} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="time" stroke="#cbd5e1"
                  tick={{ fill: '#6b7280', fontSize: 11, fontFamily: 'var(--font-mono)' }}
                  minTickGap={40}
                />
                <YAxis
                  stroke="#cbd5e1"
                  tick={{ fill: '#6b7280', fontSize: 11, fontFamily: 'var(--font-mono)' }}
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-card-solid)', border: `1px solid ${metric.color}25`,
                    borderRadius: '8px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                    fontSize: '13px',
                  }}
                  itemStyle={{ color: metric.color }}
                  formatter={(value) => [`${Number(value).toFixed(metric.decimals)} ${metric.unit}`, metric.label]}
                />
                <Area
                  type="monotone" dataKey="value"
                  stroke={metric.color} strokeWidth={2}
                  fill={`url(#grad-${selectedMetric})`}
                  dot={false} isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
