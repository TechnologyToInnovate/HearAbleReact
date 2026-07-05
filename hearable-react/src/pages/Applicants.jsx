import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

import StatusBadge from '../components/common/StatusBadge';
import Avatar from '../components/common/Avatar';
import SearchBar from '../components/common/SearchBar';
import { formatFullName } from '../utils/formatUtils';

export default function Applicants() {
  const navigate = useNavigate();
  const location = useLocation();
  const { role } = useAuth(); 
  
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [viewMode, setViewMode] = useState(location.state?.filterJobId ? 'all' : 'grouped'); 
  const [filterJobId, setFilterJobId] = useState(location.state?.filterJobId || 'all');
  const [availableJobs, setAvailableJobs] = useState([]);

  useEffect(() => {
    if (['user', 'pending_user', 'rejected_user', 'guest'].includes(role)) {
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

    const [appsData, jobsData, profilesData, companiesData, jobSkillsData, profileSkillsData, skillsData] = await Promise.all([
      supabase.from('applications').select('*').order('id', { ascending: false }).then(res => res.data),
      supabase.from('jobs').select('*').then(res => res.data),
      supabase.from('profiles').select('*').then(res => res.data),
      supabase.from('companies').select('*').then(res => res.data),
      supabase.from('job_skills').select('*').then(res => res.data),
      supabase.from('profile_skills').select('*').then(res => res.data),
      supabase.from('skills').select('*').then(res => res.data)
    ]);

    if (appsData && jobsData && profilesData && companiesData) {
      
      let mappedApps = appsData.map(app => {
        const job = jobsData.find(j => j.id === app.job_id) || {};
        const profile = profilesData.find(p => p.id === app.applicant_id) || {};
        const company = companiesData.find(c => c.id === job.company_id) || {};
        
        const applicantFullName = formatFullName(profile.first_name, profile.last_name, 'Unknown Candidate');

        const pSkills = profileSkillsData ? profileSkillsData.filter(ps => ps.profile_id === app.applicant_id).map(ps => ps.skill_id) : [];
        const jSkills = jobSkillsData ? jobSkillsData.filter(js => js.job_id === app.job_id).map(js => js.skill_id) : [];
        
        let matchPercentage = 0;
        if (jSkills.length > 0) {
          const matched = pSkills.filter(skill => jSkills.includes(skill));
          matchPercentage = Math.round((matched.length / jSkills.length) * 100);
        }

        return {
          ...app,
          job_title: job.title || 'Unknown Job',
          company_id: job.company_id,
          company_name: company.name || 'Unknown Company',
          company_logo: company.logo_url || '',
          applicant_name: applicantFullName,
          applicant_pic: profile.profile_pic || '',
          matchPercentage: matchPercentage,
          hasSkillsRequired: jSkills.length > 0
        };
      });

      let mappedJobs = jobsData.map(job => {
        const company = companiesData.find(c => c.id === job.company_id) || {};
        const jobSkillIds = jobSkillsData ? jobSkillsData.filter(js => js.job_id === job.id).map(js => js.skill_id) : [];
        const requiredSkills = skillsData ? skillsData.filter(skill => jobSkillIds.includes(skill.id)).map(skill => skill.name) : [];
        
        return {
          ...job,
          company_name: company.name || 'Unknown Company',
          company_logo: company.logo_url || '',
          required_skills: requiredSkills.length > 0 ? requiredSkills.join(', ') : 'None specified'
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
    const appToUpdate = applications.find(app => app.id === appId);

    setApplications(applications.map(app => 
      app.id === appId ? { ...app, status: newStatus } : app
    ));

    const { error } = await supabase.from('applications').update({ status: newStatus }).eq('id', appId);

    if (!error && appToUpdate) {
      await supabase.from('notifications').insert([{
        user_id: appToUpdate.applicant_id,
        title: newStatus === 'Approved' ? 'Application Approved! ✅' : 'Application Update',
        message: `Your application for ${appToUpdate.job_title} at ${appToUpdate.company_name} was ${newStatus.toLowerCase()}.`,
        link: `/user-jobs` 
      }]);
    } else if (error) {
      alert("Failed to update status.");
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
    return { ...job, applicantCount: appsForThisJob.length };
  }).filter(job => job.title.toLowerCase().includes(searchQuery.toLowerCase())); 

  const selectedJob = availableJobs.find(j => j.id === filterJobId);

  return (
    <div className="page-container-wide">
      
      {filterJobId === 'all' ? (
        <>
          <div className="flex-between align-center mb-8">
            <h1 style={{ margin: 0 }}>{role === 'admin' ? 'Manage Jobs' : 'Manage Applicants'}</h1>
            
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
          </div>

          {/* Navigation Tabs for Admin */}
          {role === 'admin' && (
            <div className="flex-row gap-8 mb-24" style={{ overflowX: 'auto', paddingBottom: '4px', borderBottom: '1px solid var(--border-color)' }}>
              <button
                onClick={() => navigate('/jobs')}
                style={{
                  padding: '8px 20px', border: 'none', background: 'none',
                  borderBottom: '2px solid transparent',
                  color: 'var(--secondary-text)',
                  fontWeight: '400', cursor: 'pointer', fontSize: '1rem',
                }}
              >
                Job Postings
              </button>
              <button
                onClick={() => navigate('/applicants')}
                style={{
                  padding: '8px 20px', border: 'none', background: 'none',
                  borderBottom: '2px solid var(--primary-color)',
                  color: 'var(--primary-color)',
                  fontWeight: '600', cursor: 'pointer', fontSize: '1rem',
                }}
              >
                Applicants
              </button>
            </div>
          )}

          <div className="flex-row gap-16 mb-32">
            <div style={{ flex: 2 }}>
              <SearchBar 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                placeholder={viewMode === 'grouped' ? "Search job postings..." : "Search candidates or job titles..."} 
              />
            </div>

            {viewMode === 'all' && (
              <select className="search-input" style={{ flex: 1 }} value={filterJobId} onChange={(e) => setFilterJobId(e.target.value)}>
                <option value="all">🏢 All Job Postings</option>
                {availableJobs.map(job => (
                  <option key={job.id} value={job.id}>{job.title}</option>
                ))}
              </select>
            )}
          </div>
        </>
      ) : (
        <div className="mb-32 flex-between align-start" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '24px' }}>
          <div className="flex-col gap-12">
            <h1 style={{ margin: 0, color: 'var(--primary-color)' }}>{selectedJob?.title || 'Job Posting'}</h1>
            <div className="text-secondary flex-row gap-24" style={{ fontSize: '0.95rem' }}>
              <span><strong>Type:</strong> {selectedJob?.type || 'Not specified'}</span>
              <span><strong>Required Skills:</strong> {selectedJob?.required_skills}</span>
            </div>
          </div>
          
          <button className="btn-outline btn-sm" onClick={() => { setFilterJobId('all'); setViewMode('grouped'); }}>
            ✕ Close List
          </button>
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
                style={{ cursor: 'pointer', transition: 'transform 0.2s', border: '1px solid var(--border-color)', minWidth: 0 }}
                onClick={() => { setFilterJobId(group.id); setViewMode('all'); }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div className="flex-row gap-16 align-center mb-24" style={{ minWidth: 0 }}>
                  <div style={{ flexShrink: 0 }}>
                    <Avatar src={group.company_logo} fallbackName={group.company_name} type="company" size="md" />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{group.title}</h3>
                    {role === 'admin' && <p className="text-secondary text-sm m-0" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{group.company_name}</p>}
                  </div>
                </div>

                <div className="flex-between align-center" style={{ paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                  <span style={{ fontWeight: '600', color: group.applicantCount > 0 ? 'var(--primary-color)' : 'var(--secondary-text)' }}>
                    👥 {group.applicantCount} {group.applicantCount === 1 ? 'Applicant' : 'Applicants'}
                  </span>
                  <span className="text-primary text-sm" style={{ fontWeight: '500' }}>View List →</span>
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
  // Dynamic colors for the badge based on percentage
  const matchColor = app.matchPercentage >= 80 ? '#065f46' : app.matchPercentage >= 50 ? '#b45309' : '#991b1b';
  const matchBg = app.matchPercentage >= 80 ? '#ecfdf5' : app.matchPercentage >= 50 ? '#fffbeb' : '#fef2f2';
  const matchBorder = app.matchPercentage >= 80 ? '#a7f3d0' : app.matchPercentage >= 50 ? '#fde68a' : '#fecaca';

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div className="flex-between-start" style={{ padding: '24px' }}>
        
        <div className="flex-row gap-16" style={{ minWidth: 0, flex: 1, paddingRight: '16px' }}>
          <div style={{ flexShrink: 0 }}>
            <Avatar src={app.applicant_pic} fallbackName={app.applicant_name} type="user" size="md" />
          </div>
          
          <div style={{ minWidth: 0, flex: 1 }}>
            <h3 className="text-lg" style={{ margin: '0 0 4px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={app.applicant_name}>
              {app.applicant_name}
            </h3>
            <p className="text-sm text-secondary" style={{ margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={app.job_title}>
              Applied for: <strong className="text-primary">{app.job_title}</strong>
            </p>
            {role === 'admin' && (
              <p className="text-sm text-secondary" style={{ margin: '4px 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={app.company_name}>
                🏢 To: {app.company_name}
              </p>
            )}
          </div>
        </div>

        <div className="flex-col align-end gap-8" style={{ flexShrink: 0 }}>
          <StatusBadge status={app.status || 'Pending'} />
          
          {/* 🚨 UPDATED: Styled identically to the badges in MatchedJobsWidget.jsx and JobCard.jsx */}
          {app.hasSkillsRequired ? (
            <span style={{ 
              background: matchBg, 
              color: matchColor, 
              border: `1px solid ${matchBorder}`,
              padding: '4px 8px', 
              borderRadius: '12px', 
              fontSize: '0.75rem', 
              fontWeight: 'bold', 
              whiteSpace: 'nowrap', 
              flexShrink: 0
            }}>
              {app.matchPercentage}% Match
            </span>
          ) : (
            <span className="text-sm text-secondary" style={{ fontWeight: '500' }}>
               No Job Skills Set
            </span>
          )}
        </div>
      </div>

      <div className="flex-between align-center" style={{ padding: '16px 24px', background: 'var(--bg-color)', borderTop: '1px solid var(--border-color)' }}>
        <div className="flex-row gap-8">
          <button className="btn-outline btn-sm" onClick={() => navigate(`/user/${app.applicant_id}`)} style={{ background: 'var(--card-bg)' }}>
            👤 View Profile
          </button>
          <button className="btn-outline btn-sm" onClick={() => alert('Resume viewing feature coming soon!')} style={{ background: 'var(--card-bg)' }}>
            📄 View Resume
          </button>
        </div>

        <div className="flex-row gap-8">
          {/* Admin restriction ensures only the hiring company can accept/reject */}
          {role !== 'admin' && app.status !== 'Approved' && (
            <button className="btn-sm" onClick={() => handleStatusChange(app.id, 'Approved')} style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 16px', fontWeight: '500', cursor: 'pointer' }}>
              ✓ Approve
            </button>
          )}
          {role !== 'admin' && app.status !== 'Rejected' && (
            <button className="btn-sm" onClick={() => handleStatusChange(app.id, 'Rejected')} style={{ background: 'var(--card-bg)', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', padding: '6px 16px', fontWeight: '500', cursor: 'pointer' }}>
              ✕ Reject
            </button>
          )}
        </div>
      </div>
    </div>
  );
}