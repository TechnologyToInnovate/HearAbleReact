import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';

export default function DeafAccessibleBadge({ size = 'sm', showText = true, features = {}, isAccessible }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const badgeRef = useRef(null);

  const styles = {
    sm: { fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px' },
    md: { fontSize: '0.75rem', padding: '4px 10px', borderRadius: '12px' },
    lg: { fontSize: '1rem', padding: '4px 12px', borderRadius: '20px' }
  };

  const featureList = [
    { key: 'has_interpreters', label: 'Sign Language Interpreters Available' },
    { key: 'has_trained_staff', label: 'Sign Language Trained Staff / Partner Colleges' },
    { key: 'has_visual_alarms', label: 'Visual Emergency Alarms' },
    { key: 'has_captioning', label: 'Captioned Meetings & Training' }
  ];

  const activeFeatures = featureList.filter(f => features && (features[f.key] === true || features[f.key] === 'true'));
  const isExplicitlyAccessible = isAccessible === true || isAccessible === 'true';

  const shouldShow = isExplicitlyAccessible || activeFeatures.length > 0;

  if (!shouldShow) return null;

  const handleMouseEnter = () => {
    if (activeFeatures.length === 0) return; 
    
    if (badgeRef.current) {
      const rect = badgeRef.current.getBoundingClientRect();
      setTooltipPos({
        top: rect.bottom + window.scrollY + 8, 
        left: rect.left + window.scrollX + (rect.width / 2) 
      });
    }
    setShowTooltip(true);
  };

  return (
    <>
      <div 
        ref={badgeRef}
        style={{ display: 'inline-flex', cursor: activeFeatures.length > 0 ? 'help' : 'default' }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => {
          if (activeFeatures.length > 0) {
            if (!showTooltip) handleMouseEnter(); else setShowTooltip(false);
          }
        }}
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
      </div>

      {showTooltip && activeFeatures.length > 0 && createPortal(
        <div style={{
          position: 'absolute',
          top: tooltipPos.top,
          left: tooltipPos.left,
          transform: 'translateX(-50%)',
          backgroundColor: '#1f2937',
          color: '#f9fafb',
          padding: '12px',
          borderRadius: '8px',
          zIndex: 999999,
          width: 'max-content',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
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
          <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', borderWidth: '6px', borderStyle: 'solid', borderColor: 'transparent transparent #1f2937 transparent' }}></div>
        </div>,
        document.body
      )}
    </>
  );
}