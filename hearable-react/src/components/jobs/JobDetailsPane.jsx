import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient'; 

import SkillBadge from '../common/SkillBadge'; 
import StatusBadge from '../common/StatusBadge';
import DeafAccessibleBadge from '../common/DeafAccessibleBadge';
import Avatar from '../common/Avatar';
import { formatLocation } from '../../utils/formatUtils';

export default function JobDetailsPane({
  selectedJob, selectedCompany, role, currentUser,
  isApplying, hasApplied, applicationStatus, isSaved, isSaving, 
  handleApply, handleSaveJob, handleDeleteJob,
  setIsEditingJob, navigate, handleUpdateJobStatus,
  handleWithdrawApplication,
  handleClose,
  initialOpenJobDesc, 
  initialOpenCompDesc
}) {
  const [isDescExpanded, setIsDescExpanded] = useState(initialOpenCompDesc || false);
  const [isJobDescExpanded, setIsJobDescExpanded] = useState(initialOpenJobDesc || false);

  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackTitle, setFeedbackTitle] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const typeRef = useRef(null);
  const descriptionRef = useRef(null);
  const skillsRef = useRef(null);
  const companyRef = useRef(null);

  useEffect(() => {
    setIsDescExpanded(initialOpenCompDesc || false);
    setIsJobDescExpanded(initialOpenJobDesc || false);
  }, [selectedJob?.id, initialOpenCompDesc, initialOpenJobDesc]);

  if (!selectedJob) return null;

  const isOwner = currentUser && selectedJob.company_id === currentUser.id;
  const isAdmin = role === 'admin';
  const isGuest = role === 'guest';
  const editCount = selectedJob.edit_count || 0;
  const showCompanyActions = role === 'company' && isOwner;

  const companyNameToDisplay = isGuest 
    ? (selectedCompany?.industry || 'Confidential Industry') 
    : (selectedCompany?.name || 'Unknown Company');

  const JOB_DESC_LIMIT = 150;
  const jobDesc = selectedJob.description || '';
  const shouldTruncateJob = jobDesc.length > JOB_DESC_LIMIT;

  const companyDesc = selectedCompany?.description || '';
  const DESC_LIMIT = 200;
  const shouldTruncateDesc = !isGuest && companyDesc.length > DESC_LIMIT;
  const displayDesc = (shouldTruncateDesc && !isDescExpanded) 
    ? companyDesc.substring(0, DESC_LIMIT) + '...' 
    : companyDesc;

  const isDeadlinePassed = selectedJob.closing_date 
    ? new Date(selectedJob.closing_date) < new Date(new Date().setHours(0,0,0,0)) 
    : false;

  const accessData = selectedCompany || {};
  const hasDeafBadge = accessData.has_interpreters || accessData.has_trained_staff || accessData.has_visual_alarms || accessData.has_captioning;

  const scrollToSection = (ref) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const navSections = [];
  navSections.push({ id: 1, title: 'Job Type', ref: typeRef });
  navSections.push({ id: navSections.length + 1, title: 'Job Description', ref: descriptionRef });
  
  if (selectedJob.skills && selectedJob.skills.length > 0) {
    navSections.push({ id: navSections.length + 1, title: 'Required Skills', ref: skillsRef });
  }
  
  if (selectedCompany && !showCompanyActions) {
    navSections.push({ id: navSections.length + 1, title: 'About The Company', ref: companyRef });
  }

  const isInterviewStage = applicationStatus && applicationStatus.toLowerCase().includes('interview');

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackMessage.trim() || !feedbackTitle.trim()) return;

    setIsSubmittingFeedback(true);
    
    const finalMessage = `${feedbackMessage.trim()}\n\n---\n📌 Job Title: ${selectedJob.title}\n[JobID:${selectedJob.id}]`;

    const { error } = await supabase.from('feedbacks').insert([{
      user_id: currentUser.id,
      title: feedbackTitle.trim(),
      purpose: 'Jobs', 
      message: finalMessage
    }]);

    if (!error) {
      alert('Thank you for your feedback!');
      setShowFeedbackModal(false);
      setFeedbackTitle('');
      setFeedbackMessage('');
    } else {
      alert('Failed to send feedback. Please try again.');
      console.error(error);
    }
    setIsSubmittingFeedback(false);
  };

  return (
    <div className="card p-0 flex-col" style={{ position: 'relative', height: '100%', overflowY: 'auto' }}>
      
      <div className="p-24" style={{ position: 'sticky', top: 0, backgroundColor: 'var(--card-bg)', zIndex: 10, borderBottom: '1px solid var(--border-color)', borderTopLeftRadius: 'inherit', borderTopRightRadius: 'inherit' }}>
        
        <button 
          className="btn-outline mobile-back-btn" 
          onClick={handleClose}
          title="Return to job list"
        >
          ← Back to Jobs
        </button>

        {(isAdmin || showCompanyActions) && (
          <div className="flex-row mb-20 flex-wrap mobile-action-group" style={{ justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            
            <div style={{ flexShrink: 0, marginRight: '16px' }} title={`Current job status is ${selectedJob.status}`}>
              <StatusBadge status={selectedJob.status === 'Approved' ? 'Published' : selectedJob.status} />
            </div>

            <div className="flex-row gap-12 align-center flex-wrap" style={{ justifyContent: 'flex-end', flex: 1 }}>
              {isAdmin && selectedJob.status === 'Pending' && handleUpdateJobStatus && (
                <>
                  <button title="Approve and publish this job to the public" onClick={() => handleUpdateJobStatus(selectedJob.id, 'Approved')} style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', padding: '6px 12px', fontSize: '0.85rem', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>Approve Post</button>
                  <button title="Reject this job posting" onClick={() => handleUpdateJobStatus(selectedJob.id, 'Rejected')} style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', padding: '6px 12px', fontSize: '0.85rem', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>Reject</button>
                </>
              )}

              {/* 🚨 REMOVED: Repost Job Button Logic from here */}

              {showCompanyActions && setIsEditingJob && (
                <button 
                  title={editCount >= 3 ? "You have reached the maximum allowed edits (3)" : `You have ${3 - editCount} edits remaining for this posting`}
                  onClick={() => setIsEditingJob(true)} 
                  className="btn-outline btn-sm"
                  disabled={editCount >= 3}
                  style={{ opacity: editCount >= 3 ? 0.6 : 1, cursor: editCount >= 3 ? 'not-allowed' : 'pointer' }}
                >
                  {editCount >= 3 ? 'Edit Limit Reached' : `Edit (${editCount}/3)`}
                </button>
              )}
              <button title="Permanently delete this job posting" onClick={handleDeleteJob} className="btn-danger btn-sm">Delete</button>
            </div>
          </div>
        )}

        <div className="flex-between-start mb-12 mobile-stack">
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
        
        <div className="text-secondary mb-16 flex-row gap-8 align-center" style={{ fontSize: '1rem', fontWeight: '500', width: '100%', minWidth: 0 }}>
          {isGuest ? (
            <span style={{ fontStyle: 'italic', color: 'var(--secondary-text)' }}>
              Sign in to view company details and location
            </span>
          ) : (
            <>
              <div 
                style={{ 
                  whiteSpace: 'nowrap', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis', 
                  maxWidth: '45%'
                }}
                title={companyNameToDisplay}
              >
                {companyNameToDisplay}
              </div>
              
              {selectedJob.location && (
                <div style={{ whiteSpace: 'nowrap', flexShrink: 0 }} title="Job Location">
                  • {selectedJob.location}
                </div>
              )}
              
              {hasDeafBadge && (
                <div style={{ flexShrink: 0 }}>
                  <DeafAccessibleBadge size="sm" showText={true} features={accessData} isAccessible={hasDeafBadge} />
                </div>
              )}
            </>
          )}
        </div>

        {(isAdmin || showCompanyActions) && (selectedJob.closing_date || selectedJob.max_employees) && (
          <div className="flex-row gap-12 mb-24 flex-wrap">
            {selectedJob.closing_date && (
              <span title={`Applications close on ${new Date(selectedJob.closing_date).toLocaleDateString()}`} style={{ 
                background: isDeadlinePassed ? '#fef2f2' : 'var(--bg-color)', 
                color: isDeadlinePassed ? '#dc2626' : 'var(--text-color)', 
                border: `1px solid ${isDeadlinePassed ? '#fecaca' : 'var(--border-color)'}`,
                padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600' 
              }}>
                ⏳ Deadline: {new Date(selectedJob.closing_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
            )}
            
            {selectedJob.max_employees && (
              <span title={`This company is looking to hire ${selectedJob.max_employees} employees for this role`} style={{ 
                background: 'var(--bg-color)', border: '1px solid var(--border-color)', 
                padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600' 
              }}>
                👥 Openings: {selectedJob.max_employees}
              </span>
            )}
          </div>
        )}
        
        {(isAdmin || showCompanyActions) && selectedJob.applicantCount !== undefined ? (
          <div className="flex-col gap-12">
            <button className="btn-black w-full" style={{ padding: '10px 16px', fontSize: '0.95rem' }} onClick={() => navigate('/applicants', { state: { filterJobId: selectedJob.id } })} disabled={selectedJob.applicantCount === 0} style={{ opacity: selectedJob.applicantCount === 0 ? 0.5 : 1 }}>
              {selectedJob.applicantCount === 0 ? 'No Applicants Yet' : `Review ${selectedJob.applicantCount} Applicants`}
            </button>
          </div>
        ) : (role !== 'company' && role !== 'admin') ? (
          <div className="flex-row gap-12 mt-8 mobile-action-group">
            {hasApplied ? (
              isInterviewStage ? (
                <button 
                  className="btn-black" 
                  style={{ flex: 1, padding: '10px 16px', fontSize: '0.95rem' }} 
                  onClick={() => setShowFeedbackModal(true)} 
                  title="Leave feedback about the interview process"
                >
                  Leave Feedback
                </button>
              ) : (
                <button 
                  className="btn-danger" 
                  style={{ flex: 1, padding: '10px 16px', fontSize: '0.95rem', opacity: isApplying ? 0.7 : 1 }} 
                  onClick={handleWithdrawApplication} 
                  disabled={isApplying}
                  title="Click to cancel and withdraw your submitted application"
                >
                  {isApplying ? 'Processing...' : 'Withdraw Application'}
                </button>
              )
            ) : (
              <button 
                className={`btn-apply`} 
                style={{ flex: 1, padding: '10px 16px', fontSize: '0.95rem' }} 
                onClick={handleApply} 
                disabled={isApplying || isDeadlinePassed || ['pending_user', 'rejected_user'].includes(role)}
                title={isDeadlinePassed ? "The deadline for this job has passed" : ['pending_user', 'rejected_user'].includes(role) ? "You must be an approved user to apply" : "Submit your application"}
              >
                {isApplying ? 'Processing...' : isDeadlinePassed ? 'Applications Closed' : (['pending_user', 'rejected_user'].includes(role)) ? 'Approval Required to Apply' : 'Apply Now'}
              </button>
            )}

            <button 
              className="btn-outline" 
              style={{ flex: 1, padding: '10px 16px', fontSize: '0.95rem' }} 
              onClick={handleSaveJob} 
              disabled={isSaving}
              title={isSaved ? "Remove this job from your saved list" : "Bookmark this job to view later"}
            >
              {isSaving ? 'Processing...' : isSaved ? 'Saved' : 'Save for Later'}
            </button>
          </div>
        ) : null}
      </div>

      <div style={{ display: 'flex', flex: 1 }}>
        <div className="p-24" style={{ flex: 1, minWidth: 0 }}>
          
          <h3 className="mb-16 m-0" style={{ fontSize: '1.2rem' }}>Job Details</h3>
          
          <div className="sub-card mb-32" style={{ padding: '20px' }}>
            {selectedJob.pay && (
              <div className="mb-20">
                <div className="font-bold mb-12 text-primary" style={{ fontSize: '1.05rem' }}>Pay</div>
                <div className="flex-row-wrap gap-12">
                  <span className="badge badge-neutral" style={{ 
                    padding: '6px 12px', fontSize: '0.85rem', borderRadius: '4px',
                    filter: selectedJob.pay_blurred ? 'blur(5px)' : 'none', 
                    userSelect: selectedJob.pay_blurred ? 'none' : 'auto' 
                  }}>
                    {selectedJob.pay_blurred ? '$$$,$$$ - $$$,$$$' : `${selectedJob.pay} ${selectedJob.pay_rate}`}
                  </span>
                </div>
              </div>
            )}
            <div>
              <div className="font-bold mb-12 text-primary" style={{ fontSize: '1.05rem', scrollMarginTop: '250px' }} ref={typeRef}>Job Type</div>
              <div className="flex-row-wrap gap-12">
                <span className="badge badge-neutral" title="Employment Type" style={{ padding: '6px 12px', fontSize: '0.85rem', borderRadius: '4px' }}>{selectedJob.type}</span>
                <span className="badge badge-neutral" title="Work Setup" style={{ padding: '6px 12px', fontSize: '0.85rem', borderRadius: '4px' }}>{selectedJob.work_model || 'On-site'}</span>
              </div>
            </div>
          </div>

          {!isGuest && selectedJob.location && (
            <div className="mb-32">
              <h3 className="mb-12 m-0" style={{ fontSize: '1.2rem' }}>Location</h3>
              <div className="sub-card" style={{ padding: '16px 20px' }}>
                <p className="text-secondary m-0 text-base font-medium" style={{ lineHeight: '1.6' }}>{selectedJob.location}</p>
              </div>
            </div>
          )}

          <div className="mb-32">
            <h3 className="mb-12 m-0" style={{ fontSize: '1.2rem', scrollMarginTop: '250px' }} ref={descriptionRef}>Job Description</h3>
            <p className="m-0 text-secondary" style={{ lineHeight: '1.6', whiteSpace: 'pre-wrap', fontSize: '0.95rem' }}>
              {shouldTruncateJob && !isJobDescExpanded 
                ? jobDesc.substring(0, JOB_DESC_LIMIT) + '...' 
                : jobDesc}
            </p>
            
            {shouldTruncateJob && (
              <button 
                onClick={() => {
                  if (isGuest) {
                    navigate('/login', { state: { returnTo: `/jobs`, returnState: { selectedJobId: selectedJob.id, openJobDesc: true } } });
                  } else {
                    setIsJobDescExpanded(!isJobDescExpanded);
                  }
                }}
                style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontWeight: '700', padding: '8px 0 0 0', cursor: 'pointer', fontSize: '0.9rem' }}
              >
                {isGuest ? 'Read More...' : (isJobDescExpanded ? 'Show Less' : 'Read More...')}
              </button>
            )}
          </div>

          {selectedJob.skills && selectedJob.skills.length > 0 && (
            <div className="mb-32">
              <h3 className="mb-12 m-0" style={{ fontSize: '1.2rem', scrollMarginTop: '250px' }} ref={skillsRef}>Required Skills</h3>
              <div className="flex-row-wrap gap-12">
                {selectedJob.skills.map((skill, index) => (
                  <SkillBadge key={skill.id || index} skill={skill} />
                ))}
              </div>
            </div>
          )}

          {selectedCompany && !showCompanyActions && (
            <div className="sub-card mt-24 mb-16" style={{ padding: '24px', position: 'relative' }}>
              
              <h3 className="m-0" style={{ fontSize: '1.2rem', paddingRight: '140px', scrollMarginTop: '250px' }} ref={companyRef}>
                About The Company
              </h3>
              <div style={{ height: '1px', background: 'var(--border-color)', margin: '16px 0 20px 0' }} />

              {hasDeafBadge && !isGuest && (
                <div style={{ position: 'absolute', top: '24px', right: '24px' }}>
                  <DeafAccessibleBadge size="sm" showText={true} features={accessData} isAccessible={hasDeafBadge} />
                </div>
              )}

              <div className="flex-row gap-16 align-start mb-24">
                <Avatar src={isGuest ? null : selectedCompany.logo_url} fallbackName={companyNameToDisplay} size="md" type="company" customStyle={{ width: '48px', height: '48px', flexShrink: 0 }} />
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 
                    className="m-0 mb-8" 
                    style={{ 
                      fontSize: '1.15rem', 
                      whiteSpace: 'nowrap', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis' 
                    }}
                    title={companyNameToDisplay}
                  >
                    {companyNameToDisplay}
                  </h4>
                  <p className="text-sm text-secondary m-0" style={{ lineHeight: '1.5' }}>
                    {isGuest ? 'Sign in to view location' : formatLocation(selectedCompany.locations?.city, selectedCompany.locations?.country, "Location not specified")}
                  </p>
                </div>
              </div>

              <div className="mb-24">
                <p className="text-secondary m-0" style={{ lineHeight: '1.6', fontSize: '0.95rem', whiteSpace: 'pre-wrap' }}>
                  {isGuest ? 'Sign in or create an account to view full company details and learn more about this employer.' : displayDesc}
                </p>
                {!isGuest && shouldTruncateDesc && (
                  <button 
                    onClick={() => setIsDescExpanded(!isDescExpanded)}
                    title={isDescExpanded ? "Collapse company description" : "Expand company description"}
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

              {!isGuest && (
                <button 
                  className="btn-outline w-full btn-sm" 
                  title="Navigate to company profile page"
                  style={{ padding: '8px 12px' }} 
                  onClick={() => navigate(`/company/${selectedCompany.id}`)}
                >
                  View Full Company Profile
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {showFeedbackModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '20px' }}>
          <div className="card p-0" style={{ width: '100%', maxWidth: '500px', background: 'var(--card-bg)', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="m-0" style={{ fontSize: '1.25rem' }}>Job Feedback</h3>
              <button title="Close" onClick={() => setShowFeedbackModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-color)', lineHeight: 1 }}>&times;</button>
            </div>
            <div style={{ padding: '24px' }}>
              <form onSubmit={handleFeedbackSubmit} className="flex-col gap-16">
                <div>
                  <label className="block mb-8 font-medium">Title</label>
                  <input 
                    type="text" 
                    className="search-input w-full" 
                    placeholder="e.g., Great Interview Process!" 
                    value={feedbackTitle}
                    onChange={(e) => setFeedbackTitle(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block mb-8 font-medium">Details</label>
                  <textarea 
                    className="search-input w-full" 
                    rows="5" 
                    style={{ resize: 'vertical' }}
                    placeholder="Tell us about your experience with this job/interview..." 
                    value={feedbackMessage}
                    onChange={(e) => setFeedbackMessage(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn-black w-full" style={{ padding: '12px', fontSize: '1rem' }} disabled={isSubmittingFeedback}>
                  {isSubmittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}