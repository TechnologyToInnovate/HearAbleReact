import React from 'react';

export default function JobCard({ job, isSelected, onClick }) {
  return (
    <div 
      className={`card p-20 ${isSelected ? 'selected-card' : ''}`} 
      style={{ 
        cursor: 'pointer', 
        border: isSelected ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
        transition: 'all 0.2s ease'
      }}
      onClick={onClick}
    >
      <div className="flex-between-start mb-12">
        <h3 className="m-0" style={{ fontSize: '1.1rem', paddingRight: '8px' }}>{job.title}</h3>
        
        {/* 🚨 THE NEW MATCH BADGE */}
        {job.matchScore > 0 && (
          <span style={{ 
            background: '#fffbeb', 
            color: '#b45309', 
            border: '1px solid #fde68a',
            padding: '4px 8px', 
            borderRadius: '12px', 
            fontSize: '0.75rem', 
            fontWeight: 'bold', 
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}>
            🔥 {job.matchScore}% Match
          </span>
        )}
      </div>
      
      <div className="text-secondary mb-12" style={{ fontSize: '0.95rem', fontWeight: '500' }}>
        🏢 {job.company}
      </div>
      
      <div className="flex-row-wrap gap-8">
        <span className="badge badge-info">{job.work_model || 'On-site'}</span>
        <span className="badge badge-neutral">{job.type}</span>
      </div>
    </div>
  );
}