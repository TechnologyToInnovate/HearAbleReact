import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';

export default function SiteFeedbackWidget() {
  const { user, role } = useAuth(); // 🚨 NEW: Destructured role to check if guest
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🚨 NEW: If there is no user or they are a guest, do not render the widget at all
  if (!user || role === 'guest') {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('feedbacks').insert([{
        user_id: user.id, 
        title: 'Website Feedback',
        purpose: 'Website', // 🚨 UPDATED: Changed to exactly match the "Website" tab category
        message: message.trim()
      }]);
      
      if (error) throw error;
      
      alert('Thank you for helping us improve Hearable!');
      setIsOpen(false);
      setMessage('');
    } catch (error) {
      console.error("Feedback error:", error);
      alert('Failed to send feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '24px', left: '24px', zIndex: 9999 }}>
      
      {isOpen && (
        <div 
          className="card p-24 mb-16" 
          style={{ 
            width: '320px', 
            background: 'var(--card-bg)', 
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            position: 'absolute',
            bottom: '100%',
            left: '0',
            transformOrigin: 'bottom left',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <div className="flex-between align-center mb-12">
            <h4 className="m-0 text-primary">Website Feedback</h4>
            <button 
              onClick={() => setIsOpen(false)} 
              style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--secondary-text)' }}
            >
              &times;
            </button>
          </div>
          
          <p className="text-sm text-secondary m-0 mb-16" style={{ lineHeight: '1.5' }}>
            Found a bug or have a suggestion? Let us know how we can improve!
          </p>
          
          <form onSubmit={handleSubmit} className="flex-col gap-12">
            <textarea
              className="search-input w-full"
              rows="4"
              placeholder="Tell us what you think..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              style={{ resize: 'none' }}
            />
            <button type="submit" className="btn-black w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Send Feedback'}
            </button>
          </form>
        </div>
      )}

      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: 'var(--primary-color)',
          color: 'var(--bg-color)',
          border: 'none',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.2s, background-color 0.2s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        title="Send Feedback"
      >
        {isOpen ? (
          <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>&times;</span>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        )}
      </button>
    </div>
  );
}