import React from 'react';

export default function DeafAccessibleBadge({ size = 'sm', showText = true }) {
  const styles = {
    sm: { fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px' },
    md: { fontSize: '0.75rem', padding: '4px 10px', borderRadius: '12px' },
    lg: { fontSize: '1rem', padding: '4px 12px', borderRadius: '20px' }
  };

  return (
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
  );
}