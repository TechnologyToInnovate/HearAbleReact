import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function Profile({ onClose }) {
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Core Form State
  const [name, setName] = useState('');
  const [idNumber, setIdNumber] = useState(''); 
  const [major, setMajor] = useState(''); 
  const [bio, setBio] = useState('');

  // Array States for new functionality
  const [educationList, setEducationList] = useState([]);
  const [skillsList, setSkillsList] = useState([]);

  // Sub-form Toggle States
  const [showEdForm, setShowEdForm] = useState(false);
  const [edName, setEdName] = useState('');
  const [edLocation, setEdLocation] = useState('');

  const [showSkillForm, setShowSkillForm] = useState(false);
  const [skillName, setSkillName] = useState('');
  const [skillLink, setSkillLink] = useState('');

  const handleClose = () => {
    if (onClose) onClose();
    else navigate(-1);
  };

  useEffect(() => {
    async function fetchProfile() {
      setIsLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/login');
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      if (data) {
        setProfile(data);
        setName(data.name || '');
        setIdNumber(data.id_number || '');
        setMajor(data.major || '');
        setBio(data.bio || '');
        setEducationList(data.education || []);
        setSkillsList(data.skills || []);
      }
      setIsLoading(false);
    }
    fetchProfile();
  }, [navigate]);

  async function handleSave(e) {
    e.preventDefault();
    setIsSaving(true);
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      alert("Session expired. Please log in again.");
      navigate('/login');
      return;
    }

    const updates = { 
      name, 
      id_number: idNumber, 
      major, 
      bio, 
      education: educationList, 
      skills: skillsList
    };

    let error;
    if (profile?.id) {
      const res = await supabase.from('profiles').update(updates).eq('id', session.user.id);
      error = res.error;
    } else {
      const res = await supabase.from('profiles').insert([{ id: session.user.id, ...updates }]);
      error = res.error;
    }

    setIsSaving(false);

    if (!error) {
      handleClose();
    } else {
      alert('Error saving profile. Check console.');
      console.error(error);
    }
  }

  // --- Handlers for Sub-forms ---
  const handleAddEducation = () => {
    if (!edName || !edLocation) return alert("Please fill out both Name and Location.");
    const newList = [...educationList, { name: edName, location: edLocation }];
    setEducationList(newList);
    setEdName(''); 
    setEdLocation(''); 
    setShowEdForm(false);
  };

  const removeEducation = (index) => {
    const newList = educationList.filter((_, i) => i !== index);
    setEducationList(newList);
  };

  const handleAddSkill = () => {
    if (!skillName) return alert("Please enter a Skill Name.");
    const newList = [...skillsList, { name: skillName, link: skillLink }];
    setSkillsList(newList);
    setSkillName(''); 
    setSkillLink(''); 
    setShowSkillForm(false);
  };

  const removeSkill = (index) => {
    const newList = skillsList.filter((_, i) => i !== index);
    setSkillsList(newList);
  };

  return (
    <div style={{ 
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', 
      zIndex: 9999, padding: '20px' 
    }}>
      <div className="card p-0" style={{ 
        width: '100%', maxWidth: '800px', maxHeight: '90vh', 
        display: 'flex', flexDirection: 'column',
        background: 'var(--bg-color)', 
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden' 
      }}>
        
        {/* Sticky Header */}
        <div className="flex-between" style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', background: 'var(--card-bg)' }}>
          <h2 style={{ margin: 0 }}>Edit Profile</h2>
          <button 
            onClick={handleClose} 
            style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-color)' }}
          >
            ✕
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div style={{ padding: '24px', overflowY: 'auto' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--secondary-text)' }}>Loading settings...</div>
          ) : (
            <form onSubmit={handleSave} className="flex-col gap-20">
              
              <div className="form-grid-2">
                <div><label>Full Name</label><input type="text" className="search-input" value={name} onChange={(e) => setName(e.target.value)} required /></div>
                <div><label>ID Number (8 Digits)</label><input type="text" className="search-input" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} maxLength="8" /></div>
              </div>

              <div><label>Professional Title</label><input type="text" className="search-input" value={major} onChange={(e) => setMajor(e.target.value)} /></div>
              
              <div><label>Headline</label><input type="text" className="search-input" value={bio} onChange={(e) => setBio(e.target.value)} /></div>

              {/* EDUCATION SECTION */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                <div className="flex-between mb-16">
                  <label style={{ margin: 0 }}>Education History</label>
                  {!showEdForm && <button type="button" className="btn-outline btn-sm" onClick={() => setShowEdForm(true)}>+ Add Education</button>}
                </div>

                {educationList.map((ed, idx) => (
                  <div key={idx} className="flex-between mb-8" style={{ background: 'var(--card-bg)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div><strong>{ed.name}</strong> <span className="text-secondary text-sm ml-8">📍 {ed.location}</span></div>
                    <button type="button" style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }} onClick={() => removeEducation(idx)}>✕ Remove</button>
                  </div>
                ))}

                {showEdForm && (
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '12px' }}>
                    <div className="form-grid-2 mb-16">
                      <div><label className="text-sm">School / Program Name *</label><input type="text" className="search-input" value={edName} onChange={e => setEdName(e.target.value)} /></div>
                      <div><label className="text-sm">Location *</label><input type="text" className="search-input" value={edLocation} onChange={e => setEdLocation(e.target.value)} /></div>
                    </div>
                    <div className="flex-row gap-8">
                      <button type="button" className="btn-black btn-sm" onClick={handleAddEducation}>Save Education</button>
                      <button type="button" className="btn-outline btn-sm" onClick={() => setShowEdForm(false)}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>

              {/* SKILLS SECTION */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                <div className="flex-between mb-16">
                  <label style={{ margin: 0 }}>Skills & Certifications</label>
                  {!showSkillForm && <button type="button" className="btn-outline btn-sm" onClick={() => setShowSkillForm(true)}>+ Add Skill</button>}
                </div>

                <div className="flex-row-wrap gap-8 mb-16">
                  {skillsList.map((skill, idx) => (
                    <div key={idx} className="tag border flex-row gap-8" style={{ background: 'var(--card-bg)', paddingRight: '4px' }}>
                      <span>{skill.name} {skill.link && '🔗'}</span>
                      <button type="button" onClick={() => removeSkill(idx)} style={{ background: 'none', border: 'none', color: 'var(--secondary-text)', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1 }}>×</button>
                    </div>
                  ))}
                </div>

                {showSkillForm && (
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div className="form-grid-2 mb-16">
                      <div><label className="text-sm">Skill / Cert Name *</label><input type="text" className="search-input" value={skillName} onChange={e => setSkillName(e.target.value)} /></div>
                      <div><label className="text-sm">Link / Credential URL (Optional)</label><input type="url" className="search-input" placeholder="https://" value={skillLink} onChange={e => setSkillLink(e.target.value)} /></div>
                    </div>
                    <div className="flex-row gap-8">
                      <button type="button" className="btn-black btn-sm" onClick={handleAddSkill}>Save Skill</button>
                      <button type="button" className="btn-outline btn-sm" onClick={() => setShowSkillForm(false)}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>

              {/* CANCEL BUTTON REMOVED */}
              <div style={{ marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
                <button type="submit" className="btn-black w-full" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Profile Settings'}
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}