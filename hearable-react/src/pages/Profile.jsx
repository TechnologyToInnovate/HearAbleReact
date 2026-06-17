import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [major, setMajor] = useState(''); 
  const [university, setUniversity] = useState('');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState('');
  const [certifications, setCertifications] = useState('');

  useEffect(() => {
    async function fetchProfile() {
      setIsLoading(true);
      const { data } = await supabase.from('profiles').select('*').limit(1).maybeSingle();
      if (data) {
        setProfile(data);
        setName(data.name || '');
        setMajor(data.major || '');
        setUniversity(data.university || '');
        setBio(data.bio || '');
        setSkills(data.skills ? data.skills.join(', ') : '');
        setCertifications(data.certifications ? data.certifications.join(', ') : '');
      }
      setIsLoading(false);
    }
    fetchProfile();
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setIsSaving(true);
    
    const skillsArray = skills.split(',').map(s => s.trim()).filter(s => s.length > 0);
    const certsArray = certifications.split(',').map(c => c.trim()).filter(c => c.length > 0);

    const updates = { name, major, university, bio, skills: skillsArray, certifications: certsArray };

    let error;
    if (profile?.id) {
      const res = await supabase.from('profiles').update(updates).eq('id', profile.id);
      error = res.error;
    } else {
      const res = await supabase.from('profiles').insert([updates]);
      error = res.error;
    }

    if (!error) {
      alert('Profile saved successfully!');
    } else {
      alert('Error saving profile. Check console.');
    }
    setIsSaving(false);
  }

  if (isLoading) return <div style={{ textAlign: 'center', marginTop: '64px', color: 'var(--secondary-text)' }}>Loading settings...</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '64px' }}>
      
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Profile Settings</h1>
        <p className="subtext">Update your professional details to stand out to employers.</p>
      </div>

      <div className="card">
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label>Full Name</label>
            <input type="text" className="search-input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          {/* RESPONSIVE: Form Grid */}
          <div className="form-grid-2">
            <div>
              <label>Professional Title (e.g. Software Engineer)</label>
              <input type="text" className="search-input" value={major} onChange={(e) => setMajor(e.target.value)} />
            </div>
            <div>
              <label>University / Alma Mater</label>
              <input type="text" className="search-input" value={university} onChange={(e) => setUniversity(e.target.value)} />
            </div>
          </div>

          <div>
            <label>About Me / Bio</label>
            <textarea className="search-input" style={{ height: '120px', resize: 'vertical' }} value={bio} onChange={(e) => setBio(e.target.value)} />
          </div>

          {/* RESPONSIVE: Form Grid */}
          <div className="form-grid-2">
            <div>
              <label>Skills (comma separated)</label>
              <input type="text" className="search-input" placeholder="e.g. React, Python, Figma" value={skills} onChange={(e) => setSkills(e.target.value)} />
            </div>
            <div>
              <label>Certifications (comma separated)</label>
              <input type="text" className="search-input" placeholder="e.g. AWS Certified, PMP" value={certifications} onChange={(e) => setCertifications(e.target.value)} />
            </div>
          </div>

          <div style={{ marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
            <button type="submit" className="btn-black" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Profile Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}