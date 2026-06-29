import React from 'react';

export default function JobDetailsPane({
  selectedJob,
  selectedCompany,
  role,
  currentUser,
  isApplying,
  hasApplied,
  isSaved,
  isSaving,
  handleApply,
  handleSaveJob,
  handleDeleteJob,
  setIsEditingJob,
  navigate,
  handleClose 
}) {
  if (!selectedJob) return null;

  const isOwner = currentUser && selectedJob.company_id === currentUser.id;
  const isAdmin = role === 'admin';

  return (
    // 🚨 1. The main card is now a fixed-height Flexbox column!
    <div className="card" style={{ padding: 0, position: 'relative', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      
      {/* 🚨 2. THE STATIC HEADER (Never scrolls) */}
      <div style={{ flexShrink: 0, backgroundColor: 'var(--card-bg)', zIndex: 10, padding: '24px', borderBottom: '1px solid var(--border-color)' }}>
        
        {/* EDIT / DELETE CONTROLS */}
        {(isAdmin || (role === 'company' && isOwner)) && (
          <div className="flex-row gap-8 mb-16" style={{ justifyContent: 'flex-end' }}>
            <button onClick={() => setIsEditingJob(true)} className="btn-outline btn-sm">⚙️ Edit</button>
            <button onClick={handleDeleteJob} className="btn-danger btn-sm">🗑️ Delete</button>
            {handleClose && (
              <button onClick={handleClose} className="btn-outline btn-sm" style={{ padding: '6px 10px' }}>✕</button>
            )}
          </div>
        )}

        {/* BIGGER TITLE, SCORE & DATE */}
        <div className="flex-between-start mb-8">
          <h1 className="m-0" style={{ fontSize: '2rem', paddingRight: '16px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {selectedJob.title}
            
            {selectedJob.matchScore > 0 && (
              <span style={{ 
                background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a',
                padding: '4px 10px', borderRadius: '12px', fontSize: '0.85rem', 
                fontWeight: 'bold', whiteSpace: 'nowrap'
              }}>
                🔥 {selectedJob.matchScore}% Match
              </span>
            )}
          </h1>
          
          <div className="text-right" style={{ flexShrink: 0, marginTop: '8px' }}>
            <span className="text-sm text-secondary block" style={{ fontWeight: '500' }}>
              Posted: {selectedJob.date}
            </span>
          </div>
        </div>
        
        {/* COMPANY NAME & LOCATION */}
        <div className="text-secondary mb-24" style={{ fontSize: '1.1rem', fontWeight: '500' }}>
          {selectedJob.company}{selectedJob.location && ` • ${selectedJob.location}`}
        </div>
        
        {/* ACTION BUTTONS (Apply / Save / Review) */}
        {role === 'company' && isOwner && selectedJob.applicantCount !== undefined ? (
          <div className="flex-col gap-8">
            <button 
              className="btn-black w-full" 
              onClick={() => navigate('/applicants', { state: { filterJobId: selectedJob.id } })} 
              disabled={selectedJob.applicantCount === 0} 
              style={{ opacity: selectedJob.applicantCount === 0 ? 0.5 : 1, padding: '14px', fontSize: '1.05rem' }}
            >
              {selectedJob.applicantCount === 0 ? 'No Applicants Yet' : `Review ${selectedJob.applicantCount} Applicants`}
            </button>
          </div>
        ) : (role !== 'company' && role !== 'admin') ? (
          <div className="flex-col gap-8">
            <button 
              className={`btn-apply ${hasApplied ? 'success' : ''}`}
              onClick={handleApply} 
              disabled={isApplying || hasApplied || ['pending_user', 'rejected_user'].includes(role)}
            >
              {isApplying ? 'Sending Application...' : hasApplied ? '✓ Application Sent' : (['pending_user', 'rejected_user'].includes(role)) ? 'Approval Required to Apply' : 'Apply Now'}
            </button>

            <button className="btn-outline w-full" onClick={handleSaveJob} disabled={isSaving}>
              {isSaving ? 'Processing...' : isSaved ? 'Saved' : 'Save for Later'}
            </button>
          </div>
        ) : null}
      </div>

      {/* 🚨 3. THE SCROLLABLE BODY (Takes up the remaining height and handles the scrolling internally) */}
      <div className="job-details-scrollable" style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
        
        {/* JOB DETAILS */}
        <h3 className="mb-12" style={{ fontSize: '1.4rem', marginTop: 0 }}>Job Details</h3>
        <div className="mb-24" style={{ background: 'var(--bg-color)', padding: '24px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          
          {/* Pay Area */}
          {selectedJob.pay && (
            <div style={{ paddingBottom: '20px', borderBottom: '1px solid var(--border-color)', marginBottom: '20px' }}>
              <div style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '12px', color: 'var(--text-color)' }}>Pay</div>
              <div className="flex-row-wrap gap-12">
                <span className="badge" style={{ background: 'var(--card-bg)', color: 'var(--text-color)', border: '1px solid var(--border-color)', borderRadius: '24px', padding: '8px 16px', fontSize: '0.95rem', fontWeight: '600' }}>
                  {selectedJob.pay} <span style={{ fontWeight: 'normal', color: 'var(--secondary-text)' }}>{selectedJob.pay_rate}</span>
                </span>
              </div>
            </div>
          )}
          
          {/* Job Type Circles */}
          <div>
            <div style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '12px', color: 'var(--text-color)' }}>Job Type</div>
            <div className="flex-row-wrap gap-12">
              <span className="badge" style={{ background: 'var(--card-bg)', color: 'var(--text-color)', border: '1px solid var(--border-color)', borderRadius: '24px', padding: '8px 16px', fontSize: '0.95rem', fontWeight: '600' }}>
                {selectedJob.type}
              </span>
              <span className="badge" style={{ background: 'var(--card-bg)', color: 'var(--text-color)', border: '1px solid var(--border-color)', borderRadius: '24px', padding: '8px 16px', fontSize: '0.95rem', fontWeight: '600' }}>
                {selectedJob.work_model || 'On-site'}
              </span>
            </div>
          </div>
        </div>

        {selectedJob.location && <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '32px 0' }} />}
        
        {/* LOCATION */}
        {selectedJob.location && (
          <div className="mb-32">
            <h3 className="mb-8" style={{ fontSize: '1.4rem' }}>Location</h3>
            <p className="text-secondary m-0" style={{ fontSize: '1.05rem', fontWeight: '500' }}>{selectedJob.location}</p>
          </div>
        )}

        <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '32px 0' }} />
        
        {/* JOB DESCRIPTION */}
        <div className="mb-32">
          <h3 className="mb-8" style={{ fontSize: '1.4rem' }}>Job Description</h3>
          <p style={{ lineHeight: '1.6', whiteSpace: 'pre-wrap', margin: 0 }}>{selectedJob.description}</p>
        </div>

        {selectedJob.skills && selectedJob.skills.length > 0 && <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '32px 0' }} />}
        
        {/* REQUIRED SKILLS */}
        {selectedJob.skills && selectedJob.skills.length > 0 && (
          <div className="mt-24">
            <h3 className="mb-12" style={{ fontSize: '1.4rem' }}>Required Skills</h3>
            <div className="flex-row-wrap gap-8">
              {selectedJob.skills.map((skill, index) => (
                <span key={index} className="badge" style={{ background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-color)', padding: '6px 12px', fontSize: '0.9rem' }}>
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* COMPANY SUB-CARD */}
        {selectedCompany && !(role === 'company' && isOwner) && (
          <>
            <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '32px 0' }} />
            <div className="sub-card">
              <div className="flex-row gap-16 align-center mb-16">
                <div className="avatar" style={{ borderRadius: '8px', flexShrink: 0 }}>
                  {selectedCompany.logo_url ? (
                     <img src={selectedCompany.logo_url} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                  ) : (
                     selectedCompany.name ? selectedCompany.name.charAt(0).toUpperCase() : 'C'
                  )}
                </div>
                <div>
                  <h3 className="m-0 mb-8" style={{ fontSize: '1.25rem' }}>About {selectedCompany.name}</h3>
                  <p className="text-sm text-secondary m-0">{selectedCompany.address || selectedCompany.city || "Location not specified"}</p>
                </div>
              </div>
              <button className="btn-outline w-full" onClick={() => navigate(`/company/${selectedCompany.id}`)}>
                View Full Company Profile
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}