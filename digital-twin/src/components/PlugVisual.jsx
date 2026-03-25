import React from 'react';

export default function PlugVisual({ isRunning, power, faultMode, isAnomaly }) {
  const maxPower = 1400;
  const intensity = isRunning ? Math.min(power / maxPower, 1) : 0;
  const glowColor = isAnomaly ? '#ff3333' : faultMode ? '#e96417' : '#00d8ff';
  const glowOpacity = isRunning ? 0.3 + intensity * 0.7 : 0.1;

  return (
    <div style={{
      background: 'var(--bg-card)', padding: '24px', borderRadius: '16px',
      border: '1px solid var(--border-subtle)', boxShadow: 'var(--card-shadow)',
      backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', minHeight: '260px',
    }}>
      <h3 style={{
        color: 'var(--text-secondary)', margin: '0 0 16px 0', fontSize: '12px',
        textTransform: 'uppercase', letterSpacing: '1.5px', alignSelf: 'flex-start',
      }}>
        Digital Twin Visual
      </h3>

      <svg viewBox="0 0 200 200" width="180" height="180" style={{ overflow: 'visible' }}>
        {/* Background glow */}
        <defs>
          <radialGradient id="plugGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={glowColor} stopOpacity={glowOpacity * 0.6} />
            <stop offset="100%" stopColor={glowColor} stopOpacity={0} />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="plugBody" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
        </defs>

        {/* Ambient glow circle */}
        <circle cx="100" cy="100" r="90" fill="url(#plugGlow)" />

        {/* Outer frame */}
        <rect x="40" y="40" width="120" height="120" rx="16"
          fill="url(#plugBody)" stroke={glowColor} strokeWidth="1.5"
          strokeOpacity={isRunning ? 0.5 : 0.15}
          filter={isRunning ? 'url(#glow)' : ''}
          style={{ transition: 'all 0.3s ease' }}
        />

        {/* Socket holes */}
        <circle cx="75" cy="85" r="8" fill="#0a0f1a" stroke="#334155" strokeWidth="1.5" />
        <circle cx="125" cy="85" r="8" fill="#0a0f1a" stroke="#334155" strokeWidth="1.5" />

        {/* Ground pin hole */}
        <rect x="93" y="108" width="14" height="8" rx="3"
          fill="#0a0f1a" stroke="#334155" strokeWidth="1.5"
        />

        {/* Power indicator LED */}
        <circle cx="100" cy="135" r="4"
          fill={isRunning ? glowColor : '#1e293b'}
          stroke={isRunning ? glowColor : '#334155'} strokeWidth="1"
          style={{
            filter: isRunning ? `drop-shadow(0 0 6px ${glowColor})` : 'none',
            animation: isRunning ? 'pulse-glow 2s ease-in-out infinite' : 'none',
          }}
        />

        {/* Power flow lines (animated when running) */}
        {isRunning && (
          <>
            <line x1="75" y1="75" x2="75" y2="55"
              stroke={glowColor} strokeWidth="2" strokeLinecap="round"
              strokeDasharray="4 4"
              style={{ animation: 'power-flow 0.5s linear infinite' }}
              opacity={intensity}
            />
            <line x1="125" y1="75" x2="125" y2="55"
              stroke={glowColor} strokeWidth="2" strokeLinecap="round"
              strokeDasharray="4 4"
              style={{ animation: 'power-flow 0.5s linear infinite' }}
              opacity={intensity}
            />
          </>
        )}

        {/* Anomaly warning icon */}
        {isAnomaly && (
          <g transform="translate(145, 40)">
            <polygon points="15,0 30,26 0,26" fill="none" stroke="#ff3333" strokeWidth="2"
              style={{ animation: 'pulse-glow 1s ease-in-out infinite' }}
            />
            <text x="15" y="22" textAnchor="middle" fill="#ff3333" fontSize="16" fontWeight="bold">!</text>
          </g>
        )}
      </svg>

      {/* Power readout */}
      <div style={{
        marginTop: '12px', textAlign: 'center',
        fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 600,
        color: isRunning ? glowColor : 'var(--text-muted)',
        textShadow: isRunning ? `0 0 15px ${glowColor}50` : 'none',
      }}>
        {isRunning ? `${power.toFixed(1)} W` : 'OFF'}
      </div>
    </div>
  );
}
