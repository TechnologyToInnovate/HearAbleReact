import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

export default function JobFormModal({ isOpen, onClose, onSubmit, initialData, isEditing, isSubmitting }) {
  const { user } = useAuth();
  
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [workModel, setWorkModel] = useState('On-site');
  const [type, setType] = useState('Full-time');
  const [description, setDescription] = useState('');
  
  // --- SKILLS STATE ---
  const [skills, setSkills] = useState([]);
  const [currentSkill, setCurrentSkill] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (isEditing && initialData) {
        setTitle(initialData.title || '');
        setLocation(initialData.location || '');
        setWorkModel(initialData.work_model || 'On-site');
        setType(initialData.type || 'Full-time');
        setDescription(initialData.description || '');
        setSkills(initialData.skills || []);
      } else {
        // Reset form for a new job
        setTitle('');
        setWorkModel('On-site');
        setType('Full-time');
        setDescription('');
        setSkills([]);
        
        // Auto-fetch the company's city to use as the default location!
        fetchCompanyCity();
      }
    }
  }, [isOpen, initialData, isEditing, user]);

  async function fetchCompanyCity() {
    if (!user) return;
    const { data } = await supabase
      .from('companies')
      .select('city')
      .eq('id', user.id)
      .maybeSingle();
      
    if (data && data.city) {
      setLocation(data.city);
    } else {
      setLocation('');
    }
  }

  const handleAddSkill = (e) => {
    e.preventDefault();
    const skillTrimmed = currentSkill.trim();
    if (skillTrimmed && !skills.includes(skillTrimmed)) {
      setSkills([...skills, skillTrimmed]);
    }
    setCurrentSkill('');
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      title,
      location,
      work_model: workModel,
      type,
      description,
      skills
    });
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
      <div className="card p-0" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-color)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden' }}>
        
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', background: 'var(--card-bg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>{isEditing ? 'Edit Job Posting' : 'Post a New Job'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-color)' }}>✕</button>
        </div>
        
        <div style={{ padding: '24px', overflowY: 'auto' }}>
          <form onSubmit={handleSubmit} className="flex-col gap-20">
            
            <div>
              <label>Job Title *</label>
              <input type="text" className="search-input w-full" placeholder="e.g. Senior Software Engineer" value={title} onChange={e => setTitle(e.target.value)} required />
            </div>
            
            <div className="form-grid-2">
              <div>
                <label>City / Region</label>
                <input type="text" className="search-input w-full" placeholder="e.g. Austin, TX" value={location} onChange={e => setLocation(e.target.value)} />
              </div>
              <div>
                <label>Work Model</label>
                <select className="search-input w-full" value={workModel} onChange={e => setWorkModel(e.target.value)}>
                  <option value="On-site">On-site</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Remote">Remote</option>
                </select>
              </div>
            </div>

            <div>
              <label>Employment Type</label>
              <select className="search-input w-full" value={type} onChange={e => setType(e.target.value)}>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
              </select>
            </div>

            {/* 🚨 MOVED: Job Description is now above the skills */}
            <div>
              <label>Job Description *</label>
              <textarea 
                className="search-input w-full" 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                style={{ height: '160px', resize: 'vertical' }} 
                placeholder="Describe the role, responsibilities, and qualifications..." 
                required 
              />
            </div>

            {/* 🚨 MOVED: Skills section is now at the bottom */}
            <div style={{ background: 'var(--bg-color)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Required Skills</label>
              <p className="text-sm text-secondary mb-12" style={{ marginTop: 0 }}>Add skills to help our matching algorithm find the best candidates.</p>
              
              <div className="flex-row gap-8 mb-16">
                <input 
                  type="text" 
                  className="search-input flex-grow" 
                  placeholder="e.g. React, Python, Marketing..." 
                  value={currentSkill}
                  onChange={(e) => setCurrentSkill(e.target.value)}
                  onKeyDown={(e) => { 
                    if (e.key === 'Enter') { 
                      e.preventDefault(); 
                      handleAddSkill(e); 
                    } 
                  }}
                />
                <button type="button" className="btn-outline" onClick={handleAddSkill}>Add</button>
              </div>
              
              <div className="flex-row-wrap gap-8">
                {skills.length > 0 ? (
                  skills.map((skill, index) => (
                    <span key={index} className="badge" style={{ background: '#e0e7ff', color: '#3730a3', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {skill}
                      <button 
                        type="button" 
                        onClick={() => handleRemoveSkill(skill)} 
                        style={{ background: 'none', border: 'none', color: '#312e81', cursor: 'pointer', padding: 0, fontSize: '1rem', lineHeight: 1 }}
                      >
                        ×
                      </button>
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-secondary italic">No skills added yet.</span>
                )}
              </div>
            </div>
            
            <div style={{ marginTop: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
              <button type="submit" className="btn-black w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : (isEditing ? 'Save Changes' : 'Post Job')}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}