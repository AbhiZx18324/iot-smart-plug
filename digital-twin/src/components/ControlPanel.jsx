import React from 'react';

export default function ControlPanel({ isRunning, faultMode, onTogglePower, onFaultChange, selectedAppliance }) {
  const availableFault = selectedAppliance?.fault;
  const currentFaultVal = faultMode || 'none';

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(16,24,40,0.8) 0%, rgba(9,13,20,0.95) 100%)',
      padding: '28px', borderRadius: '20px',
      border: '1px solid rgba(255,255,255,0.08)',
      boxShadow: '0 15px 35px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
      backdropFilter: 'blur(20px)',
      position: 'relative', overflow: 'hidden'
    }}>
      {/* Decorative gradient orb */}
      <div style={{
        position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px',
        background: isRunning ? 'var(--accent-red)' : 'var(--accent-green)',
        filter: 'blur(60px)', opacity: 0.15, pointerEvents: 'none', transition: 'background 0.5s ease'
      }} />

      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'
      }}>
        <h3 style={{
          color: 'var(--text-primary)', margin: 0, fontSize: '15px', fontWeight: 600,
          letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          <span style={{ color: 'var(--accent-purple)' }}>⚡</span> Main Console
        </h3>

        {/* Status indicator badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '6px 14px', borderRadius: '30px',
          background: isRunning ? 'rgba(0, 230, 118, 0.1)' : 'rgba(255,255,255,0.05)',
          border: `1px solid ${isRunning ? 'rgba(0, 230, 118, 0.2)' : 'rgba(255,255,255,0.05)'}`,
        }}>
          <span style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: isRunning ? 'var(--accent-green)' : '#666',
            boxShadow: isRunning ? '0 0 10px var(--accent-green)' : 'none',
            animation: isRunning ? 'pulse-glow 2s infinite' : 'none',
          }} />
          <span style={{
            fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 600, letterSpacing: '1px',
            color: isRunning ? 'var(--accent-green)' : 'var(--text-muted)',
          }}>
            {isRunning ? 'LIVE' : 'OFFLINE'}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, 1fr) 1.5fr', gap: '20px', alignItems: 'end' }}>
        
        {/* Power Toggle Button */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <label style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--text-muted)', fontWeight: 600 }}>
            System Power
          </label>
          <button
            onClick={onTogglePower}
            disabled={!selectedAppliance}
            style={{
              padding: '16px', borderRadius: '14px', fontSize: '14px',
              fontWeight: 800, cursor: selectedAppliance ? 'pointer' : 'not-allowed',
              fontFamily: 'var(--font-body)', letterSpacing: '2px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px',
              border: `1px solid ${isRunning ? '#ff333380' : '#00e67680'}`,
              background: isRunning 
                ? 'linear-gradient(180deg, rgba(255,51,51,0.15) 0%, rgba(255,51,51,0.05) 100%)' 
                : 'linear-gradient(180deg, rgba(0,230,118,0.15) 0%, rgba(0,230,118,0.05) 100%)',
              color: isRunning ? '#ff5555' : '#00e676',
              boxShadow: isRunning
                ? '0 10px 20px rgba(255,51,51,0.1), inset 0 2px 0 rgba(255,100,100,0.2)'
                : '0 10px 20px rgba(0,230,118,0.1), inset 0 2px 0 rgba(100,255,150,0.2)',
              textShadow: isRunning ? '0 0 15px rgba(255,51,51,0.6)' : '0 0 15px rgba(0,230,118,0.6)',
              opacity: selectedAppliance ? 1 : 0.4,
              transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
              outline: 'none', transform: 'translateY(0)'
            }}
            onMouseDown={(e) => { if(selectedAppliance) e.currentTarget.style.transform = 'translateY(2px)'; }}
            onMouseUp={(e) => { if(selectedAppliance) e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <span style={{ fontSize: '18px' }}>{isRunning ? '⏹' : '⏵'}</span>
            {isRunning ? 'SHUTDOWN' : 'ACTIVATE'}
          </button>
        </div>

        {/* Fault Selector Dropdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <label style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--text-muted)', fontWeight: 600 }}>
            Fault Injector Interface
          </label>
          <div style={{ position: 'relative' }}>
            <select
              value={currentFaultVal}
              onChange={(e) => onFaultChange(e.target.value)}
              disabled={!isRunning || !selectedAppliance}
              style={{
                width: '100%', padding: '16px 20px', borderRadius: '14px', fontSize: '13px',
                fontFamily: 'var(--font-mono)', fontWeight: 600, letterSpacing: '1px',
                border: `1px solid ${faultMode ? 'var(--accent-orange)' : 'rgba(255,255,255,0.1)'}`,
                background: faultMode 
                  ? 'linear-gradient(90deg, rgba(233,100,23,0.15) 0%, rgba(233,100,23,0.05) 100%)' 
                  : 'rgba(15, 23, 42, 0.8)',
                color: faultMode ? 'var(--accent-orange)' : 'var(--text-primary)',
                boxShadow: faultMode ? '0 8px 25px rgba(233,100,23,0.15), inset 0 1px 0 rgba(255,200,100,0.1)' : 'inset 0 2px 10px rgba(0,0,0,0.3)',
                cursor: (isRunning && selectedAppliance) ? 'pointer' : 'not-allowed',
                opacity: (isRunning && selectedAppliance) ? 1 : 0.4,
                outline: 'none', appearance: 'none', transition: 'all 0.3s ease'
              }}
            >
              <option value="none">⟲ NORMAL (HEALTHY)</option>
              {availableFault && (
                <option value={availableFault}>⚠ {availableFault.replace('_', ' ').toUpperCase()}</option>
              )}
            </select>
            {/* Custom dropdown arrow to replace default browser appearance */}
            <div style={{
              position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)',
              pointerEvents: 'none', color: faultMode ? 'var(--accent-orange)' : 'var(--text-muted)',
              transition: 'color 0.3s ease'
            }}>
              ▼
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
