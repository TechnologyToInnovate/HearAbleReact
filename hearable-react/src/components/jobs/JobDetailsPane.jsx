import React, { useState } from 'react';

import SkillBadge from '../common/SkillBadge'; 
import StatusBadge from '../common/StatusBadge';
import DeafAccessibleBadge from '../common/DeafAccessibleBadge';
import Avatar from '../common/Avatar';
import { formatLocation } from '../../utils/formatUtils';

export default function JobDetailsPane({
  selectedJob, selectedCompany, role, currentUser,
  isApplying, hasApplied, isSaved, isSaving,
  handleApply, handleSaveJob, handleDeleteJob,
  setIsEditingJob, navigate, handleUpdateJobStatus
}) {
  const [isDescExpanded, setIsDescExpanded] = useState(false);

  if (!selectedJob) return null;

  const isOwner = currentUser && selectedJob.company_id === currentUser.id;
  const isAdmin = role === 'admin';
  const editCount = selectedJob.edit_count || 0;
  const showCompanyActions = role === 'company' && isOwner && setIsEditingJob;

  const DESC_LIMIT = 200;
  const companyDesc = selectedCompany?.description;
  const shouldTruncateDesc = companyDesc && companyDesc.length > DESC_LIMIT;
  const displayDesc = (shouldTruncateDesc && !isDescExpanded) 
    ? companyDesc.substring(0, DESC_LIMIT) + '...' 
    : companyDesc;

  return (
    <div className="card p-0 flex-col" style={{ position: 'relative', height: '100%', overflowY: 'auto' }}>
      
      {/* HEADER SECTION (Sticky) */}
      <div className="p-32" style={{ position: 'sticky', top: 0, backgroundColor: 'var(--card-bg)', zIndex: 10, borderBottom: '1px solid var(--border-color)', borderTopLeftRadius: 'inherit', borderTopRightRadius: 'inherit' }}>
        
        {(isAdmin || showCompanyActions) && (
          <div className="flex-row gap-16 mb-24 flex-wrap" style={{ justifyContent: 'flex-end', alignItems: 'center' }}>
            {isAdmin && selectedJob.status === 'Pending' && handleUpdateJobStatus && (
              <>
                <button onClick={() => handleUpdateJobStatus(selectedJob.id, 'Approved')} style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', padding: '8px 16px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>Approve Post</button>
                <button onClick={() => handleUpdateJobStatus(selectedJob.id, 'Rejected')} style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', padding: '8px 16px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>Reject</button>
              </>
            )}

            {showCompanyActions && (
              <button 
                onClick={() => setIsEditingJob(true)} 
                className="btn-outline"
                disabled={editCount >= 3}
                style={{ opacity: editCount >= 3 ? 0.6 : 1, cursor: editCount >= 3 ? 'not-allowed' : 'pointer' }}
              >
                {editCount >= 3 ? 'Edit Limit Reached' : `Edit (${editCount}/3)`}
              </button>
            )}
            <button onClick={handleDeleteJob} className="btn-danger">Delete</button>
          </div>
        )}

        <div className="flex-between-start mb-16">
          <h1 className="m-0 flex-row align-center gap-16 flex-wrap" style={{ fontSize: '2.2rem', paddingRight: '16px', lineHeight: '1.2' }}>
            {selectedJob.title}
            
            {(isAdmin || showCompanyActions) && <StatusBadge status={selectedJob.status === 'Approved' ? 'Published' : selectedJob.status} />}
          </h1>
          
          <div className="text-right mt-8" style={{ flexShrink: 0 }}>
            <span className="text-sm text-secondary block font-bold">
              Posted: {new Date(selectedJob.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
            </span>
            {isAdmin && editCount > 0 && <span className="text-sm text-secondary block" style={{ fontStyle: 'italic', marginTop: '8px' }}>(Edited {editCount}/3)</span>}
          </div>
        </div>
        
        <div className="text-secondary mb-32 flex-row gap-16 align-center flex-wrap" style={{ fontSize: '1.15rem', fontWeight: '500' }}>
          <span>{selectedJob.company}{selectedJob.location && ` • ${selectedJob.location}`}</span>
          {selectedJob.is_deaf_accessible && <DeafAccessibleBadge size="md" showText={true} />}
        </div>
        
        {(isAdmin || showCompanyActions) && selectedJob.applicantCount !== undefined ? (
          <div className="flex-col gap-16">
            <button className="btn-black w-full p-16 text-lg" onClick={() => navigate('/applicants', { state: { filterJobId: selectedJob.id } })} disabled={selectedJob.applicantCount === 0} style={{ opacity: selectedJob.applicantCount === 0 ? 0.5 : 1 }}>
              {selectedJob.applicantCount === 0 ? 'No Applicants Yet' : `Review ${selectedJob.applicantCount} Applicants`}
            </button>
          </div>
        ) : (role !== 'company' && role !== 'admin') ? (
          <div className="flex-col gap-16 mt-8">
            <button className={`btn-apply ${hasApplied ? 'success' : ''}`} style={{ padding: '14px' }} onClick={handleApply} disabled={isApplying || hasApplied || ['pending_user', 'rejected_user'].includes(role)}>
              {isApplying ? 'Sending Application...' : hasApplied ? 'Application Sent' : (['pending_user', 'rejected_user'].includes(role)) ? 'Approval Required to Apply' : 'Apply Now'}
            </button>
            <button className="btn-outline w-full" style={{ padding: '14px' }} onClick={handleSaveJob} disabled={isSaving}>
              {isSaving ? 'Processing...' : isSaved ? 'Saved' : 'Save for Later'}
            </button>
          </div>
        ) : null}
      </div>

      {/* BODY SECTION */}
      <div className="p-32" style={{ flex: 1 }}>
        
        <h3 className="mb-24 m-0" style={{ fontSize: '1.5rem' }}>Job Details</h3>
        
        <div className="sub-card mb-40" style={{ padding: '24px' }}>
          {selectedJob.pay && (
            <div className="mb-24">
              <div className="font-bold mb-16 text-primary" style={{ fontSize: '1.3rem' }}>Pay</div>
              <div className="flex-row-wrap gap-16">
                <span className="badge badge-neutral" style={{ padding: '10px 20px', fontSize: '1rem', borderRadius: '4px' }}>
                  {selectedJob.pay} <span className="text-secondary font-medium" style={{ marginLeft: '8px' }}>{selectedJob.pay_rate}</span>
                </span>
              </div>
            </div>
          )}
          <div>
            <div className="font-bold mb-16 text-primary" style={{ fontSize: '1.3rem' }}>Job Type</div>
            <div className="flex-row-wrap gap-16">
              <span className="badge badge-neutral" style={{ padding: '10px 20px', fontSize: '1rem', borderRadius: '4px' }}>{selectedJob.type}</span>
              <span className="badge badge-neutral" style={{ padding: '10px 20px', fontSize: '1rem', borderRadius: '4px' }}>{selectedJob.work_model || 'On-site'}</span>
            </div>
          </div>
        </div>

        {selectedJob.location && (
          <div className="mb-40">
            <h3 className="mb-16 m-0" style={{ fontSize: '1.5rem' }}>Location</h3>
            <div className="sub-card" style={{ padding: '20px 24px' }}>
              <p className="text-secondary m-0 text-lg font-medium" style={{ lineHeight: '1.8' }}>{selectedJob.location}</p>
            </div>
          </div>
        )}

        <div className="mb-40">
          <h3 className="mb-16 m-0" style={{ fontSize: '1.5rem' }}>Job Description</h3>
          <p className="m-0 text-secondary" style={{ lineHeight: '1.8', whiteSpace: 'pre-wrap', fontSize: '1.1rem' }}>
            {selectedJob.description}
          </p>
        </div>

        {selectedJob.skills && selectedJob.skills.length > 0 && (
          <div className="mb-40">
            <h3 className="mb-16 m-0" style={{ fontSize: '1.5rem' }}>Required Skills</h3>
            <div className="flex-row-wrap gap-16">
              {selectedJob.skills.map((skill, index) => (
                <SkillBadge key={skill.id || index} skill={skill} />
              ))}
            </div>
          </div>
        )}

        {selectedCompany && !showCompanyActions && (
          <div className="sub-card mt-32 mb-16" style={{ padding: '32px' }}>
            
            <h3 className="m-0 mb-24" style={{ fontSize: '1.5rem' }}>About Company</h3>

            <div className="flex-row gap-24 align-start mb-32">
              <Avatar src={selectedCompany.logo_url} fallbackName={selectedCompany.name} size="lg" type="company" customStyle={{ width: '64px', height: '64px' }} />
              <div style={{ flex: 1 }}>
                <h4 className="m-0 mb-12 flex-row align-center gap-12 flex-wrap" style={{ fontSize: '1.4rem' }}>
                  {selectedCompany.name}
                  {selectedCompany.is_deaf_accessible && <DeafAccessibleBadge size="sm" showText={true} />}
                </h4>
                <p className="text-md text-secondary m-0" style={{ lineHeight: '1.6' }}>{formatLocation(selectedCompany.city, selectedCompany.address, "Location not specified")}</p>
              </div>
            </div>

            {companyDesc && (
              <div className="mb-32">
                <p className="text-secondary m-0" style={{ lineHeight: '1.8', fontSize: '1.05rem', whiteSpace: 'pre-wrap' }}>
                  {displayDesc}
                </p>
                {shouldTruncateDesc && (
                  <button 
                    onClick={() => setIsDescExpanded(!isDescExpanded)}
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      color: 'var(--primary-color)', 
                      fontWeight: '700', 
                      padding: '12px 0 0 0', 
                      cursor: 'pointer',
                      fontSize: '1rem'
                    }}
                  >
                    {isDescExpanded ? 'Show Less' : 'Read More...'}
                  </button>
                )}
              </div>
            )}

            <button className="btn-outline w-full" style={{ padding: '12px' }} onClick={() => navigate(`/company/${selectedCompany.id}`)}>
              View Full Company Profile
            </button>
          </div>
        )}
      </div>
    </div>
  );
}