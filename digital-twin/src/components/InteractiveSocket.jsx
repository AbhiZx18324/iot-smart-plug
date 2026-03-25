import React, { useState } from 'react';
import { APPLIANCES } from '../constants';

export default function InteractiveSocket({ 
  isRunning, power, faultMode, isAnomaly, 
  selectedAppliance, onTogglePower, onSelectDevice, onFaultChange 
}) {
  const [isDeviceMenuOpen, setIsDeviceMenuOpen] = useState(false);
  const [isFaultMenuOpen, setIsFaultMenuOpen] = useState(false);

  const glowColor = isAnomaly ? '#ff3333' : faultMode ? '#e96417' : '#00d8ff';
  const wireColor = isRunning ? glowColor : '#334155';
  const intensity = isRunning ? Math.min(power / 1400, 1) * 0.8 + 0.2 : 0;

  const availableFault = selectedAppliance?.fault;

  return (
    <div style={{
      background: 'var(--bg-card)', padding: '40px', borderRadius: '24px',
      border: `1px solid ${isAnomaly ? 'rgba(255,51,51,0.4)' : 'var(--border-subtle)'}`, 
      boxShadow: 'var(--card-shadow)', backdropFilter: 'blur(20px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative',
      transition: 'border-color 0.5s ease',
      minHeight: '400px', overflow: 'visible', zIndex: 10
    }}>
      
      {/* Background ambient lighting */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: '300px', height: '300px', borderRadius: '50%',
        background: glowColor, filter: 'blur(100px)', opacity: isRunning ? 0.15 : 0.05,
        transition: 'all 0.5s ease', pointerEvents: 'none', zIndex: 0
      }} />

      <h3 style={{
        color: 'var(--accent-cyan)', margin: '0 0 30px 0', fontSize: '14px',
        textTransform: 'uppercase', letterSpacing: '3px', width: '100%', textAlign: 'center',
        textShadow: '0 0 15px rgba(0,216,255,0.4)', zIndex: 1
      }}>
        Interactive Physical Twin
      </h3>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', width: '100%', position: 'relative', zIndex: 10 }}>
        
        {/* Left Side: Smart Plug Socket */}
        <div style={{ position: 'relative' }}>
          <svg viewBox="0 0 160 260" width="160" height="260" style={{ filter: `drop-shadow(0 15px 25px rgba(0,0,0,0.5))` }}>
            <defs>
              <linearGradient id="plugGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>
              <radialGradient id="ledGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={glowColor} stopOpacity="1" />
                <stop offset="100%" stopColor={glowColor} stopOpacity="0" />
              </radialGradient>
              <filter id="btnGlow">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Smart plug body */}
            <rect x="20" y="20" width="120" height="220" rx="20" fill="url(#plugGrad)" stroke={glowColor} strokeWidth="2" strokeOpacity={isRunning ? 0.6 : 0.2} />
            
            {/* Socket Face */}
            <circle cx="80" cy="80" r="40" fill="#0b1120" stroke="#334155" strokeWidth="2" />
            <rect x="65" y="65" width="8" height="15" rx="4" fill="#050810" />
            <rect x="87" y="65" width="8" height="15" rx="4" fill="#050810" />
            <circle cx="80" cy="95" r="5" fill="#050810" />

            {/* LED indicator */}
            {isRunning && <circle cx="80" cy="140" r="15" fill="url(#ledGlow)" style={{ animation: 'pulse-glow 1.5s infinite' }} />}
            <circle cx="80" cy="140" r="4" fill={isRunning ? '#fff' : '#334155'} />

            {/* Large Power Button */}
            <g style={{ cursor: selectedAppliance ? 'pointer' : 'not-allowed', transition: 'all 0.2s ease' }} 
               onClick={selectedAppliance ? onTogglePower : undefined}
               transform={`translate(0, ${isRunning ? 2 : 0})`}
               className="svg-button">
              <circle cx="80" cy="190" r="28" fill="#050810" stroke={isRunning ? glowColor : "#334155"} strokeWidth="2" filter={isRunning ? 'url(#btnGlow)' : 'none'} />
              
              {/* Power icon path */}
              <path d="M80 176 v12" fill="none" stroke={isRunning ? glowColor : "#64748b"} strokeWidth="3" strokeLinecap="round" />
              <path d="M70 182 a 12 12 0 1 0 20 0" fill="none" stroke={isRunning ? glowColor : "#64748b"} strokeWidth="3" strokeLinecap="round" />
              
              <text x="80" y="235" fill="var(--text-muted)" fontSize="10" letterSpacing="1px" fontWeight="bold" textAnchor="middle" pointerEvents="none">
                POWER
              </text>
            </g>
          </svg>
        </div>

        {/* Center: Animated Wire SVG */}
        <div style={{ flex: 1, minWidth: '150px', height: '100px', display: 'flex', alignItems: 'center' }}>
          <svg width="100%" height="40" style={{ overflow: 'visible' }}>
            <line x1="0" y1="20" x2="100%" y2="20" stroke="#1e293b" strokeWidth="6" strokeLinecap="round" />
            {isRunning && (
              <line x1="0" y1="20" x2="100%" y2="20" 
                stroke={glowColor} strokeWidth="3" strokeLinecap="round"
                strokeDasharray="10 15" 
                style={{ animation: 'power-flow 0.5s linear infinite' }}
                opacity={intensity}
              />
            )}
          </svg>
        </div>

        {/* Right Side: Appliance Visualizer & Dropdown */}
        <div style={{ position: 'relative', zIndex: 100 }}>
          
          <div onClick={() => setIsDeviceMenuOpen(!isDeviceMenuOpen)}
               style={{
            width: '160px', height: '160px', borderRadius: '24px',
            background: 'linear-gradient(135deg, rgba(30,41,59,0.8), rgba(15,23,42,0.9))',
            border: `2px solid ${isRunning ? glowColor : 'rgba(255,255,255,0.1)'}`,
            boxShadow: isRunning ? `0 0 30px ${glowColor}40` : '0 10px 25px rgba(0,0,0,0.5)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.3s ease', zIndex: 60, position: 'relative'
          }}>
            {!selectedAppliance ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '20px' }}>
                <div style={{ fontSize: '24px', marginBottom: '10px' }}>🔌</div>
                Select Device
              </div>
            ) : (
              <>
                <div style={{ 
                  fontSize: '54px', 
                  filter: isRunning ? `drop-shadow(0 0 15px ${glowColor})` : 'none',
                  animation: isRunning && selectedAppliance.id === 'Fan' ? 'rotate 2s linear infinite' : 'none'
                }}>
                  {selectedAppliance.icon}
                </div>
                <div style={{ 
                  marginTop: '15px', fontSize: '12px', fontWeight: 600, color: '#fff', 
                  textAlign: 'center', padding: '0 10px', textShadow: isRunning ? `0 0 10px ${glowColor}` : 'none'
                }}>
                  {selectedAppliance.name}
                </div>
              </>
            )}
          </div>

          {/* Click Menu for Devices with screen protector backdrop */}
          {isDeviceMenuOpen && (
            <>
              {/* Invisible Click Background Overlay */}
              <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={() => setIsDeviceMenuOpen(false)}></div>
              
              <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', paddingTop: '15px', zIndex: 100 }}>
                <div style={{
                  background: 'rgba(15,23,42,0.98)', border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '16px', padding: '12px', width: '220px',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)',
                  backdropFilter: 'blur(20px)', animation: 'slide-up 0.2s ease-out'
                }}>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px', paddingLeft: '8px' }}>
                    Available Appliances
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '200px', overflowY: 'auto' }}>
                    {APPLIANCES.map(app => (
                      <button key={app.id} onClick={(e) => { e.stopPropagation(); onSelectDevice(app.id); setIsDeviceMenuOpen(false); }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px',
                          background: selectedAppliance?.id === app.id ? 'var(--accent-cyan)' : 'transparent',
                          color: selectedAppliance?.id === app.id ? '#000' : '#fff',
                          border: 'none', borderRadius: '10px', cursor: 'pointer', textAlign: 'left',
                          fontWeight: selectedAppliance?.id === app.id ? 700 : 500, fontSize: '13px',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = selectedAppliance?.id !== app.id ? 'rgba(255,255,255,0.1)' : 'var(--accent-cyan)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = selectedAppliance?.id !== app.id ? 'transparent' : 'var(--accent-cyan)'}
                      >
                        <span style={{ fontSize: '16px' }}>{app.icon}</span> 
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Embedded Fault Controls */}
      <div style={{ 
        marginTop: '40px', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '40px',
        paddingTop: '30px', borderTop: '1px solid rgba(255,255,255,0.05)', position: 'relative', zIndex: 90
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
           <div style={{ color: 'var(--text-muted)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>
             Sensor Telemetry
           </div>
           <div style={{ fontSize: '26px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: isRunning ? glowColor : 'var(--text-muted)', textShadow: isRunning ? `0 0 15px ${glowColor}80` : 'none' }}>
             {isRunning ? `${power.toFixed(1)}W` : '0.0W'}
           </div>
        </div>

        <div style={{ width: '1px', height: '40px', background: 'rgba(255,255,255,0.1)' }} />

        {/* Fault Click Menu */}
        <div style={{ position: 'relative' }}>
           
           <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
             <div style={{ color: 'var(--text-muted)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>
               Fault Injector
             </div>
             
             <button onClick={() => { if(isRunning && selectedAppliance) setIsFaultMenuOpen(!isFaultMenuOpen) }}
                     disabled={!isRunning || !selectedAppliance} style={{
               padding: '10px 24px', borderRadius: '24px', background: faultMode ? 'rgba(233,100,23,0.15)' : 'rgba(255,255,255,0.05)',
               border: `1px solid ${faultMode ? 'var(--accent-orange)' : 'rgba(255,255,255,0.2)'}`,
               color: faultMode ? 'var(--accent-orange)' : 'var(--text-secondary)', cursor: (isRunning && selectedAppliance) ? 'pointer' : 'not-allowed',
               fontSize: '13px', fontWeight: 700, letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px',
               boxShadow: faultMode ? '0 0 15px rgba(233,100,23,0.3)' : 'none', opacity: (isRunning && selectedAppliance) ? 1 : 0.4
             }}>
               {faultMode ? '⚠ ANOMALY ACTIVE ▼' : '⟲ NORMAL ▼'}
             </button>
             
             {isFaultMenuOpen && isRunning && selectedAppliance && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={() => setIsFaultMenuOpen(false)}></div>

                  <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', paddingTop: '10px', zIndex: 100 }}>
                    <div style={{
                      background: 'rgba(15,23,42,0.98)', border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '12px', padding: '8px', width: '220px',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.8)', backdropFilter: 'blur(20px)', animation: 'slide-up 0.2s ease-out'
                    }}>
                      <button onClick={(e) => { e.stopPropagation(); onFaultChange('none'); setIsFaultMenuOpen(false); }}
                        style={{ width: '100%', padding: '12px', background: !faultMode ? 'rgba(255,255,255,0.1)' : 'transparent', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontSize: '13px' }}
                        onMouseEnter={(e) => { if (faultMode) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                        onMouseLeave={(e) => { if (faultMode) e.currentTarget.style.background = 'transparent' }}
                      >
                        ⟲ NORMAL (HEALTHY)
                      </button>
                      {availableFault && (
                        <button onClick={(e) => { e.stopPropagation(); onFaultChange(availableFault); setIsFaultMenuOpen(false); }}
                          style={{ width: '100%', padding: '12px', marginTop: '4px', background: faultMode ? 'rgba(233,100,23,0.3)' : 'transparent', color: 'var(--accent-orange)', border: 'none', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontSize: '13px', fontWeight: 'bold' }}
                          onMouseEnter={(e) => { if (!faultMode) e.currentTarget.style.background = 'rgba(233,100,23,0.1)' }}
                          onMouseLeave={(e) => { if (!faultMode) e.currentTarget.style.background = 'transparent' }}
                        >
                          ⚠ INJECT: {availableFault.replace('_', ' ').toUpperCase()}
                        </button>
                      )}
                    </div>
                  </div>
                </>
             )}
           </div>
        </div>

      </div>
    </div>
  );
}
