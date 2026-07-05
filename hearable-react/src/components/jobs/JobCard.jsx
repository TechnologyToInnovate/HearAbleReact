import React from 'react';
import DeafAccessibleBadge from '../common/DeafAccessibleBadge';

export default function JobCard({ job, isSelected, onClick, hideMatchScore = false }) {
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
      <div className="flex-between-start mb-12 mobile-stack">
        <h3 className="m-0" style={{ fontSize: '1.1rem', paddingRight: '8px' }}>{job.title}</h3>
        
        {!hideMatchScore && job.matchScore > 0 && (
          <span style={{ 
            background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a',
            padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', 
            fontWeight: 'bold', whiteSpace: 'nowrap', flexShrink: 0
          }}>
            {job.matchScore}% Match
          </span>
        )}
      </div>
      
      {/* 🚨 UPDATED: Applied flex styling to force truncation on the company name */}
      <div className="text-secondary mb-12 flex-row gap-8 align-center" style={{ fontSize: '0.95rem', fontWeight: '500', width: '100%', minWidth: 0 }}>
        <span 
          style={{ 
            whiteSpace: 'nowrap', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis',
            maxWidth: '60%' // Adjust this percentage if you want it to hide earlier/later
          }}
          title={job.company}
        >
          {job.company}
        </span>
        
        {job.location && (
          <span style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
            • {job.location}
          </span>
        )}
        
        {job.is_deaf_accessible && (
          <div style={{ flexShrink: 0 }}>
            <DeafAccessibleBadge size="sm" showText={true} />
          </div>
        )}
      </div>
      
      <div className="flex-row-wrap gap-8 align-center">
        {job.pay && (
          <span className="badge" style={{ 
            background: 'var(--bg-color)', 
            border: '1px solid var(--border-color)', 
            color: 'var(--text-color)', 
            fontWeight: '600',
            borderRadius: '4px' 
          }}>
            {job.pay} <span style={{ fontWeight: 'normal', color: 'var(--secondary-text)' }}>{job.pay_rate}</span>
          </span>
        )}
        
        <span className="badge badge-neutral" style={{ borderRadius: '4px' }}>
          {job.work_model || 'On-site'}
        </span>
        
        <span className="badge badge-neutral" style={{ borderRadius: '4px' }}>
          {job.type}
        </span>
      </div>
    </div>
  );
}