import React from 'react';
import { useNavigate } from 'react-router-dom';
import DeafAccessibleBadge from '../common/DeafAccessibleBadge';

export default function RecentJobsCard({ recentJobs, isLoading }) {
  const navigate = useNavigate();

  return (
    <>
      <div className="flex-between align-center mb-16" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
        <h3 className="m-0">Recently Posted Jobs</h3>
        <button className="btn-outline btn-sm" onClick={() => navigate('/jobs')}>View All Jobs</button>
      </div>

      {isLoading ? (
        <p className="text-secondary text-center p-20">Loading opportunities...</p>
      ) : recentJobs.length > 0 ? (
        <div className="flex-col gap-0">
          {recentJobs.map((job, index) => (
            <div 
              key={job.id} 
              className="flex-between align-center" 
              style={{ padding: '20px 0', borderBottom: index !== recentJobs.length - 1 ? '1px solid var(--border-color)' : 'none', cursor: 'pointer' }}
              onClick={() => navigate('/jobs', { state: { selectedJobId: job.id } })}
            >
              <div>
                <h4 className="text-lg m-0 mb-4 text-primary">
                  {job.title}
                </h4>
                
                {/* 🚨 Moved the Deaf Accredited badge to this line */}
                <div className="text-sm text-secondary m-0 mb-12 flex-row align-center gap-8 flex-wrap">
                  <span>{job.company || 'Unknown Company'} {job.location && `• ${job.location}`}</span>
                  {job.is_deaf_accessible && <DeafAccessibleBadge size="sm" showText={true} />}
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
              
              <button className="btn-outline btn-sm">View Role</button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-secondary text-center p-20">No active job postings right now.</p>
      )}
    </>
  );
}