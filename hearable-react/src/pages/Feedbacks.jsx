import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // 🚨 NEW: Added useNavigate
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { formatStandardDate } from '../utils/dateUtils';

export default function Feedbacks() {
  const { user: currentUser, role } = useAuth();
  const navigate = useNavigate(); // 🚨 NEW: Initialize navigate
  
  const [feedbacks, setFeedbacks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('Jobs');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPurpose, setNewPurpose] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (currentUser) fetchFeedbacks();
  }, [currentUser, role]);

  async function fetchFeedbacks() {
    setIsLoading(true);
    let query = supabase.from('feedbacks').select('*').order('created_at', { ascending: false });
    
    if (role !== 'admin') {
      query = query.eq('user_id', currentUser.id);
    }

    const { data } = await query;
    if (data) setFeedbacks(data);
    setIsLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!newMessage.trim() || !newTitle.trim() || !newPurpose) return;
    
    setIsSubmitting(true);
    
    const { error } = await supabase.from('feedbacks').insert([{ 
      user_id: currentUser.id, 
      title: newTitle.trim(),
      purpose: newPurpose,
      message: newMessage.trim() 
    }]);

    if (!error) {
      setNewTitle('');
      setNewPurpose('');
      setNewMessage('');
      setIsModalOpen(false); 
      
      fetchFeedbacks();
      setActiveTab(newPurpose);
      alert("Thank you for your feedback!");
    } else {
      console.error(error);
      alert("Failed to submit feedback.");
    }
    setIsSubmitting(false);
  }

  async function handleDeleteFeedback(id) {
    if (!window.confirm("Are you sure you want to permanently delete this feedback?")) return;

    const { error } = await supabase.from('feedbacks').delete().eq('id', id);

    if (!error) {
      setFeedbacks(feedbacks.filter(fb => fb.id !== id));
    } else {
      console.error(error);
      alert("Failed to delete feedback.");
    }
  }

  if (role === 'company') {
    return <div className="page-container-wide"><p className="text-center p-32">This page is for standard users and admins only.</p></div>;
  }

  const filteredFeedbacks = feedbacks.filter(fb => fb.purpose === activeTab);

  // 🚨 NEW: Function to render standard http links as clickable tags
  const renderMessageWithLinks = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRegex).map((part, i) => {
      if (part.match(urlRegex)) {
        return <a key={i} href={part} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-color)', textDecoration: 'underline' }}>{part}</a>;
      }
      return part;
    });
  };

  return (
    <div className="page-container">
      
      <div className="flex-between align-center mb-24">
        <h1 className="m-0">{role === 'admin' ? 'All Platform Feedback' : 'My Feedback'}</h1>
        
        {role !== 'admin' && (
          role === 'user' ? (
            <button className="btn-black" onClick={() => setIsModalOpen(true)}>
              + New Feedback
            </button>
          ) : (
            <button 
              className="btn-black" 
              disabled 
              title="Your account must be approved to submit feedback."
              style={{ opacity: 0.6, cursor: 'not-allowed' }}
            >
              + New Feedback 🔒
            </button>
          )
        )}
      </div>

      <div className="flex-row gap-8 mb-24" style={{ overflowX: 'auto', borderBottom: '1px solid var(--border-color)' }}>
        {['Jobs', 'Website'].map(tab => (
          <button
            key={tab} 
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 20px', border: 'none', background: 'none',
              borderBottom: activeTab === tab ? '2px solid var(--primary-color)' : '2px solid transparent',
              color: activeTab === tab ? 'var(--primary-color)' : 'var(--secondary-text)',
              fontWeight: activeTab === tab ? '600' : '400', cursor: 'pointer', fontSize: '1rem',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {isModalOpen && role !== 'admin' && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2 className="m-0">Submit Feedback</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>✕</button>
            </div>
            
            <div className="modal-body">
              <form onSubmit={handleSubmit} className="flex-col gap-24">
                
                <div>
                  <label className="block mb-8 font-bold">Feedback Title *</label>
                  <input 
                    type="text" 
                    className="search-input w-full" 
                    placeholder="e.g. Broken link on homepage" 
                    value={newTitle} 
                    onChange={(e) => setNewTitle(e.target.value)} 
                    required 
                  />
                </div>

                <div>
                  <label className="block mb-8 font-bold">Purpose *</label>
                  <select 
                    className="search-input w-full" 
                    value={newPurpose} 
                    onChange={(e) => setNewPurpose(e.target.value)} 
                    required
                  >
                    <option value="" disabled>Select a category</option>
                    <option value="Jobs">Jobs</option>
                    <option value="Website">Website</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-8 font-bold">Details *</label>
                  <textarea 
                    className="search-input w-full" 
                    style={{ height: '120px', resize: 'vertical' }} 
                    placeholder="Tell us what you love, what's broken, or what we should build next..." 
                    value={newMessage} 
                    onChange={(e) => setNewMessage(e.target.value)} 
                    required 
                  />
                </div>
                
                <div className="divider p-0 m-0 mt-8">
                  <button type="submit" className="btn-black w-full" disabled={isSubmitting}>
                    {isSubmitting ? 'Sending...' : 'Send Feedback'}
                  </button>
                </div>

              </form>
            </div>
          </div>
        </div>
      )}

      {isLoading ? <p className="text-secondary">Loading...</p> : filteredFeedbacks.length > 0 ? (
        <div className="flex-col gap-16">
          {filteredFeedbacks.map(fb => {
            // 🚨 NEW: Parse out the hidden job ID and title tags appended by JobDetailsPane
            const jobIdMatch = fb.message.match(/\[JobID:(\d+)\]/);
            const jobTitleMatch = fb.message.match(/📌 Job Title: (.*)/);
            
            // 🚨 NEW: Remove the tags from the message string so the user only sees their text
            let displayMessage = fb.message;
            if (jobIdMatch) {
              displayMessage = displayMessage.replace(/\n\n---\n📌 Job Title: .*\n\[JobID:\d+\]/, '');
            }

            return (
              <div key={fb.id} className="card p-24">
                <div className="flex-between-start mb-16">
                  <div>
                    <h3 className="m-0 text-lg">{fb.title || 'Untitled Feedback'}</h3>
                    <span 
                      className="badge badge-neutral mt-8" 
                      style={{ display: 'inline-block', backgroundColor: 'var(--bg-color)' }}
                    >
                      Category: {fb.purpose || 'Unspecified'}
                    </span>
                  </div>
                  
                  {role === 'admin' && (
                    <div className="badge badge-neutral" style={{ flexShrink: 0 }}>
                      User ID: {fb.user_id?.substring(0, 8)}...
                    </div>
                  )}
                </div>
                
                <div style={{ height: '1px', background: 'var(--border-color)', marginBottom: '16px' }} />

                <div style={{ backgroundColor: 'var(--bg-color)', padding: '16px', borderRadius: '8px' }}>
                  <p className="m-0" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                    {renderMessageWithLinks(displayMessage)}
                  </p>
                </div>

                {/* 🚨 NEW: If the parser found a Job ID, render the "View Job Post" button! */}
                {jobIdMatch && (
                  <div className="mt-16">
                    <button 
                      className="btn-outline btn-sm"
                      title="Navigate to the job post this feedback refers to"
                      onClick={() => navigate('/jobs', { state: { selectedJobId: parseInt(jobIdMatch[1], 10) } })}
                    >
                      View Job Post: {jobTitleMatch ? jobTitleMatch[1] : 'Related Job'}
                    </button>
                  </div>
                )}
                
                <div className="flex-between align-center mt-16">
                  <div>
                    {(role === 'admin' || fb.user_id === currentUser?.id) && (
                      <button 
                        className="btn-danger btn-sm" 
                        onClick={() => handleDeleteFeedback(fb.id)}
                      >
                        Delete Feedback
                      </button>
                    )}
                  </div>
                  <p className="text-secondary text-sm m-0">
                    Submitted: {formatStandardDate(fb.created_at)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card text-center text-secondary p-32">
          <h3 className="m-0 mb-8">No Feedback</h3>
          <p className="m-0">{role === 'admin' ? `No feedback in the ${activeTab} category yet.` : `You haven't submitted any feedback for ${activeTab} yet.`}</p>
        </div>
      )}
    </div>
  );
}