import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

import StatusBadge from '../components/common/StatusBadge';
import Avatar from '../components/common/Avatar';
import SearchBar from '../components/common/SearchBar';
import { formatFullName } from '../utils/formatUtils';
import InterviewRequestModal from '../components/modals/InterviewRequestModal';

export default function Applicants() {
  const navigate = useNavigate();
  const location = useLocation();
  const { role } = useAuth(); 
  
  // Data States
  const [applications, setApplications] = useState([]);
  const [availableJobs, setAvailableJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // UI & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState(() => location.state?.filterJobId ? 'all' : (localStorage.getItem('applicantsViewMode') || 'grouped')); 
  const [filterJobId, setFilterJobId] = useState(location.state?.filterJobId || 'all');
  const [showSkillsModal, setShowSkillsModal] = useState(false);
  
  // Modal States
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inspectModalApp, setInspectModalApp] = useState(null);
  const [previewResumeUrl, setPreviewResumeUrl] = useState(null);

  useEffect(() => {
    localStorage.setItem('applicantsViewMode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    if (['user', 'pending_user', 'rejected_user', 'guest'].includes(role)) {
      navigate('/');
      return;
    }
    fetchApplicants();
  }, [role, navigate]);

  // ------------------------------------------------------------------
  // Data Fetching
  // ------------------------------------------------------------------
  async function fetchApplicants() {
    setIsLoading(true);
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const [appsData, jobsData, profilesData, companiesData, jobSkillsData, profileSkillsData, skillsData] = await Promise.all([
      supabase.from('applications').select('*, resumes(file_url)').order('id', { ascending: false }).then(res => res.data),
      supabase.from('jobs').select('*').then(res => res.data),
      supabase.from('profiles').select('*').then(res => res.data),
      supabase.from('companies').select('*').then(res => res.data),
      supabase.from('job_skills').select('*').then(res => res.data),
      supabase.from('profile_skills').select('*').then(res => res.data),
      supabase.from('skills').select('*').then(res => res.data)
    ]);

    if (appsData && jobsData) {
      let mappedApps = appsData.map(app => {
        const job = jobsData.find(j => j.id === app.job_id) || {};
        const profile = profilesData?.find(p => p.id === app.applicant_id) || {};
        const company = companiesData?.find(c => c.id === job.company_id) || {};
        
        const pSkills = profileSkillsData?.filter(ps => ps.profile_id === app.applicant_id).map(ps => ps.skill_id) || [];
        const jSkills = jobSkillsData?.filter(js => js.job_id === app.job_id).map(js => js.skill_id) || [];
        const matchPercentage = jSkills.length > 0 ? Math.round((pSkills.filter(s => jSkills.includes(s)).length / jSkills.length) * 100) : 0;

        return {
          ...app,
          job_title: job.title || 'Unknown Job',
          company_id: job.company_id,
          company_name: company.name || 'Unknown Company',
          applicant_name: formatFullName(profile.first_name, profile.last_name, 'Unknown Candidate'),
          applicant_pic: profile.profile_pic || '',
          resume_url: app.resumes?.file_url || null,
          matchPercentage,
          hasSkillsRequired: jSkills.length > 0
        };
      });

      let mappedJobs = jobsData.map(job => {
        const company = companiesData?.find(c => c.id === job.company_id) || {};
        const requiredSkillNames = skillsData?.filter(s => jobSkillsData?.some(js => js.job_id === job.id && js.skill_id === s.id)).map(s => s.name) || [];
        
        return {
          ...job,
          company_name: company.name || 'Unknown Company',
          company_logo: company.logo_url || '',
          required_skills: requiredSkillNames.length > 0 ? requiredSkillNames.join(', ') : 'None specified'
        };
      });

      if (role === 'company') {
        mappedApps = mappedApps.filter(app => app.company_id === session.user.id);
        mappedJobs = mappedJobs.filter(j => j.company_id === session.user.id);
      }
      
      setAvailableJobs(mappedJobs);
      setApplications(mappedApps);
    }
    setIsLoading(false);
  }

  // ------------------------------------------------------------------
  // Actions 
  // ------------------------------------------------------------------
  async function updateApplicantStatus(app, newStatus, notifTitle, notifMessage) {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('applications').update({ status: newStatus }).eq('id', app.id);
      if (error) throw error;

      setApplications(prev => prev.map(a => a.id === app.id ? { ...a, status: newStatus } : a));
      await supabase.from('notifications').insert([{ user_id: app.applicant_id, title: notifTitle, message: notifMessage, link: `/user-jobs` }]);
      return true;
    } catch (error) {
      console.error(error);
      alert(`Failed to update status to ${newStatus}.`);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleRejectApplicant = async (appId) => {
    if (!window.confirm("Are you sure you want to reject this applicant?")) return false;
    const app = applications.find(a => a.id === appId);
    return await updateApplicantStatus(app, 'Rejected', 'Application Update', `Your application for ${app.job_title} at ${app.company_name} was rejected.`);
  };

  const handleSendInterview = async () => {
    if (!selectedApplicant) return;
    const success = await updateApplicantStatus(
      selectedApplicant, 
      'Interviewing', 
      'Interview Request! 🎉', 
      `You have been invited to an interview for ${selectedApplicant.job_title} at ${selectedApplicant.company_name}. Check your email or messages for details.`
    );
    if (success) {
      alert("Interview request sent successfully!");
      setShowInterviewModal(false);
    }
  };

  const handleViewResume = (resumeUrl) => {
    if (!resumeUrl) return alert("No resume file found for this applicant.");
    window.open(resumeUrl, '_blank', 'noopener,noreferrer');
  };

  const handleInspectModalStatusChange = async (app, newStatus, message) => {
    if (newStatus === 'Interviewing') {
      const defaultMsg = `You have been invited to an interview for ${app.job_title} at ${app.company_name}. Check your email or messages for details.`;
      const notifMsg = message ? `You have been invited to an interview for ${app.job_title} at ${app.company_name}. Details: ${message}` : defaultMsg;
      
      const success = await updateApplicantStatus(app, 'Interviewing', 'Interview Request! 🎉', notifMsg);
      if (success) {
        alert('Interview request sent!');
        setInspectModalApp(null);
      }
    } else if (newStatus === 'Rejected') {
      const defaultMsg = `Your application for ${app.job_title} at ${app.company_name} was rejected.`;
      const notifMsg = message ? `Your application for ${app.job_title} at ${app.company_name} was rejected. Feedback: ${message}` : defaultMsg;
      
      const success = await updateApplicantStatus(app, 'Rejected', 'Application Update', notifMsg);
      if (success) setInspectModalApp(null);
    } else if (newStatus === 'Under Review') {
      const success = await updateApplicantStatus(app, 'Under Review', 'Application Update', `Your application for ${app.job_title} at ${app.company_name} is currently under review.`);
      if (success) setInspectModalApp(null);
    } else {
      const success = await updateApplicantStatus(app, newStatus, 'Application Update', `Your application status for ${app.job_title} was updated to ${newStatus}.`);
      if (success) setInspectModalApp(null);
    }
  };

  const handleHireApplicant = async (app) => {
    if (!window.confirm(`Are you sure you want to hire ${app.applicant_name}?\n\nThis will permanently update their status to Hired and send them a congratulatory notification!`)) {
      return;
    }
    const success = await updateApplicantStatus(
      app, 
      'Hired', 
      'You Got the Job! 🎉', 
      `Congratulations! You have been hired for the ${app.job_title} position at ${app.company_name}.`
    );
    if (success) alert(`${app.applicant_name} has been hired successfully!`);
  };

  // ------------------------------------------------------------------
  // Computed Data for Rendering
  // ------------------------------------------------------------------
  const displayApps = applications.filter(app => 
    (filterJobId === 'all' || app.job_id === filterJobId) &&
    (app.applicant_name.toLowerCase().includes(searchQuery.toLowerCase()) || app.job_title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const jobGroups = availableJobs.map(job => ({
    ...job, applicantCount: applications.filter(app => app.job_id === job.id).length
  })).filter(job => job.title.toLowerCase().includes(searchQuery.toLowerCase())); 

  const selectedJob = availableJobs.find(j => j.id === filterJobId);

  // ------------------------------------------------------------------
  // Main Render
  // ------------------------------------------------------------------
  return (
    <div className="page-container-wide">
      
      {/* Header & Controls */}
      {filterJobId === 'all' ? (
        <div className="mb-32 flex-col gap-16">
          <div className="flex-between align-center" style={{ flexWrap: 'wrap', gap: '16px' }}>
            <div className="flex-row align-center gap-16 flex-wrap">
              <h1 className="m-0">{role === 'admin' ? 'Manage Jobs' : 'Manage Applicants'}</h1>
              {role === 'admin' && (
                <div className="flex-row" style={{ background: 'var(--bg-color)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <button onClick={() => navigate('/jobs')} style={{ padding: '6px 16px', borderRadius: '6px', border: 'none', fontWeight: '500', cursor: 'pointer', background: 'transparent', color: 'var(--secondary-text)' }}>Job Postings</button>
                  <button onClick={() => navigate('/applicants')} style={{ padding: '6px 16px', borderRadius: '6px', border: 'none', fontWeight: '500', cursor: 'pointer', background: 'var(--card-bg)', color: 'var(--text-color)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>Applicants</button>
                </div>
              )}
            </div>
          </div>
          <SearchBar value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={viewMode === 'grouped' ? "Search job postings..." : "Search candidates or job titles..."} />
          <select className="search-input" style={{ width: 'auto', minWidth: '220px' }} value={viewMode} onChange={(e) => { setViewMode(e.target.value); if (e.target.value === 'grouped') setFilterJobId('all'); }}>
            <option value="grouped">View: Group by Job Post</option>
            <option value="all">View: All Applicants</option>
          </select>
        </div>
      ) : (
        <div className="mb-32 flex-col align-start">
          <button className="btn-outline btn-sm mb-16 inline-flex align-center gap-8" onClick={() => { setFilterJobId('all'); setViewMode('grouped'); }}>&larr; Back</button>
          <JobDetailsCard job={selectedJob} onShowSkills={() => setShowSkillsModal(true)} />
        </div>
      )}

      {/* Main Content Area */}
      {isLoading ? (
        <p className="text-center text-secondary">Loading applications...</p>
      ) : viewMode === 'grouped' && filterJobId === 'all' ? (
        jobGroups.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
            {jobGroups.map(group => (
              <JobGroupCard key={group.id} group={group} role={role} onClick={() => { setFilterJobId(group.id); setViewMode('all'); }} />
            ))}
          </div>
        ) : <EmptyState icon="📭" title="No job posts found" message="Try clearing your search query or posting a new job." />
      ) : (
        displayApps.length > 0 ? (
          <div className="flex-col gap-16">
            {displayApps.map(app => (
              <ApplicantCard 
                key={app.id} app={app} role={role} 
                onInspectClick={() => setInspectModalApp(app)}
                onRejectClick={() => handleRejectApplicant(app.id)}
                onAcceptClick={() => { setSelectedApplicant(app); setShowInterviewModal(true); }}
                onHireClick={() => handleHireApplicant(app)} 
              />
            ))}
          </div>
        ) : <EmptyState icon="📥" title="No applications found" message={filterJobId !== 'all' ? "No one has applied to this specific job yet." : "When talent applies to your job postings, they will appear right here."} />
      )}

      {/* Modals */}
      {showSkillsModal && <SkillsModal job={selectedJob} onClose={() => setShowSkillsModal(false)} />}
      <InterviewRequestModal isOpen={showInterviewModal} onClose={() => setShowInterviewModal(false)} applicantName={selectedApplicant?.applicant_name} onSubmit={handleSendInterview} isSubmitting={isSubmitting} />
      
      <InspectApplicantModal 
        isOpen={!!inspectModalApp} 
        onClose={() => setInspectModalApp(null)} 
        app={inspectModalApp} 
        navigate={navigate} 
        handleViewResume={handleViewResume} 
        onPreviewResume={(url) => setPreviewResumeUrl(url)} 
        onStatusChange={handleInspectModalStatusChange}
      />
      
      <ResumePreviewModal resumeUrl={previewResumeUrl} onClose={() => setPreviewResumeUrl(null)} />

    </div>
  );
}

// ----------------------------------------------------------------------
// Extracted UI Components
// ----------------------------------------------------------------------

function EmptyState({ icon, title, message }) {
  return (
    <div className="card text-center text-secondary p-20" style={{ padding: '48px 24px' }}>
      <div className="text-3xl mb-16">{icon}</div>
      <h3 className="mb-8">{title}</h3>
      <p>{message}</p>
    </div>
  );
}

function JobGroupCard({ group, role, onClick }) {
  return (
    <div className="card p-24 hover-lift" style={{ cursor: 'pointer', border: '1px solid var(--border-color)', minWidth: 0 }} onClick={onClick}>
      <div className="flex-row gap-16 align-center mb-24" style={{ minWidth: 0 }}>
        <div style={{ flexShrink: 0 }}><Avatar src={group.company_logo} fallbackName={group.company_name} type="company" size="md" /></div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h3 className="m-0 mb-4 text-truncate" style={{ fontSize: '1.1rem' }}>{group.title}</h3>
          {role === 'admin' && <p className="text-secondary text-sm m-0 text-truncate">{group.company_name}</p>}
        </div>
      </div>
      <div className="flex-between align-center" style={{ paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
        <span style={{ fontWeight: '600', color: group.applicantCount > 0 ? 'var(--primary-color)' : 'var(--secondary-text)' }}>
          👥 {group.applicantCount} {group.applicantCount === 1 ? 'Applicant' : 'Applicants'}
        </span>
        <span className="text-primary text-sm" style={{ fontWeight: '500' }}>View List →</span>
      </div>
    </div>
  );
}

function JobDetailsCard({ job, onShowSkills }) {
  const skillsArray = job?.required_skills && job.required_skills !== 'None specified' ? job.required_skills.split(', ') : [];
  
  return (
    <div className="card p-24 w-full">
      <h2 style={{ margin: '0 0 16px 0', color: 'var(--primary-color)' }}>{job?.title || 'Job Posting'}</h2>
      <div className="flex-col gap-12">
        <div className="flex-row align-center gap-8">
          <strong className="text-secondary">Type:</strong>
          <span style={{ fontSize: '1rem', fontWeight: '500' }}>{job?.type || 'Not specified'}</span>
        </div>
        <div>
          <strong className="text-secondary block mb-8">Required Skills:</strong>
          <div className="flex-row-wrap gap-8 align-center">
            {skillsArray.length > 0 ? (
              <>
                {skillsArray.slice(0, 3).map((skill, index) => <span key={index} className="badge badge-neutral">{skill}</span>)}
                {skillsArray.length > 3 && <button className="btn-outline btn-sm" style={{ padding: '4px 8px', fontSize: '0.85rem' }} onClick={onShowSkills}>View More (+{skillsArray.length - 3})</button>}
              </>
            ) : <span className="text-secondary text-sm">No skills specified</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function ApplicantCard({ app, role, onRejectClick, onAcceptClick, onInspectClick, onHireClick }) {
  const matchColor = app.matchPercentage >= 80 ? '#065f46' : app.matchPercentage >= 50 ? '#b45309' : '#991b1b';
  const matchBg = app.matchPercentage >= 80 ? '#ecfdf5' : app.matchPercentage >= 50 ? '#fffbeb' : '#fef2f2';
  const matchBorder = app.matchPercentage >= 80 ? '#a7f3d0' : app.matchPercentage >= 50 ? '#fde68a' : '#fecaca';

  const [showHireTooltip, setShowHireTooltip] = useState(false);

  // 🚨 FIXED: Removed `overflow: 'hidden'` so the pop-up doesn't get clipped.
  return (
    <div className="card" style={{ padding: 0 }}>
      <div className="flex-between-start" style={{ padding: '24px' }}>
        <div className="flex-row gap-16" style={{ minWidth: 0, flex: 1, paddingRight: '16px' }}>
          <div style={{ flexShrink: 0 }}><Avatar src={app.applicant_pic} fallbackName={app.applicant_name} type="user" size="md" /></div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h3 className="text-lg m-0 mb-4 text-truncate" title={app.applicant_name}>{app.applicant_name}</h3>
            <p className="text-sm text-secondary m-0 text-truncate" title={app.job_title}>Applied for: <strong className="text-primary">{app.job_title}</strong></p>
            {role === 'admin' && <p className="text-sm text-secondary mt-4 m-0 text-truncate" title={app.company_name}>{app.company_name}</p>}
          </div>
        </div>
        <div className="flex-col align-end gap-8" style={{ flexShrink: 0 }}>
          <StatusBadge status={app.status || 'Pending'} />
          {app.hasSkillsRequired ? (
            <span style={{ background: matchBg, color: matchColor, border: `1px solid ${matchBorder}`, padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
              {app.matchPercentage}% Match
            </span>
          ) : <span className="text-sm text-secondary font-medium">No Job Skills Set</span>}
        </div>
      </div>
      
      {/* 🚨 FIXED: Added border-radius inheritance to the bottom section to maintain the clean card look without `overflow: hidden` */}
      <div className="flex-between align-center" style={{ padding: '16px 24px', background: 'var(--bg-color)', borderTop: '1px solid var(--border-color)', borderBottomLeftRadius: 'inherit', borderBottomRightRadius: 'inherit' }}>
        <button className="btn-outline btn-sm" onClick={onInspectClick} style={{ background: 'var(--card-bg)' }}>🔍 Inspect Job Seeker</button>
        <div className="flex-row gap-8 align-center">
          {role !== 'admin' && app.status === 'Pending' && (
            <>
              <button className="btn-sm" onClick={onRejectClick} style={{ background: 'var(--card-bg)', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', padding: '6px 16px', fontWeight: '500', cursor: 'pointer' }}>✕ Reject</button>
              <button className="btn-sm" onClick={onAcceptClick} style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 16px', fontWeight: '500', cursor: 'pointer' }}>✓ Accept</button>
            </>
          )}
          {app.status === 'Interviewing' && <span className="text-sm font-medium" style={{ color: '#065f46', background: '#ecfdf5', padding: '6px 12px', borderRadius: '6px' }}>Interview Scheduled</span>}
          {app.status === 'Hired' && <span className="text-sm font-medium" style={{ color: '#1d4ed8', background: '#eff6ff', padding: '6px 12px', borderRadius: '6px' }}>Hired 🎉</span>}

          {role !== 'admin' && app.status !== 'Hired' && app.status !== 'Rejected' && (
            <div 
              style={{ position: 'relative', display: 'inline-block' }}
              onMouseEnter={() => app.status !== 'Interviewing' && setShowHireTooltip(true)}
              onMouseLeave={() => setShowHireTooltip(false)}
              onClick={() => app.status !== 'Interviewing' && setShowHireTooltip(true)}
            >
              <button 
                className="btn-sm" 
                onClick={onHireClick}
                disabled={app.status !== 'Interviewing'}
                style={{ 
                  background: app.status === 'Interviewing' ? '#2563eb' : '#e5e7eb', 
                  color: app.status === 'Interviewing' ? 'white' : '#9ca3af', 
                  border: 'none', 
                  borderRadius: '6px', 
                  padding: '6px 16px', 
                  fontWeight: '600', 
                  cursor: app.status === 'Interviewing' ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s ease-in-out',
                  pointerEvents: app.status !== 'Interviewing' ? 'none' : 'auto' 
                }}
              >
                Hire Applicant
              </button>
              
              {/* 🚨 FIXED: Aligned tooltip to the right edge so it doesn't get cut by screen boundaries either */}
              {showHireTooltip && app.status !== 'Interviewing' && (
                <div style={{
                  position: 'absolute',
                  bottom: '100%',
                  right: '0',
                  marginBottom: '10px',
                  background: '#1f2937',
                  color: '#f9fafb',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  whiteSpace: 'nowrap',
                  zIndex: 9999,
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}>
                  Must be interviewed before hiring
                  <div style={{ 
                    position: 'absolute', 
                    top: '100%', 
                    right: '24px', 
                    borderWidth: '5px', 
                    borderStyle: 'solid', 
                    borderColor: '#1f2937 transparent transparent transparent' 
                  }}></div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SkillsModal({ job, onClose }) {
  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div className="modal-content p-0 w-full max-w-400 overflow-hidden">
        <div className="flex-between align-center" style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)' }}>
          <h3 className="m-0" style={{ fontSize: '1.15rem' }}>All Required Skills</h3>
          <button onClick={onClose} className="close-btn" style={{ fontSize: '1.5rem', lineHeight: 1 }}>&times;</button>
        </div>
        <div style={{ padding: '24px', maxHeight: '50vh', overflowY: 'auto' }}>
          <div className="flex-row-wrap gap-8">
            {job?.required_skills?.split(', ').map((skill, index) => <span key={index} className="badge badge-neutral" style={{ fontSize: '0.95rem', padding: '6px 12px' }}>{skill}</span>)}
          </div>
        </div>
      </div>
    </div>
  );
}

function InspectApplicantModal({ isOpen, onClose, app, navigate, handleViewResume, onPreviewResume, onStatusChange }) {
  const [selectedStatus, setSelectedStatus] = useState('Under Review');
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    if (app) {
      let initialStatus = app.status || 'Under Review';
      if (initialStatus === 'Pending' || initialStatus === 'On-Hold') {
        initialStatus = 'Under Review';
      }
      setSelectedStatus(initialStatus);
      setStatusMessage(''); 
    }
  }, [app]);

  useEffect(() => {
    setStatusMessage('');
  }, [selectedStatus]);

  if (!isOpen || !app) return null;

  const handleSaveStatus = () => {
    if (selectedStatus === app.status && !statusMessage) return onClose(); 
    
    if (selectedStatus === 'Interviewing' || selectedStatus === 'Rejected') {
      const actionType = selectedStatus === 'Interviewing' ? 'schedule an interview with' : 'reject';
      if (!window.confirm(`Are you sure you want to ${actionType} this candidate?\n\nWarning: You can't undo this action once saved.`)) {
        return; 
      }
    }

    onStatusChange(app, selectedStatus, statusMessage);
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div className="modal-content" style={{ maxWidth: '400px' }}>
        <div className="modal-header">
          <h2 className="m-0">Inspect Job Seeker</h2>
          <button type="button" className="close-btn" onClick={onClose}>✕</button>
        </div>
        
        <div className="modal-body flex-col gap-16">
          <div className="flex-row gap-16 align-center mb-8">
            <Avatar src={app.applicant_pic} fallbackName={app.applicant_name} type="user" size="lg" />
            <div>
              <h3 className="m-0" style={{ fontSize: '1.2rem' }}>{app.applicant_name}</h3>
              <p className="text-sm text-secondary m-0">{app.matchPercentage}% Skill Match</p>
            </div>
          </div>
          
          <button className="btn-outline w-full" onClick={() => { navigate(`/user/${app.applicant_id}`); onClose(); }}>👤 View Profile</button>
          <button className="btn-outline w-full" onClick={() => { if (!app.resume_url) return alert("No resume found."); onPreviewResume(app.resume_url); onClose(); }}>👁️ View Resume Preview</button>
          <button className="btn-outline w-full" onClick={() => { handleViewResume(app.resume_url); onClose(); }}>📄 View Resume PDF</button>

          <div style={{ marginTop: '8px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
            <label className="text-sm font-bold block mb-8 text-secondary">Update Application Status</label>
            <div className="flex-col gap-8">
              <div className="flex-row gap-8">
                <select 
                  className="search-input" 
                  style={{ flex: 1 }} 
                  value={selectedStatus} 
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="Under Review">Under Review</option>
                  <option value="Interviewing">For Interview</option>
                  <option value="Rejected">Rejected</option>
                </select>
                <button 
                  className="btn-black" 
                  onClick={handleSaveStatus}
                >
                  Save
                </button>
              </div>

              {selectedStatus === 'Interviewing' && (
                <textarea 
                  className="search-input mt-8"
                  style={{ width: '100%', minHeight: '80px', resize: 'vertical' }}
                  placeholder="Enter interview details (e.g. date, time, Zoom link, or instructions)..."
                  value={statusMessage}
                  onChange={(e) => setStatusMessage(e.target.value)}
                />
              )}

              {selectedStatus === 'Rejected' && (
                <textarea 
                  className="search-input mt-8"
                  style={{ width: '100%', minHeight: '80px', resize: 'vertical' }}
                  placeholder="Optional: Enter a reason or feedback for the candidate..."
                  value={statusMessage}
                  onChange={(e) => setStatusMessage(e.target.value)}
                />
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function ResumePreviewModal({ resumeUrl, onClose }) {
  if (!resumeUrl) return null;
  return (
    <div className="modal-overlay" style={{ zIndex: 10000 }}>
      <div className="modal-content" style={{ maxWidth: '800px', width: '90%', height: '85vh', display: 'flex', flexDirection: 'column', padding: 0 }}>
        <div className="flex-between align-center" style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)' }}>
          <h2 className="m-0" style={{ fontSize: '1.25rem' }}>Resume Preview</h2>
          <button type="button" className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div style={{ flex: 1, backgroundColor: '#525659' }}>
          <iframe src={`${resumeUrl}#toolbar=0`} width="100%" height="100%" style={{ border: 'none' }} title="Resume Preview" />
        </div>
      </div>
    </div>
  );
}