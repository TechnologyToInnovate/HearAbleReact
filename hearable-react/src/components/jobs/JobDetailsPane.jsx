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
  setIsEditingJob, navigate, handleUpdateJobStatus,
  handleClose 
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
      
      {/* HEADER SECTION */}
      <div className="p-24" style={{ position: 'sticky', top: 0, backgroundColor: 'var(--card-bg)', zIndex: 10, borderBottom: '1px solid var(--border-color)', borderTopLeftRadius: 'inherit', borderTopRightRadius: 'inherit' }}>
        
        <button 
          className="btn-outline mobile-back-btn" 
          onClick={handleClose}
        >
          ← Back to Jobs
        </button>

        {(isAdmin || showCompanyActions) && (
          <div className="flex-row mb-20 flex-wrap mobile-action-group" style={{ justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            
            <div style={{ flexShrink: 0, marginRight: '16px' }}>
              <StatusBadge status={selectedJob.status === 'Approved' ? 'Published' : selectedJob.status} />
            </div>

            <div className="flex-row gap-12 align-center flex-wrap" style={{ justifyContent: 'flex-end', flex: 1 }}>
              {isAdmin && selectedJob.status === 'Pending' && handleUpdateJobStatus && (
                <>
                  <button onClick={() => handleUpdateJobStatus(selectedJob.id, 'Approved')} style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', padding: '6px 12px', fontSize: '0.85rem', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>Approve Post</button>
                  <button onClick={() => handleUpdateJobStatus(selectedJob.id, 'Rejected')} style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', padding: '6px 12px', fontSize: '0.85rem', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>Reject</button>
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
          </div>
        )}

        <div className="flex-between-start mb-12">
          <h1 className="m-0" style={{ fontSize: '1.75rem', paddingRight: '16px', lineHeight: '1.2' }}>
            {selectedJob.title}
          </h1>
          
          <div className="text-right mt-4" style={{ flexShrink: 0 }}>
            <span className="text-sm text-secondary block font-bold">
              Posted: {new Date(selectedJob.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
            </span>
            {isAdmin && editCount > 0 && <span className="text-sm text-secondary block" style={{ fontStyle: 'italic', marginTop: '4px' }}>(Edited {editCount}/3)</span>}
          </div>
        </div>
        
        {/* 🚨 UPDATED: Applied a stricter maxWidth to hide the name slightly more in the details pane */}
        <div className="text-secondary mb-24 flex-row gap-8 align-center" style={{ fontSize: '1rem', fontWeight: '500', width: '100%', minWidth: 0 }}>
          
          <div 
            style={{ 
              whiteSpace: 'nowrap', 
              overflow: 'hidden', 
              textOverflow: 'ellipsis', 
              maxWidth: '45%' // Forces the text to truncate earlier
            }}
            title={selectedJob.company} // Shows the full name on hover!
          >
            {selectedJob.company}
          </div>
          
          {selectedJob.location && (
            <div style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
              • {selectedJob.location}
            </div>
          )}
          
          {selectedJob.is_deaf_accessible && (
            <div style={{ flexShrink: 0 }}>
              <DeafAccessibleBadge size="sm" showText={true} />
            </div>
          )}
          
        </div>
        
        {(isAdmin || showCompanyActions) && selectedJob.applicantCount !== undefined ? (
          <div className="flex-col gap-12">
            <button className="btn-black w-full" style={{ padding: '10px 16px', fontSize: '0.95rem' }} onClick={() => navigate('/applicants', { state: { filterJobId: selectedJob.id } })} disabled={selectedJob.applicantCount === 0} style={{ opacity: selectedJob.applicantCount === 0 ? 0.5 : 1 }}>
              {selectedJob.applicantCount === 0 ? 'No Applicants Yet' : `Review ${selectedJob.applicantCount} Applicants`}
            </button>
          </div>
        ) : (role !== 'company' && role !== 'admin') ? (
          <div className="flex-col gap-12 mt-8">
            <button className={`btn-apply ${hasApplied ? 'success' : ''}`} style={{ padding: '10px 16px', fontSize: '0.95rem' }} onClick={handleApply} disabled={isApplying || hasApplied || ['pending_user', 'rejected_user'].includes(role)}>
              {isApplying ? 'Sending Application...' : hasApplied ? 'Application Sent' : (['pending_user', 'rejected_user'].includes(role)) ? 'Approval Required to Apply' : 'Apply Now'}
            </button>
            <button className="btn-outline w-full" style={{ padding: '10px 16px', fontSize: '0.95rem' }} onClick={handleSaveJob} disabled={isSaving}>
              {isSaving ? 'Processing...' : isSaved ? 'Saved' : 'Save for Later'}
            </button>
          </div>
        ) : null}
      </div>

      {/* BODY SECTION */}
      <div className="p-24" style={{ flex: 1 }}>
        
        <h3 className="mb-16 m-0" style={{ fontSize: '1.2rem' }}>Job Details</h3>
        
        <div className="sub-card mb-32" style={{ padding: '20px' }}>
          {selectedJob.pay && (
            <div className="mb-20">
              <div className="font-bold mb-12 text-primary" style={{ fontSize: '1.05rem' }}>Pay</div>
              <div className="flex-row-wrap gap-12">
                <span className="badge badge-neutral" style={{ padding: '6px 12px', fontSize: '0.85rem', borderRadius: '4px' }}>
                  {selectedJob.pay} <span className="text-secondary font-medium" style={{ marginLeft: '6px' }}>{selectedJob.pay_rate}</span>
                </span>
              </div>
            </div>
          )}
          <div>
            <div className="font-bold mb-12 text-primary" style={{ fontSize: '1.05rem' }}>Job Type</div>
            <div className="flex-row-wrap gap-12">
              <span className="badge badge-neutral" style={{ padding: '6px 12px', fontSize: '0.85rem', borderRadius: '4px' }}>{selectedJob.type}</span>
              <span className="badge badge-neutral" style={{ padding: '6px 12px', fontSize: '0.85rem', borderRadius: '4px' }}>{selectedJob.work_model || 'On-site'}</span>
            </div>
          </div>
        </div>

        {selectedJob.location && (
          <div className="mb-32">
            <h3 className="mb-12 m-0" style={{ fontSize: '1.2rem' }}>Location</h3>
            <div className="sub-card" style={{ padding: '16px 20px' }}>
              <p className="text-secondary m-0 text-base font-medium" style={{ lineHeight: '1.6' }}>{selectedJob.location}</p>
            </div>
          </div>
        )}

        <div className="mb-32">
          <h3 className="mb-12 m-0" style={{ fontSize: '1.2rem' }}>Job Description</h3>
          <p className="m-0 text-secondary" style={{ lineHeight: '1.6', whiteSpace: 'pre-wrap', fontSize: '0.95rem' }}>
            {selectedJob.description}
          </p>
        </div>

        {selectedJob.skills && selectedJob.skills.length > 0 && (
          <div className="mb-32">
            <h3 className="mb-12 m-0" style={{ fontSize: '1.2rem' }}>Required Skills</h3>
            <div className="flex-row-wrap gap-12">
              {selectedJob.skills.map((skill, index) => (
                <SkillBadge key={skill.id || index} skill={skill} />
              ))}
            </div>
          </div>
        )}

        {selectedCompany && !showCompanyActions && (
          <div className="sub-card mt-24 mb-16" style={{ padding: '24px', position: 'relative' }}>
            
            {selectedCompany.is_deaf_accessible && (
              <div style={{ position: 'absolute', top: '24px', right: '24px' }}>
                <DeafAccessibleBadge size="sm" showText={true} />
              </div>
            )}

            <h3 className="m-0 mb-20" style={{ fontSize: '1.2rem', paddingRight: selectedCompany.is_deaf_accessible ? '140px' : '0' }}>
              About Company
            </h3>

            <div className="flex-row gap-16 align-start mb-24">
              <Avatar src={selectedCompany.logo_url} fallbackName={selectedCompany.name} size="md" type="company" customStyle={{ width: '48px', height: '48px', flexShrink: 0 }} />
              
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 
                  className="m-0 mb-8" 
                  style={{ 
                    fontSize: '1.15rem', 
                    whiteSpace: 'nowrap', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis' 
                  }}
                  title={selectedCompany.name}
                >
                  {selectedCompany.name}
                </h4>
                <p className="text-sm text-secondary m-0" style={{ lineHeight: '1.5' }}>{formatLocation(selectedCompany.city, selectedCompany.address, "Location not specified")}</p>
              </div>
            </div>

            {companyDesc && (
              <div className="mb-24">
                <p className="text-secondary m-0" style={{ lineHeight: '1.6', fontSize: '0.95rem', whiteSpace: 'pre-wrap' }}>
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
                      padding: '8px 0 0 0', 
                      cursor: 'pointer',
                      fontSize: '0.9rem'
                    }}
                  >
                    {isDescExpanded ? 'Show Less' : 'Read More...'}
                  </button>
                )}
              </div>
            )}

            <button className="btn-outline w-full btn-sm" style={{ padding: '8px 12px' }} onClick={() => navigate(`/company/${selectedCompany.id}`)}>
              View Full Company Profile
            </button>
          </div>
        )}
      </div>
    </div>
  );
}