import React from 'react';
import { useNavigate } from 'react-router-dom';

import StatusBadge from '../common/StatusBadge';
import Avatar from '../common/Avatar'; 
import { formatFullName } from '../../utils/formatUtils';

export default function RecentApplicantsCard({ recentApplicants, isLoading }) {
  const navigate = useNavigate();

  return (
    <div className="flex-col gap-16" style={{ padding: '8px' }}>
      <div className="flex-between align-center mb-16">
        <h2 className="m-0" style={{ fontSize: '1.25rem' }}>Recent Applicants</h2>
        <button 
          className="btn-outline btn-sm" 
          onClick={() => navigate('/applicants', { state: { filterJobId: 'all' } })}
        >
          View All
        </button>
      </div>

      {isLoading ? (
        <p className="text-secondary text-center py-20">Loading applicants...</p>
      ) : recentApplicants && recentApplicants.length > 0 ? (
        <div className="flex-col gap-16">
          {recentApplicants.map(app => (
            <div key={app.id} className="card" style={{ padding: 0, border: '1px solid var(--border-color)', overflow: 'hidden' }}>
              
              <div className="flex-between-start" style={{ padding: '24px' }}>
                <div className="flex-row gap-16" style={{ minWidth: 0, flex: 1, paddingRight: '16px' }}>
                  <div style={{ flexShrink: 0 }}>
                    <Avatar 
                      src={app.profiles?.profile_pic} 
                      fallbackName={app.profiles?.first_name || 'User'} 
                      type="user" 
                      size="md" 
                    />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <h3 className="text-lg m-0 mb-4 text-truncate" title={formatFullName(app.profiles?.first_name, app.profiles?.last_name)}>
                      {formatFullName(app.profiles?.first_name, app.profiles?.last_name, 'Incomplete Profile')}
                    </h3>
                    <p className="text-sm text-secondary m-0 text-truncate" title={app.jobs?.title}>
                      Applied for: <strong className="text-primary">{app.jobs?.title}</strong>
                    </p>
                  </div>
                </div>
                <div className="flex-col align-end gap-8" style={{ flexShrink: 0 }}>
                  <StatusBadge status={app.status || 'Pending'} />
                </div>
              </div>
              
              <div className="flex-between align-center flex-wrap gap-24" style={{ padding: '16px 24px', background: 'var(--bg-color)', borderTop: '1px solid var(--border-color)' }}>
                <div className="flex-row gap-8">
                  <button 
                    className="btn-outline btn-sm" 
                    onClick={() => navigate('/jobs', { state: { selectedJobId: app.jobs?.id } })} 
                    style={{ background: 'var(--card-bg)' }}
                  >
                    💼 View Job
                  </button>
                  <button 
                    className="btn-black btn-sm" 
                    onClick={() => navigate('/applicants', { state: { filterJobId: app.jobs?.id, inspectAppId: app.id } })} 
                  >
                    🔍 Inspect Job Seeker
                  </button>
                </div>

                {/* 🚨 NEW: 3-Stage Progress Bar Component */}
                {(() => {
                  const getStage = (status) => {
                    if (['Hired', 'Rejected'].includes(status)) return 3;
                    if (status === 'Interviewing') return 2;
                    return 1; // Pending / Under Review / Null
                  };
                  
                  const stage = getStage(app.status);
                  const isRejected = app.status === 'Rejected';
                  const isHired = app.status === 'Hired';
                  
                  const stage3Color = isRejected ? '#dc2626' : (isHired ? '#10b981' : 'var(--border-color)');
                  const stage3TextColor = isRejected ? '#dc2626' : (isHired ? '#10b981' : 'var(--secondary-text)');

                  return (
                    <div className="flex-row gap-4" style={{ flex: 1, minWidth: '180px', maxWidth: '300px' }}>
                      
                      <div className="flex-col gap-4" style={{ flex: 1, alignItems: 'center' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 'bold', textTransform: 'uppercase', color: stage >= 1 ? 'var(--text-color)' : 'var(--secondary-text)' }}>Viewing</span>
                        <div style={{ height: '4px', width: '100%', borderRadius: '2px', background: stage >= 1 ? 'var(--primary-color)' : 'var(--border-color)' }}></div>
                      </div>
                      
                      <div className="flex-col gap-4" style={{ flex: 1, alignItems: 'center' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 'bold', textTransform: 'uppercase', color: stage >= 2 ? 'var(--text-color)' : 'var(--secondary-text)' }}>Interview</span>
                        <div style={{ height: '4px', width: '100%', borderRadius: '2px', background: stage >= 2 ? 'var(--primary-color)' : 'var(--border-color)' }}></div>
                      </div>
                      
                      <div className="flex-col gap-4" style={{ flex: 1, alignItems: 'center' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 'bold', textTransform: 'uppercase', color: stage >= 3 ? stage3TextColor : 'var(--secondary-text)' }}>Decision</span>
                        <div style={{ height: '4px', width: '100%', borderRadius: '2px', background: stage >= 3 ? stage3Color : 'var(--border-color)' }}></div>
                      </div>

                    </div>
                  );
                })()}

              </div>

            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-secondary py-32" style={{ background: 'var(--bg-color)', borderRadius: '8px', border: '1px dashed var(--border-color)' }}>
          <p className="m-0">No recent applications found.</p>
        </div>
      )}
    </div>
  );
}