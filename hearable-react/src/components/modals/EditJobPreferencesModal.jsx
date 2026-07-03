import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

export default function EditJobPreferencesModal({ isOpen, onClose, user, onSuccess }) {
  const [title, setTitle] = useState('');
  const [workModel, setWorkModel] = useState('');
  const [jobType, setJobType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Populate the form with the user's current preferences when the modal opens
  useEffect(() => {
    if (user && isOpen) {
      setTitle(user.preferred_job_title || '');
      setWorkModel(user.preferred_work_model || '');
      setJobType(user.preferred_job_type || '');
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSubmitting(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        preferred_job_title: title.trim() || null,
        preferred_work_model: workModel || null,
        preferred_job_type: jobType || null
      })
      .eq('id', user.id);

    setIsSubmitting(false);

    if (!error) {
      onSuccess(); // Refresh the profile data
      onClose();   // Close the modal
    } else {
      alert("Failed to update job preferences. Please try again.");
      console.error(error);
    }
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div className="card" style={{ width: '100%', maxWidth: '500px', padding: '32px', position: 'relative', overflowY: 'auto', maxHeight: '90vh' }}>
        
        <div className="flex-between align-center mb-24">
          <h2 className="m-0 text-xl">Edit Job Preferences</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--secondary-text)' }}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="flex-col gap-16">
          
          <div className="flex-col gap-8">
            <label className="font-bold text-sm">Desired Role / Job Title</label>
            <input 
              type="text" 
              className="search-input w-full" 
              placeholder="e.g. Frontend Developer, Marketing Manager" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
            />
          </div>

          <div className="flex-col gap-8">
            <label className="font-bold text-sm">Preferred Work Model</label>
            <select className="search-input w-full" value={workModel} onChange={(e) => setWorkModel(e.target.value)}>
              <option value="">Any</option>
              <option value="On-site">On-site</option>
              <option value="Hybrid">Hybrid</option>
              <option value="Remote">Remote</option>
            </select>
          </div>

          <div className="flex-col gap-8">
            <label className="font-bold text-sm">Preferred Job Type</label>
            <select className="search-input w-full" value={jobType} onChange={(e) => setJobType(e.target.value)}>
              <option value="">Any</option>
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Contract">Contract</option>
              <option value="Freelance">Freelance</option>
              <option value="Internship">Internship</option>
            </select>
          </div>

          <div className="flex-row gap-12 mt-16" style={{ justifyContent: 'flex-end' }}>
            <button type="button" className="btn-outline" onClick={onClose} disabled={isSubmitting}>Cancel</button>
            <button type="submit" className="btn-black" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}