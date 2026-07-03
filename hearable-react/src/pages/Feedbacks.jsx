import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

// 🚨 NEW IMPORT: Date Utility
import { formatStandardDate } from '../utils/dateUtils';

export default function Feedbacks() {
  const { user: currentUser, role } = useAuth();
  const [feedbacks, setFeedbacks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
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
    if (!newMessage.trim()) return;
    
    setIsSubmitting(true);
    const { error } = await supabase.from('feedbacks').insert([{ 
      user_id: currentUser.id, 
      message: newMessage 
    }]);

    if (!error) {
      setNewMessage('');
      fetchFeedbacks();
      alert("Thank you for your feedback!");
    } else {
      alert("Failed to submit feedback.");
    }
    setIsSubmitting(false);
  }

  if (role === 'company') {
    return <div className="page-container-wide"><p className="text-center p-32">This page is for standard users and admins only.</p></div>;
  }

  return (
    <div className="page-container">
      <h1 className="mb-24 m-0">{role === 'admin' ? 'All Platform Feedback' : 'My Feedback'}</h1>

      {role !== 'admin' && (
        <div className="card mb-32 p-24">
          <h3 className="mb-16 mt-0">Submit Feedback</h3>
          <form onSubmit={handleSubmit} className="flex-col gap-16">
            <textarea 
              className="search-input w-full" 
              style={{ height: '120px', resize: 'vertical' }} 
              placeholder="Tell us what you love, what's broken, or what we should build next..." 
              value={newMessage} 
              onChange={(e) => setNewMessage(e.target.value)} 
              required 
            />
            <button type="submit" className="btn-black" disabled={isSubmitting} style={{ alignSelf: 'flex-start' }}>
              {isSubmitting ? 'Sending...' : 'Send Feedback'}
            </button>
          </form>
        </div>
      )}

      <h3 className="mb-16">Previous Feedback</h3>
      {isLoading ? <p className="text-secondary">Loading...</p> : feedbacks.length > 0 ? (
        <div className="flex-col gap-16">
          {feedbacks.map(fb => (
            <div key={fb.id} className="card p-20">
              {role === 'admin' && (
                <div className="badge badge-neutral mb-12" style={{ display: 'inline-block' }}>User ID: {fb.user_id}</div>
              )}
              <p className="m-0" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '1.05rem' }}>"{fb.message}"</p>
              
              {/* 🚨 UPDATED: Using formatStandardDate */}
              <p className="text-secondary text-sm mt-12 m-0">Submitted: {formatStandardDate(fb.created_at)}</p>
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