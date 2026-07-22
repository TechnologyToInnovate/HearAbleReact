import React, { useState } from 'react';

export default function DeafAccessibleBadge({ size = 'sm', showText = true, features = {} }) {
  const [showTooltip, setShowTooltip] = useState(false);

  const styles = {
    sm: { fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px' },
    md: { fontSize: '0.75rem', padding: '4px 10px', borderRadius: '12px' },
    lg: { fontSize: '1rem', padding: '4px 12px', borderRadius: '20px' }
  };

  // Define the list of possible features
  const featureList = [
    { key: 'has_interpreters', label: 'Sign Language Interpreters Available' },
    { key: 'has_trained_staff', label: 'Sign Language Trained Staff / Partner Colleges' },
    { key: 'has_visual_alarms', label: 'Visual Emergency Alarms' },
    { key: 'has_captioning', label: 'Captioned Meetings & Training' }
  ];

  // Filter down to only the features this specific company has enabled
  const activeFeatures = featureList.filter(f => features[f.key]);

  // If they have no features enabled, don't show the badge at all
  if (activeFeatures.length === 0) return null;

  return (
    <div 
      style={{ position: 'relative', display: 'inline-flex', cursor: 'help' }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={() => setShowTooltip(!showTooltip)} // For mobile support
    >
      <span style={{ 
        background: '#e0e7ff', 
        color: '#3730a3', 
        border: size === 'lg' ? '1px solid #c7d2fe' : 'none',
        fontWeight: 'bold',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        whiteSpace: 'nowrap',
        flexShrink: 0,
        ...styles[size] 
      }}>
        ✓ {showText ? (size === 'lg' ? 'Certified Deaf Accessible' : 'Deaf Accessible') : ''}
      </span>

      {/* Tooltip Hover Display */}
      {showTooltip && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginTop: '8px',
          backgroundColor: '#1f2937',
          color: '#f9fafb',
          padding: '12px',
          borderRadius: '8px',
          zIndex: 9999,
          width: 'max-content',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <strong style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem', color: '#a5b4fc' }}>
            Accessibility Features:
          </strong>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', fontSize: '0.8rem', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {activeFeatures.map(f => (
              <li key={f.key} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: '#10b981' }}>✓</span> {f.label}
              </li>
            ))}
          </ul>
          {/* Tooltip arrow */}
          <div style={{ 
            position: 'absolute', 
            bottom: '100%', 
            left: '50%', 
            transform: 'translateX(-50%)',
            borderWidth: '6px', 
            borderStyle: 'solid', 
            borderColor: 'transparent transparent #1f2937 transparent' 
          }}></div>
        </div>
      )}
    </div>
  );
}