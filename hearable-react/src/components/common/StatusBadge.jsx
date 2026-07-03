import React from 'react';

export default function StatusBadge({ status }) {
  const getStatusStyle = (statusName) => {
    switch(statusName) {
      // Success States
      case 'Approved':
      case 'Active':
      case 'Accepted':
      case 'Published':
        return { bg: '#dcfce7', text: '#166534', border: '#bbf7d0' };
      
      // Warning/Pending States
      case 'Pending':
      case 'Interviewing':
        return { bg: '#fef9c3', text: '#854d0e', border: '#fde047' };
      
      // Error/Inactive States
      case 'Rejected':
      case 'Inactive':
        return { bg: '#fef2f2', text: '#991b1b', border: '#fecaca' };
      
      // Neutral/Special States
      case 'Pre-Approved':
        return { bg: '#e0e7ff', text: '#3730a3', border: '#c7d2fe' };
      case 'Archived':
        return { bg: '#f3f4f6', text: '#374151', border: '#d1d5db' };
        
      default:
        return { bg: 'var(--hover-color)', text: 'var(--primary-color)', border: 'var(--primary-color)' };
    }
  };

  const currentStatus = status || 'Pending';
  const colors = getStatusStyle(currentStatus);

  return (
    <span 
      style={{
        padding: '4px 10px', 
        borderRadius: '12px', 
        fontSize: '0.85rem', 
        fontWeight: 'bold', 
        whiteSpace: 'nowrap',
        backgroundColor: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
        display: 'inline-block'
      }}
    >
      {currentStatus}
    </span>
  );
}