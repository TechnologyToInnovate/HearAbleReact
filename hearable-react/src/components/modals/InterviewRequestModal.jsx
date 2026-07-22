import React, { useState, useEffect } from 'react';

export default function InterviewRequestModal({ isOpen, onClose, applicantName, onSubmit, isSubmitting }) {
  const [message, setMessage] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  
  // Template Management States
  const [savedTemplates, setSavedTemplates] = useState([]);
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState('');

  // Load saved templates from local storage when the modal opens
  useEffect(() => {
    if (isOpen) {
      const storedTemplates = localStorage.getItem('company_interview_templates');
      if (storedTemplates) {
        setSavedTemplates(JSON.parse(storedTemplates));
      }
      
      // Set a default greeting
      setMessage(`Hi ${applicantName || 'there'},\n\nWe were impressed by your resume and would love to invite you to an interview.\n\nPlease let us know if the proposed time works for you, or if you need to reschedule.\n\nBest regards,\n[Your Company Name]`);
      setDate('');
      setTime('');
      setLocation('');
      setSelectedTemplateIndex('');
    }
  }, [isOpen, applicantName]);

  const handleSaveTemplate = () => {
    if (!message.trim()) return alert("Message body is empty!");
    
    const newTemplates = [...savedTemplates, message];
    setSavedTemplates(newTemplates);
    localStorage.setItem('company_interview_templates', JSON.stringify(newTemplates));
    alert("Message saved as a new template!");
  };

  const handleLoadTemplate = (e) => {
    const index = e.target.value;
    setSelectedTemplateIndex(index);
    if (index !== '') {
      setMessage(savedTemplates[index]);
    }
  };

  const handleDeleteTemplate = () => {
    if (selectedTemplateIndex === '') return;
    
    const updatedTemplates = savedTemplates.filter((_, i) => i !== parseInt(selectedTemplateIndex));
    setSavedTemplates(updatedTemplates);
    localStorage.setItem('company_interview_templates', JSON.stringify(updatedTemplates));
    setSelectedTemplateIndex('');
    alert("Template deleted.");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      message,
      interview_date: date,
      interview_time: time,
      interview_location: location
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '600px' }}>
        
        <div className="modal-header">
          <h2 className="m-0">Send Interview Request</h2>
          <button type="button" className="close-btn" onClick={onClose} disabled={isSubmitting}>✕</button>
        </div>
        
        <div className="modal-body">
          <form onSubmit={handleSubmit} className="flex-col gap-24">
            
            {/* Template Management Section */}
            <div className="sub-card p-16" style={{ background: 'var(--bg-color)' }}>
              <label className="mb-8 block font-bold text-sm">Saved Message Templates</label>
              <div className="flex-row gap-12 align-center flex-wrap">
                <select 
                  className="search-input" 
                  style={{ flex: 1, minWidth: '200px' }} 
                  value={selectedTemplateIndex} 
                  onChange={handleLoadTemplate}
                >
                  <option value="">-- Select a saved template --</option>
                  {savedTemplates.map((tpl, idx) => (
                    <option key={idx} value={idx}>
                      Template {idx + 1}: {tpl.substring(0, 30)}...
                    </option>
                  ))}
                </select>
                
                {selectedTemplateIndex !== '' && (
                  <button type="button" className="btn-danger btn-sm" onClick={handleDeleteTemplate}>
                    Delete
                  </button>
                )}
              </div>
            </div>

            {/* Interview Details */}
            <div className="form-grid-2">
              <div>
                <label className="mb-8 block font-bold">Proposed Date *</label>
                <input 
                  type="date" 
                  className="search-input w-full" 
                  value={date} 
                  onChange={e => setDate(e.target.value)} 
                  required 
                />
              </div>
              <div>
                <label className="mb-8 block font-bold">Proposed Time *</label>
                <input 
                  type="time" 
                  className="search-input w-full" 
                  value={time} 
                  onChange={e => setTime(e.target.value)} 
                  required 
                />
              </div>
            </div>

            <div>
              <label className="mb-8 block font-bold">Location / Meeting Link *</label>
              <input 
                type="text" 
                className="search-input w-full" 
                placeholder="e.g., Zoom Link, Google Meet, or Office Address" 
                value={location} 
                onChange={e => setLocation(e.target.value)} 
                required 
              />
            </div>

            {/* Message Body */}
            <div>
              <div className="flex-between align-center mb-8">
                <label className="font-bold m-0">Message to Applicant *</label>
                <button 
                  type="button" 
                  className="btn-outline btn-sm" 
                  style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                  onClick={handleSaveTemplate}
                >
                  💾 Save as Template
                </button>
              </div>
              <textarea 
                className="search-input w-full" 
                value={message} 
                onChange={e => setMessage(e.target.value)} 
                style={{ height: '200px', resize: 'vertical' }} 
                required 
              />
            </div>
            
            <div className="divider m-0 mt-8 flex-row gap-16" style={{ justifyContent: 'flex-end', paddingTop: '24px' }}>
              <button type="button" className="btn-outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </button>
              <button type="submit" className="btn-black" disabled={isSubmitting}>
                {isSubmitting ? 'Sending...' : 'Send Interview Invite'}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}