import React from 'react';
import { useNavigate } from 'react-router-dom';

// 🚨 UPDATED IMPORT PATHS
import StatusBadge from '../common/StatusBadge';
import { formatFullName } from '../../utils/formatUtils';

export default function RecentApplicantsCard({ recentApplicants, isLoading }) {
  const navigate = useNavigate();

  return (
    <>
      <div className="flex-between align-center mb-16" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
        <h3 className="m-0">Recent Applicants</h3>
        <button className="btn-outline btn-sm" onClick={() => navigate('/applicants')}>View All Applicants</button>
      </div>

      {isLoading ? (
        <p className="text-secondary text-center p-20">Loading candidates...</p>
      ) : recentApplicants.length > 0 ? (
        <div className="flex-col gap-0">
          {recentApplicants.map((app, index) => (
            <div key={app.id} className="flex-between align-center" style={{ padding: '20px 0', borderBottom: index !== recentApplicants.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
              <div>
                <h4 className="text-lg m-0 mb-4">
                  {formatFullName(app.profiles?.first_name, app.profiles?.last_name, 'Incomplete Profile')}
                </h4>
                <p className="text-sm text-secondary m-0 mb-8">{app.profiles?.email}</p>
                <span className="text-sm font-bold text-primary">Applied for: {app.jobs?.title}</span>
              </div>
              
              <StatusBadge status={app.status || 'Pending'} />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-secondary text-center p-20">No applications received yet.</p>
      )}
    </>
  );
}