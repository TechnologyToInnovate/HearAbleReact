import React, { useState } from 'react';
import EditJobPreferencesModal from '../modals/EditJobPreferencesModal';

export default function JobPreferencesWidget({ user, isOwnProfile, onUpdate }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!user) return null;

  return (
    <>
      <div className="card p-24 mb-32">
        {/* Header with Top-Right Edit Button */}
        <div className="flex-between align-center mb-16 gap-16 flex-wrap">
          <h3 className="m-0">Job Preferences</h3>
          {isOwnProfile && (
            <button 
              className="btn-outline btn-sm" 
              onClick={() => setIsModalOpen(true)}
              style={{ padding: '6px 12px' }}
            >
              Edit
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-col gap-16">
          <div style={{ paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
            <span className="text-sm text-secondary" style={{ display: 'block', marginBottom: '4px' }}>Desired Role</span>
            <strong style={{ fontSize: '1.05rem', display: 'block' }}>
              {user.preferred_job_title || 'Open to opportunities'}
            </strong>
          </div>
          <div className="flex-row gap-16 flex-wrap">
            <div style={{ flex: 1, minWidth: '120px' }}>
              <span className="text-sm text-secondary" style={{ display: 'block', marginBottom: '8px' }}>Work Model</span>
              <span className="badge badge-neutral" style={{ borderRadius: '4px' }}>
                {user.preferred_work_model || 'Any'}
              </span>
            </div>
            <div style={{ flex: 1, minWidth: '120px' }}>
              <span className="text-sm text-secondary" style={{ display: 'block', marginBottom: '8px' }}>Job Type</span>
              <span className="badge badge-neutral" style={{ borderRadius: '4px' }}>
                {user.preferred_job_type || 'Any'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* The Edit Pop-up Form */}
      <EditJobPreferencesModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        user={user} 
        onSuccess={onUpdate} 
      />
    </>
  );
}