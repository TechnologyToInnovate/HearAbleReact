import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import StatusBadge from '../components/StatusBadge';

export default function Applicants({ role }) {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [viewMode, setViewMode] = useState(location.state?.filterJobId ? 'all' : 'grouped'); 
  const [filterJobId, setFilterJobId] = useState(location.state?.filterJobId || 'all');
  const [availableJobs, setAvailableJobs] = useState([]);

  useEffect(() => {
    if (role === 'user' || role === 'pending_user' || role === 'rejected_user' || role === 'guest') {
      navigate('/');
      return;
    }
    fetchApplicants();
  }, [role, navigate]);

  async function fetchApplicants() {
    setIsLoading(true);
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const currentUserId = session.user.id;

    const { data: appsData } = await supabase.from('applications').select('*').order('id', { ascending: false });
    const { data: jobsData } = await supabase.from('jobs').select('*');
    const { data: profilesData } = await supabase.from('profiles').select('*');
    const { data: companiesData } = await supabase.from('companies').select('*');

    if (appsData && jobsData && profilesData && companiesData) {
      
      let mappedApps = appsData.map(app => {
        const job = jobsData.find(j => j.id === app.job_id) || {};
        const profile = profilesData.find(p => p.id === app.applicant_id) || {};
        const company = companiesData.find(c => c.id === job.company_id) || {};
        
        return {
          ...app,
          job_title: job.title || 'Unknown Job',
          company_id: job.company_id,
          company_name: company.name || 'Unknown Company',
          company_logo: company.logo_url || '',
          applicant_name: profile.name || 'Unknown Candidate',
          applicant_pic: profile.profile_pic || ''
        };
      });

      let mappedJobs = jobsData.map(job => {
        const company = companiesData.find(c => c.id === job.company_id) || {};
        return {
          ...job,
          company_name: company.name || 'Unknown Company',
          company_logo: company.logo_url || ''
        };
      });

      if (role === 'company') {
        mappedApps = mappedApps.filter(app => app.company_id === currentUserId);
        mappedJobs = mappedJobs.filter(j => j.company_id === currentUserId);
      }
      
      setAvailableJobs(mappedJobs);
      setApplications(mappedApps);
    }
    
    setIsLoading(false);
  }

async function handleStatusChange(appId, newStatus) {
    // Grab the specific application data so we know who to notify
    const appToUpdate = applications.find(app => app.id === appId);

    setApplications(applications.map(app => 
      app.id === appId ? { ...app, status: newStatus } : app
    ));

    const { error } = await supabase
      .from('applications')
      .update({ status: newStatus })
      .eq('id', appId);

    if (!error && appToUpdate) {
      // 🚨 FIX: Now redirects the user to their personal Job Tracker instead of the company page
      await supabase.from('notifications').insert([{
        user_id: appToUpdate.applicant_id,
        title: newStatus === 'Approved' ? 'Application Approved! ✅' : 'Application Update',
        message: `Your application for ${appToUpdate.job_title} at ${appToUpdate.company_name} was ${newStatus.toLowerCase()}.`,
        link: `/user-jobs` 
      }]);
    } else if (error) {
      alert("Failed to update status.");
      console.error(error);
    }
  }

  let displayApps = applications.filter(app => 
    app.applicant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.job_title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (filterJobId !== 'all') {
    displayApps = displayApps.filter(app => app.job_id === filterJobId);
  }

  const jobGroups = availableJobs.map(job => {
    const appsForThisJob = applications.filter(app => app.job_id === job.id);
    return {
      ...job,
      applicantCount: appsForThisJob.length
    };
  }).filter(job => job.title.toLowerCase().includes(searchQuery.toLowerCase())); 

  const selectedJobTitle = availableJobs.find(j => j.id === filterJobId)?.title || 'Job Posting';

  return (
    <div className="page-container-wide">
      
      <div className="flex-between align-center mb-24">
        <h1 style={{ margin: 0 }}>Manage Applicants</h1>
        
        {filterJobId === 'all' && (
          <div className="flex-row" style={{ background: 'var(--bg-color)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <button 
              onClick={() => setViewMode('all')}
              style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', fontWeight: '500', cursor: 'pointer', background: viewMode === 'all' ? 'var(--card-bg)' : 'transparent', color: viewMode === 'all' ? 'var(--text-color)' : 'var(--secondary-text)', boxShadow: viewMode === 'all' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
            >
              All Applicants
            </button>
            <button 
              onClick={() => setViewMode('grouped')}
              style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', fontWeight: '500', cursor: 'pointer', background: viewMode === 'grouped' ? 'var(--card-bg)' : 'transparent', color: viewMode === 'grouped' ? 'var(--text-color)' : 'var(--secondary-text)', boxShadow: viewMode === 'grouped' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
            >
              Group by Post
            </button>
          </div>
        )}
      </div>

      {filterJobId !== 'all' ? (
        <div className="mb-24">
          <button 
            className="btn-outline btn-sm mb-16" 
            onClick={() => { setFilterJobId('all'); setViewMode('grouped'); }}
          >
            ← Back to Job Posts
          </button>
          <h2 style={{ margin: 0 }}>Applicants for: <span className="text-primary">{selectedJobTitle}</span></h2>
        </div>
      ) : (
        <div className="flex-row gap-16 mb-32">
          <div className="search-box-wrapper" style={{ flex: 2 }}>
            <span className="search-icon">🔍</span>
            <input 
              type="text" 
              placeholder={viewMode === 'grouped' ? "Search job postings..." : "Search candidates or job titles..."} 
              className="search-input" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
            />
          </div>

          {viewMode === 'all' && (
            <select 
              className="search-input" 
              style={{ flex: 1 }}
              value={filterJobId}
              onChange={(e) => setFilterJobId(e.target.value)}
            >
              <option value="all">🏢 All Job Postings</option>
              {availableJobs.map(job => (
                <option key={job.id} value={job.id}>{job.title}</option>
              ))}
            </select>
          )}
        </div>
      )}

      {isLoading && <p className="text-center text-secondary">Loading applications...</p>}
      
      {!isLoading && viewMode === 'grouped' && filterJobId === 'all' && (
        jobGroups.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
            {jobGroups.map(group => (
              <div 
                key={group.id} 
                className="card p-24" 
                style={{ cursor: 'pointer', transition: 'transform 0.2s', border: '1px solid var(--border-color)' }}
                onClick={() => {
                  setFilterJobId(group.id);
                  setViewMode('all');
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div className="flex-row gap-16 align-center mb-24">
                  <div style={{ width: '56px', height: '56px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-color)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {group.company_logo ? (
                      <img src={group.company_logo} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '1.5rem' }}>🏢</span>
                    )}
                  </div>
                  <div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem' }}>{group.title}</h3>
                    {role === 'admin' && <p className="text-secondary text-sm m-0">{group.company_name}</p>}
                  </div>
                </div>

                <div className="flex-between align-center" style={{ paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                  <span style={{ fontWeight: '600', color: group.applicantCount > 0 ? 'var(--primary-color)' : 'var(--secondary-text)' }}>
                    👥 {group.applicantCount} {group.applicantCount === 1 ? 'Applicant' : 'Applicants'}
                  </span>
                  <span className="text-primary text-sm" style={{ fontWeight: '500' }}>
                    View List →
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center text-secondary p-20" style={{ padding: '48px 24px' }}>
            <div className="text-3xl mb-16">📭</div>
            <h3 className="mb-8">No job posts found</h3>
            <p>Try clearing your search query or posting a new job.</p>
          </div>
        )
      )}

      {!isLoading && viewMode === 'all' && (
        displayApps.length > 0 ? (
          <div className="flex-col gap-16">
            {displayApps.map(app => (
              <ApplicantCard key={app.id} app={app} role={role} handleStatusChange={handleStatusChange} navigate={navigate} />
            ))}
          </div>
        ) : (
          <div className="card text-center text-secondary p-20" style={{ padding: '48px 24px' }}>
            <div className="text-3xl mb-16">📥</div>
            <h3 className="mb-8">No applications found</h3>
            <p>{filterJobId !== 'all' ? "No one has applied to this specific job yet." : "When talent applies to your job postings, they will appear right here."}</p>
          </div>
        )
      )}

    </div>
  );
}

function ApplicantCard({ app, role, handleStatusChange, navigate }) {
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div className="flex-between-start" style={{ padding: '24px' }}>
        <div className="flex-row gap-16">
          <div className="avatar" style={{ width: '56px', height: '56px', background: 'var(--text-color)', color: 'var(--bg-color)', flexShrink: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {app.applicant_pic ? (
               <img src={app.applicant_pic} alt={app.applicant_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
               app.applicant_name ? app.applicant_name.charAt(0).toUpperCase() : 'U'
            )}
          </div>
          <div>
            <h3 className="text-lg" style={{ margin: '0 0 4px 0' }}>{app.applicant_name}</h3>
            <p className="text-sm text-secondary" style={{ margin: 0 }}>
              Applied for: <strong className="text-primary">{app.job_title}</strong>
            </p>
            {role === 'admin' && (
              <p className="text-sm text-secondary" style={{ margin: '4px 0 0 0' }}>
                🏢 To: {app.company_name}
              </p>
            )}
          </div>
        </div>

        <StatusBadge status={app.status || 'Pending'} />
      </div>

      <div className="flex-between align-center" style={{ padding: '16px 24px', background: 'var(--bg-color)', borderTop: '1px solid var(--border-color)' }}>
        <div className="flex-row gap-8">
          <button 
            className="btn-outline btn-sm" 
            onClick={() => navigate(`/user/${app.applicant_id}`)}
            style={{ background: 'var(--card-bg)' }}
          >
            👤 View Profile
          </button>
          <button 
            className="btn-outline btn-sm" 
            onClick={() => alert('Resume viewing feature coming soon!')}
            style={{ background: 'var(--card-bg)' }}
          >
            📄 View Resume
          </button>
        </div>

        <div className="flex-row gap-8">
          {app.status !== 'Approved' && (
            <button 
              className="btn-sm" 
              onClick={() => handleStatusChange(app.id, 'Approved')}
              style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 16px', fontWeight: '500', cursor: 'pointer' }}
            >
              ✓ Approve
            </button>
          )}
          
          {app.status !== 'Rejected' && (
            <button 
              className="btn-sm" 
              onClick={() => handleStatusChange(app.id, 'Rejected')}
              style={{ background: 'var(--card-bg)', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', padding: '6px 16px', fontWeight: '500', cursor: 'pointer' }}
            >
              ✕ Reject
            </button>
          )}
        </div>
      </div>
    </div>
  );
}