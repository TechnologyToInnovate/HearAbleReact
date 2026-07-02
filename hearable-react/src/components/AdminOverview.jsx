import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StatCard from './StatCard';

export default function AdminOverview({ adminStats, isLoading }) {
  const navigate = useNavigate();
  const [showPendingDropdown, setShowPendingDropdown] = useState(false);

  return (
    <div className="mb-32">
      <h2 className="m-0 mb-24">Platform Overview</h2>
      
      <div className="card p-0 mb-24" style={{ border: '1px solid var(--border-color)', overflow: 'hidden' }}>
        <div 
          className="flex-between align-center p-20"
          style={{ cursor: 'pointer', transition: 'background 0.2s' }}
          onClick={() => setShowPendingDropdown(!showPendingDropdown)}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-color)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <div>
            <h3 className="m-0 mb-4" style={{ fontSize: '2.5rem', fontWeight: '800' }}>
              {adminStats.pendingUsers + adminStats.pendingJobs}
            </h3>
            <p className="text-secondary m-0 font-bold">Total Pending Approvals</p>
          </div>
          <div style={{ 
            transform: showPendingDropdown ? 'rotate(180deg)' : 'rotate(0)', 
            transition: 'transform 0.3s ease',
            background: 'var(--card-bg)',
            border: '1px solid var(--border-color)',
            padding: '10px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>
        
        {showPendingDropdown && (
          <div className="flex-col" style={{ borderTop: '1px solid var(--border-color)' }}>
            <div 
              className="flex-between align-center p-20" 
              style={{ cursor: 'pointer', borderBottom: '1px solid var(--border-color)' }} 
              onClick={() => navigate('/users')}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-color)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <div className="flex-row align-center gap-12">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-secondary"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                <span className="font-bold">Pending Users</span>
              </div>
              <span className="badge" style={{ background: '#fef9c3', color: '#854d0e', fontSize: '1rem', padding: '6px 16px' }}>{adminStats.pendingUsers}</span>
            </div>
            
            <div 
              className="flex-between align-center p-20" 
              style={{ cursor: 'pointer' }} 
              onClick={() => navigate('/jobs')}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-color)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <div className="flex-row align-center gap-12">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-secondary"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
                <span className="font-bold">Pending Job Postings</span>
              </div>
              <span className="badge" style={{ background: '#fef9c3', color: '#854d0e', fontSize: '1rem', padding: '6px 16px' }}>{adminStats.pendingJobs}</span>
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
        <StatCard value={adminStats.users} label="Total Users" isLoading={isLoading} />
        <StatCard value={adminStats.companies} label="Registered Companies" isLoading={isLoading} />
        <StatCard value={adminStats.activeJobs} label="Active Job Postings" isLoading={isLoading} />
      </div>
    </div>
  );
}