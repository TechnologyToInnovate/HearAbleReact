import React from 'react';

export default function StatusBadge({ status }) {
  // Internal logic to determine the correct colors
  const getStatusColor = (statusName) => {
    switch(statusName) {
      case 'Interviewing': return { bg: '#fef3c7', text: '#d97706', border: '#fde68a' }; // Amber
      case 'Hired': return { bg: '#d1fae5', text: '#059669', border: '#a7f3d0' }; // Green
      case 'Rejected': return { bg: '#fee2e2', text: '#dc2626', border: '#fecaca' }; // Red
      default: return { bg: 'var(--hover-color)', text: 'var(--primary-color)', border: 'var(--primary-color)' }; // Blue
    }
  };

  const currentStatus = status || 'Under Review';
  const colors = getStatusColor(currentStatus);

  return (
    <span 
      className="tag font-medium" 
      style={{ 
        background: colors.bg, 
        color: colors.text, 
        border: `1px solid ${colors.border}`,
        margin: 0 
      }}
    >
      {currentStatus}
    </span>
  );
}