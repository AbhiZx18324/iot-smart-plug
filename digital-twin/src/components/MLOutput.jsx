import React from 'react';
import { LOAD_CLASS_LABELS } from '../constants';

function ConfidenceBar({ label, value, color }) {
  const pct = Math.round((value || 0) * 100);
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', marginBottom: '4px',
      }}>
        <span style={{
          fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px',
          color: 'var(--text-muted)',
        }}>{label}</span>
        <span style={{
          fontSize: '13px', fontFamily: 'var(--font-mono)', fontWeight: 700,
          color, textShadow: `0 0 10px ${color}50`,
        }}>{pct}%</span>
      </div>
      <div style={{
        height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.05)',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', width: `${pct}%`, borderRadius: '3px',
          background: `linear-gradient(90deg, ${color}80, ${color})`,
          boxShadow: `0 0 10px ${color}40`,
          transition: 'width 0.3s ease',
        }} />
      </div>
    </div>
  );
}

export default function MLOutput({ inference, isRunning }) {
  const hasInference = inference && inference.loadClass;

  return (
    <div style={{
      background: 'var(--bg-card)', padding: '24px', borderRadius: '16px',
      border: `1px solid ${inference?.isAnomaly ? 'rgba(255,51,51,0.3)' : 'var(--border-subtle)'}`,
      boxShadow: 'var(--card-shadow)', backdropFilter: 'blur(10px)',
      transition: 'border-color 0.3s ease',
    }}
    className={inference?.isAnomaly ? 'anomaly-active' : ''}
    >
      <h3 style={{
        color: 'var(--accent-cyan)', margin: '0 0 20px 0', fontSize: '13px',
        textTransform: 'uppercase', letterSpacing: '2px',
        textShadow: '0 0 10px rgba(0,216,255,0.4)',
        display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        <span style={{
          width: '8px', height: '8px', borderRadius: '50%',
          background: hasInference ? 'var(--accent-cyan)' : '#555',
          boxShadow: hasInference ? '0 0 8px var(--accent-cyan)' : 'none',
        }} />
        ML Inference Engine
      </h3>

      {!isRunning ? (
        <div style={{
          color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '13px',
          padding: '20px 0',
        }}>
          Waiting for simulation to start...
        </div>
      ) : !hasInference ? (
        <div style={{
          color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '13px',
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
              fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px',
              color: 'var(--text-muted)', marginBottom: '6px',
            }}>Predicted Appliance Class</div>
            <div style={{
              fontSize: '22px', fontWeight: 800, color: 'var(--accent-purple)',
              fontFamily: 'var(--font-mono)',
              textShadow: '0 0 15px rgba(176,136,249,0.5)',
            }}>
              {LOAD_CLASS_LABELS[inference.loadClass] || inference.loadClass}
            </div>
          </div>

          {/* Confidence and Stability bars */}
          <ConfidenceBar label="Confidence" value={inference.confidence} color="var(--accent-amber)" />
          <ConfidenceBar label="Stability" value={inference.stability} color="var(--accent-pink)" />

          {/* Anomaly Status */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px',
            marginTop: '16px', padding: '14px', borderRadius: '10px',
            background: 'rgba(15, 23, 42, 0.4)',
            border: '1px solid rgba(255,255,255,0.05)',
          }}>
            <div>
              <div style={{
                fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px',
                color: 'var(--text-muted)', marginBottom: '6px',
              }}>Anomaly State</div>
              <div style={{
                fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-mono)',
                color: inference.isAnomaly ? 'var(--accent-red)' : 'var(--accent-green)',
                textShadow: inference.isAnomaly
                  ? '0 0 15px rgba(255,51,51,0.5)'
                  : '0 0 15px rgba(0,230,118,0.5)',
              }}>
                {inference.isAnomaly ? 'ANOMALY' : 'NORMAL'}
              </div>
            </div>
            <div>
              <div style={{
                fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px',
                color: 'var(--text-muted)', marginBottom: '6px',
              }}>Anomaly Score</div>
              <div style={{
                fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-mono)',
                color: inference.anomalyScore > 0.8 ? 'var(--accent-orange)' : 'var(--text-secondary)',
                textShadow: inference.anomalyScore > 0.8 ? '0 0 15px rgba(233,100,23,0.5)' : 'none',
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
