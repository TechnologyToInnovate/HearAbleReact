import React from 'react';
import SkillBadge from './SkillBadge'; 

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
  handleUpdateJobStatus
}) {
  if (!selectedJob) return null;

  const isOwner = currentUser && selectedJob.company_id === currentUser.id;
  const isAdmin = role === 'admin';
  const editCount = selectedJob.edit_count || 0;
  const showCompanyActions = role === 'company' && isOwner && setIsEditingJob;

  return (
    <div className="card" style={{ padding: 0, position: 'relative', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      
      <div style={{ flexShrink: 0, backgroundColor: 'var(--card-bg)', zIndex: 10, padding: '24px', borderBottom: '1px solid var(--border-color)' }}>
        
        {(isAdmin || showCompanyActions) && (
          <div className="flex-row gap-8 mb-16" style={{ justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap' }}>
            
            {isAdmin && selectedJob.status === 'Pending' && handleUpdateJobStatus && (
              <>
                <button onClick={() => handleUpdateJobStatus(selectedJob.id, 'Approved')} style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', padding: '6px 12px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
                  Approve Post
                </button>
                <button onClick={() => handleUpdateJobStatus(selectedJob.id, 'Rejected')} style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', padding: '6px 12px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
                  Reject
                </button>
              </>
            )}

            {showCompanyActions && (
              <button 
                onClick={() => setIsEditingJob(true)} 
                className="btn-outline btn-sm"
                disabled={editCount >= 3}
                style={{ opacity: editCount >= 3 ? 0.6 : 1, cursor: editCount >= 3 ? 'not-allowed' : 'pointer' }}
              >
                {editCount >= 3 ? 'Edit Limit Reached' : `Edit (${editCount}/3)`}
              </button>
            )}

            <button onClick={handleDeleteJob} className="btn-danger btn-sm">Delete</button>
          </div>
        )}

        <div className="flex-between-start mb-8">
          <h1 className="m-0" style={{ fontSize: '2rem', paddingRight: '16px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {selectedJob.title}
            
            {selectedJob.matchScore > 0 && (
              <span style={{ 
                background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a',
                padding: '4px 10px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 'bold', whiteSpace: 'nowrap'
              }}>
                {selectedJob.matchScore}% Match
              </span>
            )}

            {(isAdmin || showCompanyActions) && (
              <span style={{
                padding: '4px 10px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 'bold', whiteSpace: 'nowrap',
                backgroundColor: selectedJob.status === 'Approved' ? '#dcfce7' : selectedJob.status === 'Rejected' ? '#fef2f2' : '#fef9c3',
                color: selectedJob.status === 'Approved' ? '#166534' : selectedJob.status === 'Rejected' ? '#991b1b' : '#854d0e',
                border: `1px solid ${selectedJob.status === 'Approved' ? '#bbf7d0' : selectedJob.status === 'Rejected' ? '#fecaca' : '#fde047'}`
              }}>
                {selectedJob.status === 'Approved' ? 'Published' : selectedJob.status || 'Pending'}
              </span>
            )}
          </h1>
          
          <div className="text-right" style={{ flexShrink: 0, marginTop: '8px' }}>
            <span className="text-sm text-secondary block" style={{ fontWeight: '500' }}>Posted: {selectedJob.date}</span>
            {isAdmin && editCount > 0 && <span className="text-sm text-secondary block" style={{ fontStyle: 'italic', marginTop: '4px' }}>(Edited {editCount}/3)</span>}
          </div>
        </div>
        
        {/* 🚨 NEW: Accessibility badge next to the company sub-heading */}
        <div className="text-secondary mb-24 flex-row gap-12 align-center" style={{ fontSize: '1.1rem', fontWeight: '500', flexWrap: 'wrap' }}>
          <span>{selectedJob.company}{selectedJob.location && ` • ${selectedJob.location}`}</span>
          {selectedJob.is_deaf_accessible && (
            <span style={{ background: '#e0e7ff', color: '#3730a3', fontSize: '0.75rem', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold' }}>
              ✓ Certified Deaf Accessible
            </span>
          )}
        </div>
        
        {(isAdmin || showCompanyActions) && selectedJob.applicantCount !== undefined ? (
          <div className="flex-col gap-8">
            <button className="btn-black w-full" onClick={() => navigate('/applicants', { state: { filterJobId: selectedJob.id } })} disabled={selectedJob.applicantCount === 0} style={{ opacity: selectedJob.applicantCount === 0 ? 0.5 : 1, padding: '14px', fontSize: '1.05rem' }}>
              {selectedJob.applicantCount === 0 ? 'No Applicants Yet' : `Review ${selectedJob.applicantCount} Applicants`}
            </button>
          </div>
        ) : (role !== 'company' && role !== 'admin') ? (
          <div className="flex-col gap-8">
            <button className={`btn-apply ${hasApplied ? 'success' : ''}`} onClick={handleApply} disabled={isApplying || hasApplied || ['pending_user', 'rejected_user'].includes(role)}>
              {isApplying ? 'Sending Application...' : hasApplied ? 'Application Sent' : (['pending_user', 'rejected_user'].includes(role)) ? 'Approval Required to Apply' : 'Apply Now'}
            </button>
            <button className="btn-outline w-full" onClick={handleSaveJob} disabled={isSaving}>
              {isSaving ? 'Processing...' : isSaved ? 'Saved' : 'Save for Later'}
            </button>
          </div>
        ) : null}
      </div>

      <div className="job-details-scrollable" style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
        <h3 className="mb-12" style={{ fontSize: '1.4rem', marginTop: 0 }}>Job Details</h3>
        <div className="mb-24" style={{ background: 'var(--bg-color)', padding: '24px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
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
          <div>
            <div style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '12px', color: 'var(--text-color)' }}>Job Type</div>
            <div className="flex-row-wrap gap-12">
              <span className="badge" style={{ background: 'var(--card-bg)', color: 'var(--text-color)', border: '1px solid var(--border-color)', borderRadius: '24px', padding: '8px 16px', fontSize: '0.95rem', fontWeight: '600' }}>{selectedJob.type}</span>
              <span className="badge" style={{ background: 'var(--card-bg)', color: 'var(--text-color)', border: '1px solid var(--border-color)', borderRadius: '24px', padding: '8px 16px', fontSize: '0.95rem', fontWeight: '600' }}>{selectedJob.work_model || 'On-site'}</span>
            </div>
          </div>
        </div>

        {selectedJob.location && <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '32px 0' }} />}
        
        {selectedJob.location && (
          <div className="mb-32">
            <h3 className="mb-8" style={{ fontSize: '1.4rem' }}>Location</h3>
            <p className="text-secondary m-0" style={{ fontSize: '1.05rem', fontWeight: '500' }}>{selectedJob.location}</p>
          </div>
        )}

        <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '32px 0' }} />
        
        <div className="mb-32">
          <h3 className="mb-8" style={{ fontSize: '1.4rem' }}>Job Description</h3>
          <p style={{ lineHeight: '1.6', whiteSpace: 'pre-wrap', margin: 0 }}>{selectedJob.description}</p>
        </div>

        {selectedJob.skills && selectedJob.skills.length > 0 && <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '32px 0' }} />}
        
        {selectedJob.skills && selectedJob.skills.length > 0 && (
          <div className="mt-24">
            <h3 className="mb-12" style={{ fontSize: '1.4rem' }}>Required Skills</h3>
            <div className="flex-row-wrap gap-8">
              {selectedJob.skills.map((skill, index) => (
                <SkillBadge key={skill.id || index} skill={skill} />
              ))}
            </div>
          </div>
        )}

        {selectedCompany && !showCompanyActions && (
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
                  {/* 🚨 NEW: Accessibility badge applied to the About section */}
                  <h3 className="m-0 mb-8" style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    About {selectedCompany.name}
                    {selectedCompany.is_deaf_accessible && (
                      <span style={{ background: '#e0e7ff', color: '#3730a3', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                        Deaf Accessible
                      </span>
                    )}
                  </h3>
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