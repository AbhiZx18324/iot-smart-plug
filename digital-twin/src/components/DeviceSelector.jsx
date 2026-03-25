import React, { useState } from 'react';
import { APPLIANCES } from '../constants';

const CATEGORIES = {
  SMALL_MOTOR_ELECTRONICS: { label: 'Small Motor & Electronics', color: 'var(--accent-cyan)' },
  LIGHTING_LOADS: { label: 'Lighting', color: 'var(--accent-amber)' },
  THERMAL_APPLIANCES: { label: 'Thermal', color: 'var(--accent-pink)' },
  HVAC_REFRIGERATION: { label: 'HVAC / Refrigeration', color: 'var(--accent-green)' },
  LAUNDRY_APPLIANCES: { label: 'Laundry', color: 'var(--accent-purple)' },
};

export default function DeviceSelector({ selectedId, onSelect }) {
  const [hoveredId, setHoveredId] = useState(null);

  const grouped = {};
  for (const app of APPLIANCES) {
    if (!grouped[app.category]) grouped[app.category] = [];
    grouped[app.category].push(app);
  }

  return (
    <div style={{ marginBottom: '32px' }}>
      <h3 style={{
        color: 'var(--text-primary)', fontSize: '16px', fontWeight: 600,
        letterSpacing: '1px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px',
        textShadow: '0 0 15px rgba(255,255,255,0.2)',
      }}>
        <span style={{ 
          width: '10px', height: '10px', background: 'var(--accent-cyan)', 
          borderRadius: '50%', boxShadow: '0 0 12px var(--accent-cyan)' 
        }} />
        Appliance Topology
      </h3>

      {Object.entries(grouped).map(([category, apps]) => {
        const cat = CATEGORIES[category];
        return (
          <div key={category} style={{ marginBottom: '24px' }}>
            <div style={{
              fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px',
              color: cat.color, marginBottom: '14px', fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              <span style={{ width: '20px', height: '1px', background: cat.color, opacity: 0.5 }} />
              {cat.label}
              <span style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, ' + cat.color + '80, transparent)', opacity: 0.2 }} />
            </div>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', 
              gap: '12px' 
            }}>
              {apps.map(app => {
                const isSelected = selectedId === app.id;
                const isHovered = hoveredId === app.id;
                
                return (
                  <button
                    key={app.id}
                    onClick={() => onSelect(app.id)}
                    onMouseEnter={() => setHoveredId(app.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    style={{
                      position: 'relative',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px',
                      padding: '20px 12px', borderRadius: '16px',
                      background: isSelected 
                        ? `linear-gradient(145deg, ${cat.color}20, rgba(15,23,42,0.8))`
                        : isHovered 
                          ? 'rgba(30, 41, 59, 0.8)' 
                          : 'rgba(15, 23, 42, 0.4)',
                      border: `1px solid ${isSelected ? cat.color : isHovered ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)'}`,
                      color: isSelected ? '#fff' : 'var(--text-secondary)',
                      cursor: 'pointer', outline: 'none',
                      transform: isHovered && !isSelected ? 'translateY(-2px)' : isSelected ? 'scale(1.02)' : 'none',
                      boxShadow: isSelected 
                        ? `0 10px 25px ${cat.color}30, inset 0 1px 0 rgba(255,255,255,0.2)` 
                        : isHovered ? '0 8px 20px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.2)',
                      transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Active internal glow */}
                    {isSelected && (
                      <span style={{
                        position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                        background: `linear-gradient(90deg, transparent, ${cat.color}, transparent)`,
                        boxShadow: `0 0 10px ${cat.color}`
                      }} />
                    )}
                    
                    <div style={{
                      fontSize: '32px', 
                      filter: isSelected ? `drop-shadow(0 0 12px ${cat.color}80)` : 'none',
                      transition: 'all 0.3s ease',
                      transform: isSelected || isHovered ? 'scale(1.1)' : 'scale(1)'
                    }}>
                      {app.icon}
                    </div>
                    <div style={{
                      fontSize: '12px', fontWeight: isSelected ? 600 : 500,
                      fontFamily: 'var(--font-body)', textAlign: 'center', lineHeight: 1.3,
                      textShadow: isSelected ? `0 0 8px ${cat.color}50` : 'none',
                    }}>
                      {app.name}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
