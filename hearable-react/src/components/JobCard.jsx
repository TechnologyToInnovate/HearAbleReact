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
        
        {job.matchScore > 0 && (
          <span style={{ 
            background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a',
            padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', 
            fontWeight: 'bold', whiteSpace: 'nowrap', flexShrink: 0
          }}>
            {job.matchScore}% Match
          </span>
        )}
      </div>
      
      {/* 🚨 NEW: Added the accessibility badge next to the company name */}
      <div className="text-secondary mb-12 flex-row gap-8 align-center" style={{ fontSize: '0.95rem', fontWeight: '500' }}>
        <span>{job.company}</span>
        {job.is_deaf_accessible && (
          <span style={{ background: '#e0e7ff', color: '#3730a3', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
            ✓ Deaf Accessible
          </span>
        )}
      </div>
      
      <div className="flex-row-wrap gap-8 align-center">
        {job.pay && (
          <span className="badge" style={{ 
            background: 'var(--bg-color)', 
            border: '1px solid var(--border-color)', 
            color: 'var(--text-color)', 
            fontWeight: '600' 
          }}>
            {job.pay} <span style={{ fontWeight: 'normal', color: 'var(--secondary-text)' }}>{job.pay_rate}</span>
          </span>
        )}
        <span className="badge badge-info">{job.work_model || 'On-site'}</span>
        <span className="badge badge-neutral">{job.type}</span>
      </div>
    </div>
  );
}