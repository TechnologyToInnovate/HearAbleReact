import React from 'react';
import DeafAccessibleBadge from '../common/DeafAccessibleBadge';

export default function RecentJobsCard({ recentJobs, isLoading, navigate }) {
  if (isLoading) {
    return <div className="p-24 text-center text-secondary">Loading recent jobs...</div>;
  }

  if (!recentJobs || recentJobs.length === 0) {
    return <div className="p-24 text-center text-secondary">No recent jobs found.</div>;
  }

  return (
    <div className="p-24">
      <div className="flex-between align-center mb-16" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
        <h3 className="m-0">Recently Posted Jobs</h3>
        {/* 🚨 ADDED: View All Link to match */}
        <button 
          onClick={() => navigate('/jobs')} 
          style={{ background: 'transparent', border: 'none', color: 'var(--primary-color)', fontSize: '0.9rem', fontWeight: 'bold', cursor: 'pointer', padding: 0 }}
        >
          View All &rarr;
        </button>
      </div>
      
      <div className="flex-col gap-0">
        {recentJobs.map((job, index) => {
          const accessData = job.companies || {};
          const hasDeafBadge = accessData.has_interpreters || accessData.has_trained_staff || accessData.has_visual_alarms || accessData.has_captioning;
          
          return (
            <div 
              key={job.id} 
              className="flex-between align-center mobile-stack" 
              // 🚨 COMPACT SPACING: Reduced padding from 20px to 16px
              style={{ padding: '16px 0', borderBottom: index !== recentJobs.length - 1 ? '1px solid var(--border-color)' : 'none', cursor: 'pointer' }}
              onClick={() => navigate('/jobs', { state: { selectedJobId: job.id } })}
            >
              <div style={{ width: '100%', minWidth: 0, paddingRight: '16px' }}>
                <h4 className="text-lg m-0 mb-4 text-primary">
                  {job.title}
                </h4>
                
                <div className="text-sm text-secondary m-0 mb-12 flex-row align-center gap-8" style={{ width: '100%', minWidth: 0 }}>
                  <span 
                    style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '50%' }}
                    title={job.company || 'Unknown Company'}
                  >
                    {job.company || 'Unknown Company'}
                  </span>
                  
                  {job.location && (
                    <span style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
                      • {job.location}
                    </span>
                  )}

                  {hasDeafBadge && (
                    <div style={{ flexShrink: 0 }}>
                      <DeafAccessibleBadge size="sm" showText={true} features={accessData} isAccessible={hasDeafBadge} />
                    </div>
                  )}
                </div>
                
                <div className="flex-row gap-8 flex-wrap">
                  {job.type && (
                    <span style={{ padding: '4px 12px', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-color)' }}>
                      {job.type}
                    </span>
                  )}
                  {job.work_model && (
                    <span style={{ padding: '4px 12px', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-color)' }}>
                      {job.work_model}
                    </span>
                  )}
                </div>
              </div>
              
              <button className="btn-outline btn-sm mobile-w-full" style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>View Role</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}