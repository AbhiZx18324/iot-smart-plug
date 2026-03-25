import React from 'react';
import { APPLIANCES } from '../constants';

const CATEGORIES = {
  SMALL_MOTOR_ELECTRONICS: { label: 'Small Motor / Electronics', color: '#00d8ff' },
  LIGHTING_LOADS: { label: 'Lighting', color: '#ffb74d' },
  THERMAL_APPLIANCES: { label: 'Thermal', color: '#f06292' },
  HVAC_REFRIGERATION: { label: 'HVAC / Refrigeration', color: '#00e676' },
  LAUNDRY_APPLIANCES: { label: 'Laundry', color: '#b088f9' },
};

export default function DeviceSelector({ selectedId, onSelect }) {
  // Group appliances by category
  const grouped = {};
  for (const app of APPLIANCES) {
    if (!grouped[app.category]) grouped[app.category] = [];
    grouped[app.category].push(app);
  }

  return (
    <div style={{ marginBottom: '28px' }}>
      <h3 style={{
        color: 'var(--accent-cyan)', fontSize: '13px', textTransform: 'uppercase',
        letterSpacing: '2px', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        <span style={{ width: '8px', height: '8px', background: 'var(--accent-cyan)', borderRadius: '50%', boxShadow: '0 0 8px var(--accent-cyan)' }} />
        Select Appliance
      </h3>

      {Object.entries(grouped).map(([category, apps]) => {
        const cat = CATEGORIES[category];
        return (
          <div key={category} style={{ marginBottom: '16px' }}>
            <div style={{
              fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px',
              color: cat.color, marginBottom: '8px', fontWeight: 600, opacity: 0.8,
            }}>
              {cat.label}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {apps.map(app => {
                const isSelected = selectedId === app.id;
                return (
                  <button
                    key={app.id}
                    onClick={() => onSelect(app.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '10px 16px', borderRadius: '10px',
                      border: `1px solid ${isSelected ? cat.color : 'var(--border-subtle)'}`,
                      background: isSelected
                        ? `${cat.color}15`
                        : 'rgba(15, 23, 42, 0.5)',
                      color: isSelected ? cat.color : 'var(--text-secondary)',
                      cursor: 'pointer', fontSize: '13px', fontWeight: 500,
                      fontFamily: 'var(--font-body)',
                      boxShadow: isSelected ? `0 0 20px ${cat.color}20` : 'none',
                      transition: 'all 0.2s ease',
                      outline: 'none',
                    }}
                  >
                    <span style={{ fontSize: '18px' }}>{app.icon}</span>
                    {app.name}
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
