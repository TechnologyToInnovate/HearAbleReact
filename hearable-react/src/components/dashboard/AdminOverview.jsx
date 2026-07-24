import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient'; 
import StatCard from './StatCard';

// 🚨 NEW: Import the actual Job Details component
import JobDetailsPane from '../jobs/JobDetailsPane';

export default function AdminOverview({ adminStats, isLoading, recentPendingUsers = [], recentPendingJobs = [], recentPendingResumes = [] }) {
  const navigate = useNavigate();
  
  const [showStatsDropdown, setShowStatsDropdown] = useState(() => {
    const savedState = localStorage.getItem('adminShowStats');
    return savedState !== null ? JSON.parse(savedState) : true;
  });

  const [previewResume, setPreviewResume] = useState(null);
  const [previewJob, setPreviewJob] = useState(null); 

  const [handledResumes, setHandledResumes] = useState([]);
  const [handledJobs, setHandledJobs] = useState([]); 

  useEffect(() => {
    localStorage.setItem('adminShowStats', JSON.stringify(showStatsDropdown));
  }, [showStatsDropdown]);

  async function handleUpdateResumeStatus(id, newStatus) {
    const { error } = await supabase.from('resumes').update({ status: newStatus }).eq('id', id);
    if (!error) {
      setHandledResumes([...handledResumes, id]);
      setPreviewResume(null); 
    } else {
      alert('Failed to update resume status');
    }
  }

  async function handleUpdateJobStatus(id, newStatus) {
    const { error } = await supabase.from('jobs').update({ status: newStatus }).eq('id', id);
    if (!error) {
      setHandledJobs([...handledJobs, id]);
      setPreviewJob(null); 
    } else {
      alert('Failed to update job status');
    }
  }

  const displayResumes = recentPendingResumes.filter(r => !handledResumes.includes(r.id));
  const displayResumeCount = Math.max(0, (adminStats.pendingResumes || 0) - handledResumes.length);
  
  const displayJobs = recentPendingJobs.filter(j => !handledJobs.includes(j.id));
  const displayJobCount = Math.max(0, (adminStats.pendingJobs || 0) - handledJobs.length);

  return (
    <div className="mb-32">
      <h2 className="m-0 mb-24">Platform Overview</h2>
      
      {/* General Statistics Toggle */}
      <div 
        className="flex-between align-center mb-16 p-12" 
        style={{ 
          cursor: 'pointer', 
          borderRadius: '8px', 
          background: 'var(--card-bg)', 
          border: '1px solid var(--border-color)',
          transition: 'background 0.2s'
        }}
        onClick={() => setShowStatsDropdown(!showStatsDropdown)}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-color)'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--card-bg)'}
      >
        <h3 className="m-0" style={{ fontSize: '1.1rem' }}>General Statistics</h3>
        <div style={{ 
          transform: showStatsDropdown ? 'rotate(180deg)' : 'rotate(0)', 
          transition: 'transform 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </div>

      {/* General Statistics Grid */}
      {showStatsDropdown && (
        <div className="mb-32" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
          <StatCard value={adminStats.users} label="Total Users" isLoading={isLoading} />
          <StatCard value={adminStats.companies} label="Registered Companies" isLoading={isLoading} />
          <StatCard value={adminStats.activeJobs} label="Active Job Postings" isLoading={isLoading} />
        </div>
      )}

      <h3 className="m-0 mb-16">Action Required: Pending Approvals</h3>
      
      {/* Action Rows */}
      <div className="flex-col gap-24 mb-32">
        
        {/* Pending Users Row */}
        <div className="card p-0" style={{ border: '1px solid var(--border-color)', overflow: 'hidden', display: 'flex', flexWrap: 'wrap' }}>
          <div 
            style={{ flex: '0 0 250px', padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'var(--card-bg)', borderRight: '1px solid var(--border-color)', transition: 'background 0.2s' }} 
            onClick={() => navigate('/users', { state: { activeTab: 'Pending' } })}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-color)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--card-bg)'}
          >
            <h3 className="m-0 mb-8" style={{ fontSize: '3rem', color: 'var(--text-color)', fontWeight: '800' }}>
              {adminStats.pendingUsers || 0}
            </h3>
            <span className="font-bold text-sm text-secondary" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Pending Users
            </span>
          </div>
          
          <div style={{ flex: '1 1 300px', padding: '24px', background: 'var(--bg-color)' }}>
            <div className="flex-between align-center mb-16">
              <h4 className="m-0 text-sm text-secondary" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>Recently Pending</h4>
              <button 
                onClick={() => navigate('/users', { state: { activeTab: 'Pending' } })} 
                style={{ background: 'transparent', border: 'none', color: 'var(--primary-color)', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer', padding: 0 }}
              >
                View All &rarr;
              </button>
            </div>
            {recentPendingUsers.length > 0 ? (
              <div className="flex-col gap-12">
                {recentPendingUsers.map((user, index) => (
                  <div key={user.id} className="flex-between align-center pb-12" style={{ borderBottom: index !== recentPendingUsers.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                    <span className="text-base font-medium text-truncate" style={{ color: 'var(--text-color)' }} title={user.title}>{user.title}</span>
                    <div className="flex-row gap-8">
                      <button 
                        className="btn-outline btn-sm" 
                        style={{ padding: '6px 16px', background: 'var(--card-bg)' }} 
                        onClick={() => navigate(`/user/${user.id}`)}
                      >
                        View Profile
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-secondary m-0">No pending users.</p>
            )}
          </div>
        </div>

        {/* Pending Jobs Row */}
        <div className="card p-0" style={{ border: '1px solid var(--border-color)', overflow: 'hidden', display: 'flex', flexWrap: 'wrap' }}>
          <div 
            style={{ flex: '0 0 250px', padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'var(--card-bg)', borderRight: '1px solid var(--border-color)', transition: 'background 0.2s' }} 
            onClick={() => navigate('/jobs', { state: { activeTab: 'Pending' } })}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-color)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--card-bg)'}
          >
            <h3 className="m-0 mb-8" style={{ fontSize: '3rem', color: 'var(--text-color)', fontWeight: '800' }}>
              {displayJobCount}
            </h3>
            <span className="font-bold text-sm text-secondary" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Pending Jobs
            </span>
          </div>
          
          <div style={{ flex: '1 1 300px', padding: '24px', background: 'var(--bg-color)' }}>
            <div className="flex-between align-center mb-16">
              <h4 className="m-0 text-sm text-secondary" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>Recently Pending</h4>
              <button 
                onClick={() => navigate('/jobs', { state: { activeTab: 'Pending' } })} 
                style={{ background: 'transparent', border: 'none', color: 'var(--primary-color)', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer', padding: 0 }}
              >
                View All &rarr;
              </button>
            </div>
            {displayJobs.length > 0 ? (
              <div className="flex-col gap-12">
                {displayJobs.map((job, index) => (
                  <div key={job.id} className="flex-between align-center pb-12" style={{ borderBottom: index !== displayJobs.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                    <span className="text-base font-medium text-truncate block" style={{ color: 'var(--text-color)' }} title={job.title}>{job.title}</span>
                    <button 
                      className="btn-outline btn-sm" 
                      style={{ padding: '6px 16px', background: 'var(--card-bg)' }} 
                      onClick={() => setPreviewJob(job)}
                    >
                      Preview
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-secondary m-0">No pending jobs.</p>
            )}
          </div>
        </div>

        {/* Pending Resumes Row */}
        <div className="card p-0" style={{ border: '1px solid var(--border-color)', overflow: 'hidden', display: 'flex', flexWrap: 'wrap' }}>
          <div 
            style={{ flex: '0 0 250px', padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'var(--card-bg)', borderRight: '1px solid var(--border-color)', transition: 'background 0.2s' }} 
            onClick={() => navigate('/users', { state: { activeTab: 'Pending' } })}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-color)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--card-bg)'}
          >
            <h3 className="m-0 mb-8" style={{ fontSize: '3rem', color: 'var(--text-color)', fontWeight: '800' }}>
              {displayResumeCount}
            </h3>
            <span className="font-bold text-sm text-secondary" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Pending Resumes
            </span>
          </div>
          
          <div style={{ flex: '1 1 300px', padding: '24px', background: 'var(--bg-color)' }}>
            <div className="flex-between align-center mb-16">
              <h4 className="m-0 text-sm text-secondary" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>Recently Pending</h4>
              <button 
                onClick={() => navigate('/users', { state: { activeTab: 'Pending' } })} 
                style={{ background: 'transparent', border: 'none', color: 'var(--primary-color)', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer', padding: 0 }}
              >
                View All &rarr;
              </button>
            </div>
            {displayResumes.length > 0 ? (
              <div className="flex-col gap-12">
                {displayResumes.map((resume, index) => (
                  <div key={resume.id} className="flex-between align-center pb-12" style={{ borderBottom: index !== displayResumes.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                    <span className="text-base font-medium text-truncate" style={{ color: 'var(--text-color)' }} title={resume.title}>{resume.title}</span>
                    
                    <div className="flex-row gap-8">
                      {resume.file_url && (
                        <>
                          <button 
                            className="btn-outline btn-sm" 
                            style={{ padding: '6px 16px', background: 'var(--card-bg)' }} 
                            onClick={() => setPreviewResume(resume)}
                          >
                            Preview
                          </button>
                          <a 
                            href={resume.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-outline btn-sm"
                            style={{ padding: '6px 16px', background: 'var(--card-bg)', textDecoration: 'none', display: 'inline-block' }}
                          >
                            Open PDF
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-secondary m-0">No pending resumes.</p>
            )}
          </div>
        </div>

      </div>

      {/* --- 🚨 UPDATED: FULL JOB DETAILS COMPONENT MODAL --- */}
      {previewJob && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div className="card p-0" style={{ width: '100%', maxWidth: '900px', height: '85vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-color)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', overflow: 'hidden', border: '1px solid var(--border-color)', position: 'relative' }}>
            
            {/* Custom Modal Header with Approve/Reject explicitly provided just in case */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, background: 'var(--card-bg)' }}>
              <div className="flex-row align-center gap-12">
                <h3 className="m-0" style={{ fontSize: '1.25rem' }}>Job Preview</h3>
                <span style={{ background: '#fef9c3', color: '#854d0e', border: '1px solid #fef08a', padding: '4px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                  Pending
                </span>
              </div>
              <div className="flex-row align-center gap-16">
                <div className="flex-row gap-8">
                  <button className="btn-sm" onClick={() => handleUpdateJobStatus(previewJob.id, 'Approved')} style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 16px', fontWeight: '500', cursor: 'pointer' }}>✓ Approve</button>
                  <button className="btn-sm" onClick={() => handleUpdateJobStatus(previewJob.id, 'Rejected')} style={{ background: 'var(--card-bg)', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', padding: '6px 16px', fontWeight: '500', cursor: 'pointer' }}>✕ Reject</button>
                </div>
                <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)' }}></div>
                <button onClick={() => setPreviewJob(null)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-color)' }}>✕</button>
              </div>
            </div>

            {/* Exactly rendering the JobDetailsPane */}
            <div style={{ flex: 1, overflowY: 'auto', backgroundColor: 'var(--bg-color)' }}>
              <JobDetailsPane 
                selectedJob={previewJob}
                selectedCompany={previewJob.companies}
                role="admin"
                handleUpdateJobStatus={handleUpdateJobStatus}
                handleClose={() => setPreviewJob(null)}
                navigate={navigate}
              />
            </div>
            
          </div>
        </div>
      )}

      {/* --- RESUME PREVIEW MODAL --- */}
      {previewResume && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          
          <div className="card p-0" style={{ width: '100%', maxWidth: '800px', height: '85vh', display: 'flex', flexDirection: 'column', background: 'var(--card-bg)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
            
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div className="flex-row align-center gap-12">
                <h3 className="m-0" style={{ fontSize: '1.25rem' }}>Resume Preview</h3>
                <span style={{ background: '#fef9c3', color: '#854d0e', border: '1px solid #fef08a', padding: '4px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                  Pending
                </span>
              </div>
              
              <div className="flex-row align-center gap-16">
                <div className="flex-row gap-8">
                  <button 
                    className="btn-sm" 
                    onClick={() => handleUpdateResumeStatus(previewResume.id, 'Approved')} 
                    style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 16px', fontWeight: '500', cursor: 'pointer' }}
                  >
                    ✓ Approve
                  </button>
                  <button 
                    className="btn-sm" 
                    onClick={() => handleUpdateResumeStatus(previewResume.id, 'Rejected')} 
                    style={{ background: 'var(--card-bg)', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', padding: '6px 16px', fontWeight: '500', cursor: 'pointer' }}
                  >
                    ✕ Reject
                  </button>
                </div>
                
                <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)' }}></div>
                
                <button onClick={() => setPreviewResume(null)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-color)' }}>✕</button>
              </div>
            </div>
            
            <div style={{ flex: 1, backgroundColor: '#525659', width: '100%', height: '100%' }}>
              <iframe 
                src={`${previewResume.file_url}#view=FitH`} 
                title="Resume Preview" 
                width="100%" 
                height="100%" 
                style={{ border: 'none', display: 'block' }}
              />
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
}