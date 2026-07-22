import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import JobCard from '../components/jobs/JobCard';

import StatusBadge from '../components/common/StatusBadge';
import { formatStandardDate } from '../utils/dateUtils';

export default function UserJobs() {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  
  const [applications, setApplications] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState('Applied');

  // States for the feedback modal
  const [feedbackApp, setFeedbackApp] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

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
      .select('*, jobs(*, locations(city), companies(name, logo_url, is_deaf_accessible), job_skills(skills(id, name)))')
      .eq('applicant_id', user.id)
      .order('created_at', { ascending: false });

    if (appsData) {
      const mappedApps = appsData.map(app => ({
        ...app,
        job: {
          ...app.jobs,
          location: app.jobs.locations?.city || '',
          skills: app.jobs.job_skills ? app.jobs.job_skills.map(js => ({ id: js.skills.id, name: js.skills.name })) : [],
          company: app.jobs.companies?.name || 'Unknown Company',
          is_deaf_accessible: app.jobs.companies?.is_deaf_accessible || false,
          date: formatStandardDate(app.jobs.created_at)
        }
      }));
      setApplications(mappedApps);
    }

    const { data: savedData } = await supabase
      .from('saved_jobs')
      .select('*, jobs(*, locations(city), companies(name, logo_url, is_deaf_accessible), job_skills(skills(id, name)))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (savedData) {
      const mappedSaved = savedData.map(saved => ({
        ...saved,
        job: {
          ...saved.jobs,
          location: saved.jobs.locations?.city || '',
          skills: saved.jobs.job_skills ? saved.jobs.job_skills.map(js => ({ id: js.skills.id, name: js.skills.name })) : [],
          company: saved.jobs.companies?.name || 'Unknown Company',
          is_deaf_accessible: saved.jobs.companies?.is_deaf_accessible || false,
          date: formatStandardDate(saved.jobs.created_at)
        }
      }));
      setSavedJobs(mappedSaved);
    }

    setIsLoading(false);
  }

  // Handle feedback submission using exact database schema
  async function handleSubmitFeedback(e) {
    e.preventDefault();
    setIsSubmittingFeedback(true);
    try {
      const { error } = await supabase.from('feedbacks').insert([{
        user_id: user.id,
        title: `Hired: ${feedbackApp.job?.title} at ${feedbackApp.job?.company}`,
        purpose: `Company Rating: ${rating}/5`,
        message: comment
      }]);
      
      if (error) throw error;
      
      alert('Thank you! Your feedback has been submitted successfully.');
      setFeedbackApp(null);
      setRating(5);
      setComment('');
    } catch (error) {
      console.error("Failed to submit feedback:", error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmittingFeedback(false);
    }
  }

  let displayList = [];
  if (activeTab === 'Saved') {
    displayList = savedJobs;
  } else if (activeTab === 'Applied') {
    displayList = applications;
  } else if (activeTab === 'Interviews') { 
    displayList = applications.filter(app => app.status === 'Interviewing' || app.status === 'Approved');
  } else if (activeTab === 'Hired') {
    displayList = applications.filter(app => app.status === 'Hired');
  } else if (activeTab === 'Archived') {
    displayList = applications.filter(app => app.status === 'Rejected' || app.status === 'Archived');
  }

  const tabs = ['Saved', 'Applied', 'Interviews', 'Hired', 'Archived'];

  return (
    <div className="page-container-wide">
      
      <div className="flex-between align-center mb-24">
        <button className="btn-outline btn-sm" onClick={() => navigate('/jobs')}>
          Find More Jobs
        </button>
      </div>

      <div className="flex-row gap-8 mb-32" style={{ overflowX: 'auto', borderBottom: '1px solid var(--border-color)' }}>
        {tabs.map(tab => {
          let count = 0;
          if (tab === 'Saved') count = savedJobs.length;
          if (tab === 'Applied') count = applications.length;
          if (tab === 'Interviews') count = applications.filter(a => a.status === 'Interviewing' || a.status === 'Approved').length;
          if (tab === 'Hired') count = applications.filter(a => a.status === 'Hired').length;
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
            <div key={item.id} className="flex-col" style={{ position: 'relative', gap: '12px' }}>
              
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
              
              {activeTab === 'Hired' && (
                <button 
                  className="btn-outline w-full" 
                  style={{ background: 'var(--card-bg)', border: '1px solid var(--primary-color)', color: 'var(--primary-color)', padding: '10px' }}
                  onClick={() => setFeedbackApp(item)}
                >
                  ⭐️ Leave Feedback
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center text-secondary p-32 mt-32">
          <h3 className="mb-8">No {activeTab.toLowerCase()} jobs</h3>
          <p>You don't have any jobs in this category yet.</p>
        </div>
      )}

      {/* Feedback Submission Modal */}
      {feedbackApp && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="card p-24" style={{ width: '100%', maxWidth: '400px', background: 'var(--card-bg)' }}>
            <h3 className="m-0 mb-16">Leave Feedback</h3>
            <p className="text-sm text-secondary mb-16" style={{ lineHeight: '1.5' }}>
              How was your experience getting hired for <strong>{feedbackApp.job?.title}</strong> at <strong>{feedbackApp.job?.company}</strong>?
            </p>
            
            <form onSubmit={handleSubmitFeedback} className="flex-col gap-16">
              <div>
                <label className="block mb-8 font-bold text-sm">Rating (1-5)</label>
                <input 
                  type="number" min="1" max="5" 
                  value={rating} 
                  onChange={(e) => setRating(e.target.value)} 
                  className="search-input w-full" 
                  required 
                />
              </div>
              <div>
                <label className="block mb-8 font-bold text-sm">Comments</label>
                <textarea 
                  value={comment} 
                  onChange={(e) => setComment(e.target.value)} 
                  className="search-input w-full" 
                  rows="4" 
                  required 
                  placeholder="Share your experience working with this company..." 
                />
              </div>
              <div className="flex-row gap-8 mt-8">
                <button type="submit" className="btn-black flex-1" disabled={isSubmittingFeedback}>
                  {isSubmittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                </button>
                <button type="button" className="btn-outline flex-1" onClick={() => setFeedbackApp(null)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}