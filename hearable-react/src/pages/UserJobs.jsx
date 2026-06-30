import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import JobCard from '../components/JobCard';
import StatusBadge from '../components/StatusBadge';

export default function UserJobs() {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  
  const [applications, setApplications] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Applied');

  useEffect(() => {
    if (!['user', 'pending_user', 'rejected_user'].includes(role)) {
      navigate('/');
      return;
    }
    if (user) fetchUserJobs();
  }, [user, role]);

  async function fetchUserJobs() {
    setIsLoading(true);

    const { data: appsData } = await supabase
      .from('applications')
      .select('*, jobs(*, companies(name, logo_url))')
      .eq('applicant_id', user.id)
      .order('created_at', { ascending: false });

    if (appsData) {
      const mappedApps = appsData.map(app => ({
        ...app,
        job: {
          ...app.jobs,
          company: app.jobs.companies?.name || 'Unknown Company',
          date: new Date(app.jobs.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        }
      }));
      setApplications(mappedApps);
    }

    const { data: savedData } = await supabase
      .from('saved_jobs')
      .select('*, jobs(*, companies(name, logo_url))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (savedData) {
      const mappedSaved = savedData.map(saved => ({
        ...saved,
        job: {
          ...saved.jobs,
          company: saved.jobs.companies?.name || 'Unknown Company',
          date: new Date(saved.jobs.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        }
      }));
      setSavedJobs(mappedSaved);
    }

    setIsLoading(false);
  }

  let displayList = [];
  if (activeTab === 'Saved') {
    displayList = savedJobs;
  } else if (activeTab === 'Applied') {
    displayList = applications;
  } else if (activeTab === 'Interviews') { // 🚨 Renamed
    displayList = applications.filter(app => app.status === 'Interviewing' || app.status === 'Approved');
  } else if (activeTab === 'Archived') {
    displayList = applications.filter(app => app.status === 'Rejected' || app.status === 'Archived');
  }

  // 🚨 Renamed in the tabs array
  const tabs = ['Saved', 'Applied', 'Interviews', 'Archived'];

  return (
    <div className="page-container-wide">
      
      <div className="flex-between align-center mb-24">
        <h1 className="m-0">My Job Tracker</h1>
        <button className="btn-outline btn-sm" onClick={() => navigate('/jobs')}>
          Find More Jobs
        </button>
      </div>

      <div className="flex-row gap-8 mb-32" style={{ overflowX: 'auto', borderBottom: '1px solid var(--border-color)' }}>
        {tabs.map(tab => {
          let count = 0;
          if (tab === 'Saved') count = savedJobs.length;
          if (tab === 'Applied') count = applications.length;
          // 🚨 Renamed check here
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

      {isLoading ? (
        <p className="text-center text-secondary mt-32">Loading your applications...</p>
      ) : displayList.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          {displayList.map(item => (
            <div key={item.id} style={{ position: 'relative' }}>
              
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