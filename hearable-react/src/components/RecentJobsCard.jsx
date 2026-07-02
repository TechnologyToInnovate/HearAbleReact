import React from 'react';
import { useNavigate } from 'react-router-dom';
import TagList from './TagList';

export default function RecentJobsCard({ recentJobs, isLoading }) {
  const navigate = useNavigate();

  return (
    <>
      <div className="flex-between align-center mb-16" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
        <h3 className="m-0">Recently Posted Jobs</h3>
        <button className="btn-outline btn-sm" onClick={() => navigate('/jobs')}>View All Jobs</button>
      </div>

      {isLoading ? (
        <p className="text-secondary text-center p-20">Loading recent jobs...</p>
      ) : recentJobs.length > 0 ? (
        <div className="flex-col gap-0">
          {recentJobs.map((job, index) => (
            <div key={job.id} className="flex-between align-center" style={{ padding: '20px 0', borderBottom: index !== recentJobs.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
              <div>
                <h4 className="text-lg m-0 mb-8">{job.title}</h4>
                <p className="text-sm text-secondary m-0 mt-8 mb-12">{job.location}</p>
                <TagList tags={[job.work_model || 'On-site', job.type]} />
              </div>
              <button className="btn-outline" onClick={() => navigate('/jobs', { state: { selectedJobId: job.id } })}>View Job</button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-secondary text-center p-20">No recent jobs found.</p>
      )}
    </>
  );
}