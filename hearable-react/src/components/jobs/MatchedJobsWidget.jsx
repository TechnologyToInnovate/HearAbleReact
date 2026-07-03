import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DeafAccessibleBadge from '../common/DeafAccessibleBadge';

export default function MatchedJobsWidget({ jobs, onSelectJob }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const matchedJobs = jobs
    .filter(job => job.matchScore && job.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5); 

  if (matchedJobs.length === 0) {
    return (
      <div className="card text-center p-32 mb-24" style={{ border: '2px dashed var(--border-color)', backgroundColor: 'transparent', boxShadow: 'none' }}>
        <h3 className="m-0 mb-8 text-xl">Unlock Your Top Matches</h3>
        <p className="text-secondary m-0 mb-24" style={{ maxWidth: '500px', margin: '0 auto 24px auto', lineHeight: '1.6' }}>
          We need to know a little more about you! Add more skills to your profile to get personalized job recommendations.
        </p>
        <button className="btn-black" style={{ padding: '12px 24px', fontSize: '1rem' }} onClick={() => navigate(`/user/${user?.id}`, { state: { openAddSkill: true } })}>
          Update My Skills
        </button>
      </div>
    );
  }

  return (
    <div className="card mb-24 p-24">
      <div className="flex-between align-center mb-16" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
        <h3 className="m-0">Top Matches For You</h3>
      </div>
      
      <div className="flex-col gap-0">
        {matchedJobs.map((job, index) => (
          <div 
            key={job.id} 
            className="flex-between align-center" 
            style={{ padding: '20px 0', borderBottom: index !== matchedJobs.length - 1 ? '1px solid var(--border-color)' : 'none', cursor: 'pointer' }}
            onClick={() => onSelectJob(job.id)}
          >
            <div>
              <h4 className="text-lg m-0 mb-4 text-primary flex-row align-center gap-8 flex-wrap">
                {job.title}
                <span style={{ background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                  {job.matchScore}% Match
                </span>
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
    </div>
  );
}