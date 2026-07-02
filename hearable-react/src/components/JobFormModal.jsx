import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import SkillBadge from './SkillBadge';

export default function JobFormModal({ isOpen, onClose, onSubmit, initialData, isEditing, isSubmitting }) {
  const { user } = useAuth();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  const [location, setLocation] = useState('');
  const [workModel, setWorkModel] = useState('On-site');
  const [type, setType] = useState('Full-time');
  const [pay, setPay] = useState(''); 
  const [payRate, setPayRate] = useState('per year'); 

  const [databaseSkills, setDatabaseSkills] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]); 
  
  // 🚨 NEW: Added modal state to match the other forms
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [skillInput, setSkillInput] = useState('');

  useEffect(() => {
    async function fetchDatabaseSkills() {
      const { data } = await supabase.from('skills').select('*').order('name');
      if (data) setDatabaseSkills(data);
    }
    
    if (isOpen) {
      fetchDatabaseSkills();
      
      if (isEditing && initialData) {
        setTitle(initialData.title || '');
        setLocation(initialData.location || '');
        setWorkModel(initialData.work_model || 'On-site');
        setType(initialData.type || 'Full-time');
        setPay(initialData.pay || ''); 
        setPayRate(initialData.pay_rate || 'per year');
        setDescription(initialData.description || '');
        
        setSelectedSkills(initialData.skills || []);
      } else {
        setTitle('');
        setWorkModel('On-site');
        setType('Full-time');
        setPay('');
        setPayRate('per year');
        setDescription('');
        setSelectedSkills([]);
        
        fetchCompanyCity();
      }
    }
  }, [isOpen, initialData, isEditing, user]);

  async function fetchCompanyCity() {
    if (!user) return;
    const { data } = await supabase.from('companies').select('city').eq('id', user.id).maybeSingle();
    if (data && data.city) setLocation(data.city);
    else setLocation('');
  }

  // 🚨 NEW: Updated to act as a save button for the popup modal
  const saveSkill = () => {
    if (!skillInput) return;

    const skillObj = databaseSkills.find(s => s.id === skillInput);
    
    if (skillObj && !selectedSkills.some(s => s.id === skillObj.id)) {
      setSelectedSkills([...selectedSkills, skillObj]);
    }
    
    setSkillInput('');
    setShowSkillModal(false);
  };

  const handleRemoveSkill = (idToRemove) => {
    setSelectedSkills(selectedSkills.filter(s => s.id !== idToRemove));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      title,
      location,
      work_model: workModel,
      type,
      pay, 
      pay_rate: payRate, 
      description,
      skills: selectedSkills 
    });
  };

  if (!isOpen) return null;
  
  const availableSkills = databaseSkills.filter(
    dbSkill => !selectedSkills.some(selected => selected.id === dbSkill.id)
  );

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
      
      {/* 🚨 THE NEW SKILL POPUP MODAL */}
      {showSkillModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '20px' }}>
          <div className="card p-24 flex-col gap-16" style={{ width: '100%', maxWidth: '500px', background: 'var(--bg-color)', overflow: 'visible' }}>
            <div className="flex-between mb-8">
              <h3 style={{ margin: 0 }}>Add Required Skill</h3>
              <button type="button" onClick={() => setShowSkillModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-color)' }}>✕</button>
            </div>
            
            <label style={{ display: 'block', fontWeight: '500' }}>Select a skill to add</label>
            <select className="search-input w-full" value={skillInput} onChange={e => setSkillInput(e.target.value)}>
              <option value="" disabled>-- Choose a skill --</option>
              {availableSkills.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            
            <button type="button" className="btn-black w-full mt-8" onClick={saveSkill} disabled={!skillInput}>Add Skill</button>
          </div>
        </div>
      )}

      <div className="card p-0" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-color)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden' }}>
        
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', background: 'var(--card-bg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>{isEditing ? 'Edit Job Posting' : 'Post a New Job'}</h2>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-color)' }}>✕</button>
        </div>
        
        <div style={{ padding: '24px', overflowY: 'auto' }}>
          <form onSubmit={handleSubmit} className="flex-col gap-20">
            
            <div>
              <label>Job Title *</label>
              <input type="text" className="search-input w-full" placeholder="e.g. Senior Software Engineer" value={title} onChange={e => setTitle(e.target.value)} required />
            </div>
            
            <div style={{ background: 'var(--card-bg)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600' }}>Job Details</label>
              
              <div className="form-grid-2 gap-16">
                <div>
                  <label className="text-sm">City / Region</label>
                  <input type="text" className="search-input w-full" placeholder="e.g. Austin, TX" value={location} onChange={e => setLocation(e.target.value)} />
                </div>
                
                <div>
                  <label className="text-sm">Pay / Salary</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="text" className="search-input w-full" placeholder="e.g. $80,000" value={pay} onChange={e => setPay(e.target.value)} />
                    <select className="search-input" style={{ width: '120px', flexShrink: 0, padding: '10px 8px' }} value={payRate} onChange={e => setPayRate(e.target.value)}>
                      <option value="per hour">per hour</option>
                      <option value="per day">per day</option>
                      <option value="per week">per week</option>
                      <option value="per month">per month</option>
                      <option value="per year">per year</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm">Work Model</label>
                  <select className="search-input w-full" value={workModel} onChange={e => setWorkModel(e.target.value)}>
                    <option value="On-site">On-site</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Remote">Remote</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm">Employment Type</label>
                  <select className="search-input w-full" value={type} onChange={e => setType(e.target.value)}>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>
              </div>
            </div>

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

            <div style={{ background: 'var(--bg-color)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              
              {/* 🚨 CHANGED: Replaced inline select with consistent Add button layout */}
              <div className="flex-between align-center mb-16">
                <div>
                  <label style={{ display: 'block', fontWeight: '600' }}>Required Skills</label>
                  <p className="text-sm text-secondary m-0 mt-4">Select skills to help our matching algorithm find candidates.</p>
                </div>
                <button type="button" className="btn-outline btn-sm" onClick={() => setShowSkillModal(true)}>+ Add Skill</button>
              </div>
              
              <div className="flex-row-wrap gap-8">
                {selectedSkills.length > 0 ? (
                  selectedSkills.map((skill) => (
                    <SkillBadge 
                      key={skill.id} 
                      skill={skill} 
                      onRemove={() => handleRemoveSkill(skill.id)} 
                    />
                  ))
                ) : (
                  <span className="text-sm text-secondary italic">No skills added yet. Click "+ Add Skill" to select from the list.</span>
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