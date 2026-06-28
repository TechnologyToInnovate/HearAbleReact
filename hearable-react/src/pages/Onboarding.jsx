import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext'; // 🚨 NEW: Global Auth

const MOCK_SKILL_DATABASE = [
  "JavaScript", "Python", "React", "Node.js", "UI/UX Design", 
  "Data Analysis", "Project Management", "Marketing", "SQL", 
  "AWS", "Machine Learning", "Graphic Design", "Sales", "Java", 
  "C++", "C#", "TypeScript", "Figma", "Digital Marketing", "SEO"
];

async function fetchSuggestions(query, database) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const results = database.filter(item => item.toLowerCase().includes(query.toLowerCase()));
      resolve(results);
    }, 150); 
  });
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, role } = useAuth(); // 🚨 Replaces manual session checks
  
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [degree, setDegree] = useState(''); 
  const [batch, setBatch] = useState('');   
  
  // LOCATION
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  
  // DROPDOWN OPTIONS STATE
  const [degreeOptions, setDegreeOptions] = useState([]);
  const [batchOptions, setBatchOptions] = useState([]);

  // SKILLS
  const [skills, setSkills] = useState([]);
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [skillSuggestions, setSkillSuggestions] = useState([]);
  const [showSkillDropdown, setShowSkillDropdown] = useState(false);

  // 1. Initial access check (Drastically simplified via AuthContext)
  useEffect(() => {
    if (role !== 'needs_onboarding' && role !== 'guest') {
      navigate('/');
    }
  }, [role, navigate]);

  // 2. Fetch official degrees and batches for the dropdowns
  useEffect(() => {
    async function fetchOptions() {
      const [degRes, batchRes] = await Promise.all([
        supabase.from('degrees').select('*').order('name'),
        supabase.from('batches').select('*').order('batch_number', { ascending: false })
      ]);
      if (degRes.data) setDegreeOptions(degRes.data);
      if (batchRes.data) setBatchOptions(batchRes.data);
    }
    fetchOptions();
  }, []);

  // 3. Skill suggestions logic
  useEffect(() => {
    if (skillInput.length < 2) { setSkillSuggestions([]); setShowSkillDropdown(false); return; }
    const delay = setTimeout(async () => {
      const res = await fetchSuggestions(skillInput, MOCK_SKILL_DATABASE);
      setSkillSuggestions(res); setShowSkillDropdown(res.length > 0);
    }, 200);
    return () => clearTimeout(delay);
  }, [skillInput]);

  const saveSkill = () => {
    if (skillInput.trim()) {
      if (!skills.includes(skillInput.trim())) setSkills([...skills, skillInput.trim()]);
      setSkillInput('');
      setShowSkillModal(false); 
      setShowSkillDropdown(false);
    }
  };
  
  const removeSkill = (index) => setSkills(skills.filter((_, i) => i !== index));

  async function handleSubmit() {
    if (!user) return;
    setIsSubmitting(true);
    const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');

    const { error } = await supabase
      .from('profiles')
      .update({ 
        first_name: firstName.trim(), 
        last_name: lastName.trim(),
        name: fullName, 
        contact_number: contactNumber.trim(),
        country: country.trim(),
        city: city.trim(),
        postal_code: postalCode.trim(),
        batch_id: batch,
        degree_id: degree, 
        skills 
      })
      .eq('id', user.id); // Uses global user

    setIsSubmitting(false);
    
    if (!error) { 
      // Forces a full app reload to completely re-evaluate the user's role from 'needs_onboarding' to 'pending_user'
      window.location.href = '/'; 
    } else { 
      alert("Error saving profile. Please try again."); 
      console.error(error);
    }
  }

  const handleKeyDown = (e, action) => { if (e.key === 'Enter') { e.preventDefault(); action(); } };
  
  const isStep1Valid = firstName.trim() && lastName.trim() && degree && batch;

  return (
    <div className="page-container" style={{ maxWidth: '700px', marginTop: '48px' }}>
      
      {showSkillModal && (
        <div className="modal-overlay">
          <div className="card p-24 flex-col gap-16" style={{ width: '100%', maxWidth: '500px', background: 'var(--bg-color)', overflow: 'visible' }}>
            <div className="flex-between mb-8">
              <h3 style={{ margin: 0 }}>Add New Skill</h3>
              <button className="close-btn" onClick={() => setShowSkillModal(false)}>✕</button>
            </div>
            
            <div style={{ position: 'relative' }}>
              <input type="text" className="search-input w-full" value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={(e) => handleKeyDown(e, saveSkill)} placeholder="Search or type a skill..." autoFocus />
              
              {showSkillDropdown && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '4px', marginTop: '4px', maxHeight: '150px', overflowY: 'auto', zIndex: 1000, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                  {skillSuggestions.map((skill, idx) => (
                    <div key={idx} style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)' }} onMouseDown={() => { setSkillInput(skill); setShowSkillDropdown(false); }}>
                      {skill}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <button className="btn-black w-full mt-8" onClick={saveSkill}>Save Skill</button>
          </div>
        </div>
      )}

      <div className="card p-0" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        
        <div className="flex-between" style={{ padding: '24px 32px', borderBottom: '1px solid var(--border-color)', background: 'var(--card-bg)' }}>
          <h2 style={{ margin: 0 }}>Set Up Your Profile</h2>
          <span style={{ color: 'var(--secondary-text)', fontSize: '0.9rem', fontWeight: '500' }}>Step {step} of 3</span>
        </div>

        <div style={{ padding: '32px' }}>
          
          {step === 1 && (
            <div className="flex-col gap-24">
              <h3 style={{ margin: 0 }}>Basic Information</h3>
              <div className="form-grid-2">
                <div className="flex-col gap-8">
                  <label style={{ fontWeight: '600' }}>First Name *</label>
                  <input type="text" className="search-input w-full" value={firstName} onChange={e => setFirstName(e.target.value)} required />
                </div>
                <div className="flex-col gap-8">
                  <label style={{ fontWeight: '600' }}>Last Name *</label>
                  <input type="text" className="search-input w-full" value={lastName} onChange={e => setLastName(e.target.value)} required />
                </div>
              </div>
              <div className="form-grid-2">
                <div className="flex-col gap-8">
                  <label style={{ fontWeight: '600' }}>Degree *</label>
                  <select className="search-input w-full" value={degree} onChange={e => setDegree(e.target.value)} required>
                    <option value="" disabled>Select a Degree</option>
                    {degreeOptions.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.abbreviation ? `${d.abbreviation} - ${d.name}` : d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-col gap-8">
                  <label style={{ fontWeight: '600' }}>Batch *</label>
                  <select className="search-input w-full" value={batch} onChange={e => setBatch(e.target.value)} required>
                    <option value="" disabled>Select a Batch</option>
                    {batchOptions.map(b => (
                      <option key={b.id} value={b.id}>Batch {b.batch_number}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex-col gap-24">
              <h3 style={{ margin: 0 }}>Contact & Location</h3>
              <div className="flex-col gap-8">
                <label style={{ fontWeight: '600' }}>Contact Number</label>
                <input type="tel" className="search-input w-full" value={contactNumber} onChange={e => setContactNumber(e.target.value)} placeholder="e.g. +1 234 567 8900" />
              </div>
              <div className="form-grid-3">
                <div className="flex-col gap-8">
                  <label style={{ fontWeight: '600' }}>Country</label>
                  <input type="text" className="search-input w-full" value={country} onChange={e => setCountry(e.target.value)} placeholder="e.g. USA" />
                </div>
                <div className="flex-col gap-8">
                  <label style={{ fontWeight: '600' }}>City</label>
                  <input type="text" className="search-input w-full" value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. New York" />
                </div>
                <div className="flex-col gap-8">
                  <label style={{ fontWeight: '600' }}>Postal Code</label>
                  <input type="text" className="search-input w-full" value={postalCode} onChange={e => setPostalCode(e.target.value)} placeholder="e.g. 10001" />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex-col gap-24">
              <h3 style={{ margin: 0 }}>Skills</h3>
              <div className="flex-row-wrap gap-8">
                {skills.map((item, idx) => (
                  <span key={idx} className="badge badge-primary" style={{ padding: '8px 16px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {item} 
                    <button onClick={() => removeSkill(idx)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'inherit', fontSize: '1rem', padding: 0 }}>✕</button>
                  </span>
                ))}
              </div>
              <button className="btn-outline w-full" style={{ borderStyle: 'dashed' }} onClick={() => setShowSkillModal(true)}>+ Add Skill</button>
            </div>
          )}
        </div>

        <div className="flex-between align-center" style={{ padding: '24px 32px', borderTop: '1px solid var(--border-color)', background: 'var(--card-bg)' }}>
          <div>{step > 1 && <button type="button" className="btn-outline btn-sm" onClick={() => setStep(step - 1)}>← Back</button>}</div>
          
          <div className="flex-row gap-24 align-center">
            {step > 1 ? (
              <button type="button" onClick={() => step < 3 ? setStep(step + 1) : handleSubmit()} style={{ background: 'none', border: 'none', color: 'var(--secondary-text)', cursor: 'pointer', fontSize: '0.95rem', fontWeight: '500', padding: 0 }}>Skip for now</button>
            ) : <div></div>}
            
            <button type="button" className="btn-black" onClick={() => step < 3 ? setStep(step + 1) : handleSubmit()} disabled={isSubmitting || (step === 1 && !isStep1Valid)} style={{ padding: '12px 24px', fontSize: '1rem' }}>
              {step < 3 ? 'Continue' : isSubmitting ? 'Saving...' : 'Finish Setup'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}