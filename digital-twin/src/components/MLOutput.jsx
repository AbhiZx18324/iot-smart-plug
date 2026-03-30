import React from 'react';
import { LOAD_CLASS_LABELS } from '../constants';

function ConfidenceBar({ label, value }) {
  const pct = Math.round((value || 0) * 100);

  let color = '#22c55e'; // Green for high confidence/stability
  if (pct < 40) color = '#ef4444'; // Red for low
  else if (pct < 75) color = '#f59e0b'; // Amber for medium

  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', marginBottom: '5px',
      }}>
        <span style={{
          fontSize: '13px', letterSpacing: '0.2px',
          color: 'var(--text-secondary)', fontWeight: 600,
        }}>{label}</span>
        <span style={{
          fontSize: '14px', fontFamily: 'var(--font-mono)', fontWeight: 700,
          color,
        }}>{pct}%</span>
      </div>
      <div style={{
        height: '8px', borderRadius: '4px', background: 'rgba(0,0,0,0.06)',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', width: `${pct}%`, borderRadius: '4px',
          background: `linear-gradient(90deg, ${color}90, ${color})`,
          transition: 'width 0.3s ease, background 0.3s ease',
        }} />
      </div>
    </div>
  );
}

export default function MLOutput({ inference, isRunning }) {
  const hasInference = inference && inference.loadClass;
  const isAnomaly = inference?.isAnomaly;
  const isNormal = hasInference && !isAnomaly;

  // Determine CSS class for card animation
  let cardClass = '';
  if (isAnomaly) cardClass = 'anomaly-active';
  else if (isNormal) cardClass = 'normal-active';

  return (
    <div style={{
      background: 'var(--bg-card)', padding: '24px', borderRadius: '16px',
      border: `1px solid ${isAnomaly ? 'rgba(220,38,38,0.3)' : isNormal ? 'rgba(22,163,74,0.25)' : 'var(--border-subtle)'}`,
      boxShadow: 'var(--card-shadow)',
      transition: 'border-color 0.3s ease',
    }}
    className={cardClass}
    >
      <h3 style={{
        color: 'var(--accent-blue)', margin: '0 0 20px 0', fontSize: '15px',
        letterSpacing: '0.2px', fontWeight: 700,
        display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        <span style={{
          width: '8px', height: '8px', borderRadius: '50%',
          background: hasInference ? 'var(--accent-blue)' : '#cbd5e1',
          boxShadow: hasInference ? '0 0 6px var(--accent-blue)' : 'none',
        }} />
        ML Inference Engine
      </h3>

      {!isRunning ? (
        <div style={{
          color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '14px',
          padding: '20px 0',
        }}>
          Waiting for simulation to start...
        </div>
      ) : !hasInference ? (
        <div style={{
          color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '14px',
          padding: '20px 0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ animation: 'rotate 1s linear infinite', display: 'inline-block' }}>⟳</span>
            Waiting for inference from Python ML Service...
          </div>
        </div>
      ) : (
        <div className="fade-in">
          {/* Predicted Class */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{
              fontSize: '13px', letterSpacing: '0.2px',
              color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600,
            }}>Predicted Appliance Class</div>
            <div style={{
              fontSize: '22px', fontWeight: 800, color: 'var(--accent-purple)',
              fontFamily: 'var(--font-mono)',
            }}>
              {LOAD_CLASS_LABELS[inference.loadClass] || inference.loadClass}
            </div>
          </div>

          {/* Confidence and Stability bars */}
          <ConfidenceBar label="Confidence" value={inference.confidence} />
          <ConfidenceBar label="Stability" value={inference.stability} />

          {/* Anomaly Status */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px',
            marginTop: '16px', padding: '14px', borderRadius: '10px',
            background: 'rgba(0, 0, 0, 0.02)',
            border: '1px solid var(--border-subtle)',
          }}>
            <div>
              <div style={{
                fontSize: '13px', letterSpacing: '0.2px',
                color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600,
              }}>Anomaly State</div>
              <div style={{
                fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-mono)',
                color: inference.isAnomaly ? 'var(--accent-red)' : 'var(--accent-green)',
              }}>
                {inference.isAnomaly ? 'ANOMALY' : 'NORMAL'}
              </div>
            </div>
            <div>
              <div style={{
                fontSize: '13px', letterSpacing: '0.2px',
                color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600,
              }}>Anomaly Score</div>
              <div style={{
                fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-mono)',
                color: inference.anomalyScore > 0.8 ? 'var(--accent-orange)' : 'var(--text-secondary)',
              }}>
                {inference.anomalyScore?.toFixed(2) ?? '--'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
