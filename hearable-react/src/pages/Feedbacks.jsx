import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { formatStandardDate } from '../utils/dateUtils';

export default function Feedbacks() {
  const { user: currentUser, role } = useAuth();
  const [feedbacks, setFeedbacks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal & Form State
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
    
    // 🚨 UPDATED: Include the new title and purpose fields in the payload
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
      setIsModalOpen(false); // Close the modal on success
      fetchFeedbacks();
      alert("Thank you for your feedback!");
    } else {
      console.error(error);
      alert("Failed to submit feedback.");
    }
    setIsSubmitting(false);
  }

  if (role === 'company') {
    return <div className="page-container-wide"><p className="text-center p-32">This page is for standard users and admins only.</p></div>;
  }

  return (
    <div className="page-container">
      
      {/* 🚨 UPDATED: Header now includes the "New Feedback" button that triggers the modal */}
      <div className="flex-between align-center mb-24">
        <h1 className="m-0">{role === 'admin' ? 'All Platform Feedback' : 'My Feedback'}</h1>
        {role !== 'admin' && (
          <button className="btn-black" onClick={() => setIsModalOpen(true)}>
            + New Feedback
          </button>
        )}
      </div>

      {/* 🚨 NEW: The Popup Modal Form */}
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
                    <option value="Website">Website Issue / Idea</option>
                    <option value="Job Posting">Job Postings</option>
                    <option value="Application Process">Application Process</option>
                    <option value="Other">Other</option>
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

      {/* 🚨 UPDATED: Displaying the Feedbacks */}
      <h3 className="mb-16">Previous Feedback</h3>
      {isLoading ? <p className="text-secondary">Loading...</p> : feedbacks.length > 0 ? (
        <div className="flex-col gap-16">
          {feedbacks.map(fb => (
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
              
              <div style={{ backgroundColor: 'var(--bg-color)', padding: '16px', borderRadius: '8px' }}>
                <p className="m-0" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>"{fb.message}"</p>
              </div>
              
              <p className="text-secondary text-sm mt-16 m-0 text-right">
                Submitted: {formatStandardDate(fb.created_at)}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center text-secondary p-32">
          <h3 className="m-0 mb-8">No Feedback</h3>
          <p className="m-0">{role === 'admin' ? 'No feedback received yet.' : 'You haven\'t submitted any feedback yet.'}</p>
        </div>
      )}
    </div>
  );
}