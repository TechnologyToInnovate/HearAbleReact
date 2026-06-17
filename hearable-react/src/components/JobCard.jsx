import React from 'react';

export default function JobCard({ job, isSelected, onClick }) {
  return (
    <div 
      className="card"
      onClick={onClick}
      style={{ 
        cursor: 'pointer', 
        transition: 'all 0.2s',
        border: isSelected ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
        marginBottom: '16px',
        padding: '20px' // Slightly tighter padding for lists
      }}
      onMouseOver={(e) => !isSelected && (e.currentTarget.style.transform = 'translateY(-2px)')}
      onMouseOut={(e) => !isSelected && (e.currentTarget.style.transform = 'translateY(0)')}
    >
      {/* UNIVERSAL HEADER: Avatar + Titles */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
        <div className="avatar" style={{ width: '48px', height: '48px', background: 'var(--primary-color)', color: 'white', flexShrink: 0 }}>
          {job.company.charAt(0).toUpperCase()}
        </div>
        <div>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem' }}>{job.title}</h3>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--secondary-text)' }}>
            🏢 {job.company} &nbsp;•&nbsp; 📍 {job.location}
          </p>
        </div>
      </div>
      
      {/* UNIVERSAL FOOTER: Tags */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <span className="tag" style={{ background: 'var(--hover-color)', color: 'var(--primary-color)', borderColor: 'var(--primary-color)' }}>
          {job.work_model || 'On-site'}
        </span>
        <span className="tag">{job.type}</span>
      </div>
    </div>
  );
}