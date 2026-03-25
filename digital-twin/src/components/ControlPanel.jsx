import React from 'react';

export default function ControlPanel({ isRunning, faultMode, onTogglePower, onFaultChange, selectedAppliance }) {
  const availableFault = selectedAppliance?.fault;
  const currentFaultVal = faultMode || 'none';

  return (
    <div style={{
      background: 'var(--bg-card)', padding: '24px', borderRadius: '16px',
      border: '1px solid var(--border-subtle)', boxShadow: 'var(--card-shadow)',
      backdropFilter: 'blur(10px)',
    }}>
      <h3 style={{
        color: 'var(--text-secondary)', margin: '0 0 20px 0', fontSize: '12px',
        textTransform: 'uppercase', letterSpacing: '1.5px',
      }}>
        Simulation Controls
      </h3>

      <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Power Toggle */}
        <button
          onClick={onTogglePower}
          disabled={!selectedAppliance}
          style={{
            padding: '12px 28px', borderRadius: '10px', fontSize: '13px',
            fontWeight: 700, cursor: selectedAppliance ? 'pointer' : 'not-allowed',
            fontFamily: 'var(--font-mono)', letterSpacing: '1px',
            border: `2px solid ${isRunning ? 'var(--accent-red)' : 'var(--accent-green)'}`,
            background: isRunning ? 'rgba(255, 51, 51, 0.1)' : 'rgba(0, 230, 118, 0.1)',
            color: isRunning ? 'var(--accent-red)' : 'var(--accent-green)',
            boxShadow: isRunning
              ? '0 0 20px rgba(255,51,51,0.15) inset'
              : '0 0 20px rgba(0,230,118,0.15) inset',
            textShadow: isRunning
              ? '0 0 10px rgba(255,51,51,0.5)'
              : '0 0 10px rgba(0,230,118,0.5)',
            opacity: selectedAppliance ? 1 : 0.3,
            transition: 'all 0.3s ease',
            outline: 'none',
          }}
        >
          {isRunning ? '⏹ POWER OFF' : '⏵ POWER ON'}
        </button>

        {/* Fault Selector Dropdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{
            fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px',
            color: 'var(--text-muted)'
          }}>Fault Mode</label>
          <select
            value={currentFaultVal}
            onChange={(e) => onFaultChange(e.target.value)}
            disabled={!isRunning || !selectedAppliance}
            style={{
              padding: '10px 16px', borderRadius: '8px', fontSize: '13px',
              fontFamily: 'var(--font-mono)', letterSpacing: '0.5px',
              border: `1px solid ${faultMode ? 'var(--accent-orange)' : '#555'}`,
              background: faultMode ? 'rgba(233, 100, 23, 0.1)' : 'rgba(15, 23, 42, 0.6)',
              color: faultMode ? 'var(--accent-orange)' : 'var(--text-secondary)',
              boxShadow: faultMode ? '0 0 15px rgba(233,100,23,0.1) inset' : 'none',
              cursor: (isRunning && selectedAppliance) ? 'pointer' : 'not-allowed',
              opacity: (isRunning && selectedAppliance) ? 1 : 0.5,
              outline: 'none', minWidth: '220px', appearance: 'none'
            }}
          >
            <option value="none">None (Healthy)</option>
            {availableFault && (
              <option value={availableFault}>{availableFault.replace('_', ' ').toUpperCase()}</option>
            )}
          </select>
        </div>

        {/* Status indicator */}
        <div style={{
          marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px',
          padding: '8px 16px', borderRadius: '20px',
          background: 'rgba(15, 23, 42, 0.4)',
          border: '1px solid var(--border-subtle)',
        }}>
          <span style={{
            width: '10px', height: '10px', borderRadius: '50%',
            background: isRunning ? 'var(--accent-green)' : '#555',
            boxShadow: isRunning ? '0 0 10px var(--accent-green)' : 'none',
            animation: isRunning ? 'pulse-glow 2s ease-in-out infinite' : 'none',
          }} />
          <span style={{
            fontSize: '12px', fontFamily: 'var(--font-mono)',
            color: isRunning ? 'var(--accent-green)' : 'var(--text-muted)',
          }}>
            {isRunning ? 'STREAMING' : 'IDLE'}
          </span>
        </div>
      </div>
    </div>
  );
}
