import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import JobCard from '../components/jobs/JobCard';

import StatusBadge from '../components/common/StatusBadge';
import { formatStandardDate } from '../utils/dateUtils';

export default function UserJobs() {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  
  // State for tracking different categories of user-job interactions
  const [applications, setApplications] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // UI state for managing which category is currently being viewed
  const [activeTab, setActiveTab] = useState('Applied');

  // Protect the route so only standard talent profiles can access their job dashboard
  useEffect(() => {
    if (!['user', 'pending_user', 'rejected_user'].includes(role)) {
      navigate('/');
      return;
    }
    if (user) fetchUserJobs();
  }, [user, role]);

  // Fetches both applied and saved jobs, pulling in nested relational data
  async function fetchUserJobs() {
    setIsLoading(true);

    // Fetch the user's job applications and join all necessary job, company, location, and skill data
    const { data: appsData } = await supabase
      .from('applications')
      .select('*, jobs(*, locations(city), companies(name, logo_url, is_deaf_accessible), job_skills(skills(id, name)))')
      .eq('applicant_id', user.id)
      .order('created_at', { ascending: false });

    if (appsData) {
      // Flatten the nested database structure into the simpler format expected by the JobCard component
      const mappedApps = appsData.map(app => ({
        ...app,
        job: {
          ...app.jobs,
          location: app.jobs.locations?.city || '',
          skills: app.jobs.job_skills ? app.jobs.job_skills.map(js => ({ id: js.skills.id, name: js.skills.name })) : [],
          company: app.jobs.companies?.name || 'Unknown Company',
          is_deaf_accessible: app.jobs.companies?.is_deaf_accessible || false,
          date: formatStandardDate(app.jobs.created_at)
        }
      }));
      setApplications(mappedApps);
    }

    // Fetch the user's bookmarked/saved jobs using the same relational join structure
    const { data: savedData } = await supabase
      .from('saved_jobs')
      .select('*, jobs(*, locations(city), companies(name, logo_url, is_deaf_accessible), job_skills(skills(id, name)))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (savedData) {
      const mappedSaved = savedData.map(saved => ({
        ...saved,
        job: {
          ...saved.jobs,
          location: saved.jobs.locations?.city || '',
          skills: saved.jobs.job_skills ? saved.jobs.job_skills.map(js => ({ id: js.skills.id, name: js.skills.name })) : [],
          company: saved.jobs.companies?.name || 'Unknown Company',
          is_deaf_accessible: saved.jobs.companies?.is_deaf_accessible || false,
          date: formatStandardDate(saved.jobs.created_at)
        }
      }));
      setSavedJobs(mappedSaved);
    }

    setIsLoading(false);
  }

  // Filter the displayed list based on the currently selected tab
  let displayList = [];
  if (activeTab === 'Saved') {
    displayList = savedJobs;
  } else if (activeTab === 'Applied') {
    displayList = applications;
  } else if (activeTab === 'Interviews') { 
    // Show applications that have progressed past the initial 'Pending' state
    displayList = applications.filter(app => app.status === 'Interviewing' || app.status === 'Approved');
  } else if (activeTab === 'Archived') {
    // Show applications that were unsuccessful or manually archived
    displayList = applications.filter(app => app.status === 'Rejected' || app.status === 'Archived');
  }

  const tabs = ['Saved', 'Applied', 'Interviews', 'Archived'];

  return (
    <div className="page-container-wide">
      
      <div className="flex-between align-center mb-24">
        <button className="btn-outline btn-sm" onClick={() => navigate('/jobs')}>
          Find More Jobs
        </button>
      </div>

      {/* --- TAB NAVIGATION --- */}
      <div className="flex-row gap-8 mb-32" style={{ overflowX: 'auto', borderBottom: '1px solid var(--border-color)' }}>
        {tabs.map(tab => {
          // Calculate the notification count pill for each respective tab
          let count = 0;
          if (tab === 'Saved') count = savedJobs.length;
          if (tab === 'Applied') count = applications.length;
          if (tab === 'Interviews') count = applications.filter(a => a.status === 'Interviewing' || a.status === 'Approved').length;
          if (tab === 'Archived') count = applications.filter(a => a.status === 'Rejected' || a.status === 'Archived').length;

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '12px 20px',
                border: 'none',
                background: 'none',
                borderBottom: activeTab === tab ? '2px solid var(--primary-color)' : '2px solid transparent',
                color: activeTab === tab ? 'var(--primary-color)' : 'var(--secondary-text)',
                fontWeight: activeTab === tab ? '600' : '400',
                cursor: 'pointer',
                fontSize: '1rem',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {tab} 
              <span style={{ 
                background: activeTab === tab ? 'var(--primary-color)' : 'var(--border-color)', 
                color: activeTab === tab ? 'white' : 'var(--text-color)', 
                padding: '2px 8px', 
                borderRadius: '12px', 
                fontSize: '0.75rem', 
                fontWeight: 'bold' 
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* --- JOB LISTING DISPLAY --- */}
      {isLoading ? (
        <p className="text-center text-secondary mt-32">Loading your applications...</p>
      ) : displayList.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          {displayList.map(item => (
            <div key={item.id} style={{ position: 'relative' }}>
              
              {/* Show application status badges for everything except the generic saved jobs list */}
              {activeTab !== 'Saved' && (
                <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 2, pointerEvents: 'none' }}>
                  <StatusBadge status={item.status || 'Pending'} />
                </div>
              )}

              <JobCard 
                job={item.job} 
                isSelected={false} 
                onClick={() => navigate('/jobs', { state: { selectedJobId: item.job.id } })} 
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center text-secondary p-32 mt-32">
          <div className="text-3xl mb-16">{activeTab === 'Saved' ? '⭐' : '📭'}</div>
          <h3 className="mb-8">No {activeTab.toLowerCase()} jobs</h3>
          <p>You don't have any jobs in this category yet.</p>
        </div>
      )}

    </div>
  );
}