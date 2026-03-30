import React, { useState, useRef, useEffect } from 'react';
import { APPLIANCES } from '../constants';

export default function InteractiveSocket({ 
  isRunning, power, faultMode, isAnomaly, 
  selectedAppliance, onTogglePower, onSelectDevice, onFaultChange 
}) {
  const [isFaultMenuOpen, setIsFaultMenuOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [micFeedback, setMicFeedback] = useState('');
  const recognitionRef = useRef(null);

  const glowColor = isAnomaly ? '#dc2626' : faultMode ? '#ea580c' : '#38bdf8';
  const intensity = isRunning ? Math.min(power / 1400, 1) * 0.8 + 0.2 : 0;
  const availableFault = selectedAppliance?.fault;

  // Effect to handle cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handleMicClick = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMicFeedback("Speech API not supported in this browser");
      setTimeout(() => setMicFeedback(''), 3000);
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setMicFeedback('Listening...');
    };

    recognition.onresult = (event) => {
      let fullTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        fullTranscript += event.results[i][0].transcript;
      }

      const lastResult = event.results[event.results.length - 1];
      if (lastResult.isFinal) {
        const finalTranscript = fullTranscript.toLowerCase().trim();
        setMicFeedback(`Heard: "${finalTranscript}"`);
        console.log('Final transcript:', finalTranscript);

        const matchedAppliance = APPLIANCES.find(app => 
          finalTranscript.includes(app.name.toLowerCase()) ||
          finalTranscript.replace(/\s+/g, '').includes(app.name.toLowerCase().replace(/\s+/g, ''))
        );

        let applianceChanged = false;
        if (matchedAppliance && matchedAppliance.id !== selectedAppliance?.id) {
          onSelectDevice(matchedAppliance.id);
          applianceChanged = true;
        }
        
        if (!applianceChanged) {
          if (finalTranscript.includes('on')) {
            if (!isRunning && selectedAppliance) onTogglePower();
          } else if (finalTranscript.includes('off')) {
            if (isRunning && selectedAppliance) onTogglePower();
          }
        }

        recognition.stop();
      } else {
        setMicFeedback(`Hearing: "${fullTranscript}"...`);
      }
    };

    recognition.onerror = (event) => {
      if (event.error === 'no-speech') {
        setMicFeedback("Didn't hear anything clearly. Try again.");
      } else if (event.error === 'not-allowed') {
        setMicFeedback("Mic access denied. Check browser permissions.");
      } else {
        setMicFeedback(`Error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      setTimeout(() => setMicFeedback(''), 3000); // Clear all feedback after 3s
      recognitionRef.current = null;
    };

    recognition.start();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Device Selector — horizontal scrollable grid */}
      <div style={{
        background: 'var(--bg-card)', padding: '20px 24px', borderRadius: '16px',
        border: '1px solid var(--border-subtle)', boxShadow: 'var(--card-shadow)',
      }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 600, marginBottom: '14px' }}>
          Select Appliance
        </div>
        <div style={{
          display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px',
        }}>
          {APPLIANCES.map(app => {
            const isSelected = selectedAppliance?.id === app.id;
            return (
              <button key={app.id}
                onClick={() => onSelectDevice(app.id)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  minWidth: '90px', padding: '14px 10px', borderRadius: '12px',
                  background: isSelected ? 'var(--accent-blue)' : 'var(--button-bg-neutral)',
                  color: isSelected ? '#fff' : 'var(--button-text-neutral)',
                  border: isSelected ? '2px solid var(--accent-blue)' : '2px solid var(--border-subtle)',
                  cursor: 'pointer', transition: 'all 0.15s ease',
                  fontFamily: 'var(--font-body)', fontWeight: isSelected ? 700 : 500,
                  fontSize: '12px', gap: '6px', flexShrink: 0,
                  boxShadow: isSelected ? '0 4px 12px rgba(56,189,248,0.25)' : 'none',
                }}
              >
                <span style={{ fontSize: '22px' }}>{app.icon}</span>
                <span>{app.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Twin Card */}
      <div style={{
        background: 'var(--bg-card)', padding: '40px', borderRadius: '20px',
        border: `1px solid ${isAnomaly ? 'rgba(220,38,38,0.3)' : 'var(--border-subtle)'}`, 
        boxShadow: 'var(--card-shadow)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative',
        transition: 'border-color 0.5s ease',
        minHeight: '360px', overflow: 'visible',
      }}>

        {/* Voice Control Mic */}
        <div style={{ position: 'absolute', top: '24px', right: '24px', display: 'flex', alignItems: 'center', gap: '10px', zIndex: 10 }}>
          {micFeedback && (
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', background: 'rgba(0,0,0,0.05)', padding: '4px 8px', borderRadius: '12px' }}>
              {micFeedback}
            </span>
          )}
          <button
            onClick={handleMicClick}
            style={{
              background: isListening ? 'rgba(239, 68, 68, 0.1)' : 'rgba(56, 189, 248, 0.05)',
              border: `1px solid ${isListening ? 'rgba(239, 68, 68, 0.3)' : 'rgba(56, 189, 248, 0.2)'}`,
              color: isListening ? '#ef4444' : '#38bdf8',
              width: '50px', height: '50px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              opacity: 1,
              transition: 'all 0.2s',
              boxShadow: isListening ? '0 0 12px rgba(239,68,68,0.4)' : 'none'
            }}
            title="Voice Control (Say 'On', 'Off', or a device name)"
          >
            <span style={{ fontSize: '16px' }}>🎤</span>
          </button>
        </div>
        
        {/* Background ambient lighting */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: '300px', height: '300px', borderRadius: '50%',
          background: glowColor, filter: 'blur(120px)', opacity: isRunning ? 0.08 : 0.02,
          transition: 'all 0.5s ease', pointerEvents: 'none', zIndex: 0
        }} />

        <h3 style={{
          color: 'var(--text-secondary)', margin: '0 0 30px 0', fontSize: '14px',
          letterSpacing: '0.3px', width: '100%', textAlign: 'center',
          fontWeight: 600, zIndex: 1
        }}>
          Interactive Physical Twin
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', width: '100%', position: 'relative', zIndex: 1 }}>
          
          {/* Left Side: Smart Plug Socket */}
          <div style={{ position: 'relative' }}>
            <svg viewBox="0 0 160 260" width="160" height="260" style={{ filter: `drop-shadow(0 8px 16px rgba(0,0,0,0.1))` }}>
              <defs>
                <linearGradient id="plugGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#e2e8f0" />
                  <stop offset="100%" stopColor="#cbd5e1" />
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
              <rect x="20" y="20" width="120" height="220" rx="20" fill="url(#plugGrad)" stroke={isRunning ? glowColor : '#94a3b8'} strokeWidth="2" strokeOpacity={isRunning ? 0.7 : 0.5} />
              
              {/* Socket Face */}
              <circle cx="80" cy="80" r="40" fill="#fff" stroke="#94a3b8" strokeWidth="2" />
              <rect x="65" y="65" width="8" height="15" rx="4" fill="#94a3b8" />
              <rect x="87" y="65" width="8" height="15" rx="4" fill="#94a3b8" />
              <circle cx="80" cy="95" r="5" fill="#94a3b8" />

              {/* LED indicator */}
              {isRunning && <circle cx="80" cy="140" r="15" fill="url(#ledGlow)" style={{ animation: 'pulse-glow 1.5s infinite' }} />}
              <circle cx="80" cy="140" r="4" fill={isRunning ? glowColor : '#94a3b8'} />

              {/* Large Power Button */}
              <g style={{ cursor: selectedAppliance ? 'pointer' : 'not-allowed', transition: 'all 0.2s ease' }} 
                 onClick={selectedAppliance ? onTogglePower : undefined}
                 transform={`translate(0, ${isRunning ? 2 : 0})`}
                 className="svg-button">
                <circle cx="80" cy="190" r="28" fill="#fff" stroke={isRunning ? glowColor : "#94a3b8"} strokeWidth="2" filter={isRunning ? 'url(#btnGlow)' : 'none'} />
                
                {/* Power icon path */}
                <path d="M80 176 v12" fill="none" stroke={isRunning ? glowColor : "#6b7280"} strokeWidth="3" strokeLinecap="round" />
                <path d="M70 182 a 12 12 0 1 0 20 0" fill="none" stroke={isRunning ? glowColor : "#6b7280"} strokeWidth="3" strokeLinecap="round" />
                
                <text x="80" y="235" fill="var(--text-muted)" fontSize="10" letterSpacing="0.5px" fontWeight="600" textAnchor="middle" pointerEvents="none">
                  Power
                </text>
              </g>
            </svg>
          </div>

          {/* Center: Animated Wire SVG */}
          <div style={{ flex: 1, minWidth: '150px', height: '100px', display: 'flex', alignItems: 'center' }}>
            <svg width="100%" height="40" style={{ overflow: 'visible' }}>
              <line x1="0" y1="20" x2="100%" y2="20" stroke="#cbd5e1" strokeWidth="6" strokeLinecap="round" />
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

          {/* Right Side: Appliance Display */}
          <div style={{
            width: '160px', height: '160px', borderRadius: '20px',
            background: 'var(--bg-card-solid)',
            border: `2px solid ${isRunning ? glowColor : '#cbd5e1'}`,
            boxShadow: isRunning ? `0 0 20px ${glowColor}18` : 'var(--card-shadow)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.3s ease',
          }}>
            {!selectedAppliance ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center', padding: '20px' }}>
                <div style={{ fontSize: '24px', marginBottom: '10px' }}>🔌</div>
                Select a device above
              </div>
            ) : (
              <>
                <div style={{ 
                  fontSize: '54px', 
                  filter: isRunning ? `drop-shadow(0 0 10px ${glowColor}40)` : 'none',
                  animation: isRunning && selectedAppliance.id === 'Fan' ? 'rotate 2s linear infinite' : 'none'
                }}>
                  {selectedAppliance.icon}
                </div>
                <div style={{ 
                  marginTop: '12px', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', 
                  textAlign: 'center', padding: '0 10px',
                }}>
                  {selectedAppliance.name}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Embedded Fault Controls */}
        <div style={{ 
          marginTop: '40px', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '40px',
          paddingTop: '24px', borderTop: '1px solid var(--border-subtle)', position: 'relative',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
             <div style={{ color: 'var(--text-secondary)', fontSize: '12px', letterSpacing: '0.3px', marginBottom: '8px', fontWeight: 600 }}>
               Sensor Telemetry
             </div>
             <div style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: isRunning ? glowColor : 'var(--text-muted)' }}>
               {isRunning ? `${power.toFixed(1)}W` : '0.0W'}
             </div>
          </div>

          <div style={{ width: '1px', height: '40px', background: 'var(--border-subtle)' }} />

          {/* Fault Click Menu */}
          <div style={{ position: 'relative' }}>
             <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
               <div style={{ color: 'var(--text-secondary)', fontSize: '12px', letterSpacing: '0.3px', marginBottom: '8px', fontWeight: 600 }}>
                 Fault Injector
               </div>
               
               <button onClick={() => { if(isRunning && selectedAppliance) setIsFaultMenuOpen(!isFaultMenuOpen) }}
                       disabled={!isRunning || !selectedAppliance} style={{
                 padding: '10px 24px', borderRadius: '24px', background: faultMode ? 'rgba(234,88,12,0.08)' : 'rgba(0,0,0,0.03)',
                 border: `1px solid ${faultMode ? 'var(--accent-orange)' : 'var(--border-subtle)'}`,
                 color: faultMode ? 'var(--accent-orange)' : 'var(--text-secondary)', cursor: (isRunning && selectedAppliance) ? 'pointer' : 'not-allowed',
                 fontSize: '14px', fontWeight: 600, letterSpacing: '0.3px', display: 'flex', alignItems: 'center', gap: '8px',
                 opacity: (isRunning && selectedAppliance) ? 1 : 0.4, fontFamily: 'var(--font-body)',
               }}>
                 {faultMode ? '⚠ Anomaly Active ▾' : '⟲ Normal ▾'}
               </button>
               
               {isFaultMenuOpen && isRunning && selectedAppliance && (
                  <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={() => setIsFaultMenuOpen(false)}></div>

                    <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', paddingTop: '10px', zIndex: 100 }}>
                      <div style={{
                        background: 'var(--bg-card-solid)', border: '1px solid var(--border-subtle)',
                        borderRadius: '12px', padding: '6px', width: '220px',
                        boxShadow: '0 12px 32px rgba(0,0,0,0.12)', animation: 'slide-up 0.2s ease-out'
                      }}>
                        <button onClick={(e) => { e.stopPropagation(); onFaultChange('none'); setIsFaultMenuOpen(false); }}
                          style={{ width: '100%', padding: '12px', background: !faultMode ? 'rgba(0,0,0,0.04)' : 'transparent', color: 'var(--text-primary)', border: 'none', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontSize: '14px', fontFamily: 'var(--font-body)' }}
                          onMouseEnter={(e) => { if (faultMode) e.currentTarget.style.background = 'rgba(0,0,0,0.03)' }}
                          onMouseLeave={(e) => { if (faultMode) e.currentTarget.style.background = 'transparent' }}
                        >
                          ⟲ Normal (Healthy)
                        </button>
                        {availableFault && (
                          <button onClick={(e) => { e.stopPropagation(); onFaultChange(availableFault); setIsFaultMenuOpen(false); }}
                            style={{ width: '100%', padding: '12px', marginTop: '2px', background: faultMode ? 'rgba(234,88,12,0.08)' : 'transparent', color: 'var(--accent-orange)', border: 'none', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontSize: '14px', fontWeight: 600, fontFamily: 'var(--font-body)' }}
                            onMouseEnter={(e) => { if (!faultMode) e.currentTarget.style.background = 'rgba(234,88,12,0.05)' }}
                            onMouseLeave={(e) => { if (!faultMode) e.currentTarget.style.background = 'transparent' }}
                          >
                            ⚠ Inject: {availableFault.replace('_', ' ').charAt(0).toUpperCase() + availableFault.replace('_', ' ').slice(1)}
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
    </div>
  );
}
