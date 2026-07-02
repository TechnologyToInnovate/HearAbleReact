import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import SkillBadge from '../components/SkillBadge'; // 🚨 IMPORT ADDED

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, role } = useAuth(); 
  
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [degree, setDegree] = useState(''); 
  const [batch, setBatch] = useState('');   
  
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  
  const [degreeOptions, setDegreeOptions] = useState([]);
  const [batchOptions, setBatchOptions] = useState([]);
  const [databaseSkills, setDatabaseSkills] = useState([]); 

  const [selectedSkills, setSelectedSkills] = useState([]); 
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [skillInput, setSkillInput] = useState(''); 

  useEffect(() => {
    if (role !== 'needs_onboarding') {
      navigate('/');
    }
  }, [role, navigate]);

  useEffect(() => {
    async function fetchOptions() {
      const [degRes, batchRes, skillsRes] = await Promise.all([
        supabase.from('degrees').select('*').order('name'),
        supabase.from('batches').select('*').order('batch_number', { ascending: false }),
        supabase.from('skills').select('*').order('name') 
      ]);
      if (degRes.data) setDegreeOptions(degRes.data);
      if (batchRes.data) setBatchOptions(batchRes.data);
      if (skillsRes.data) setDatabaseSkills(skillsRes.data);
    }
    fetchOptions();
  }, []);

  const saveSkill = () => {
    if (!skillInput) return;

    const skillObj = databaseSkills.find(s => s.id === skillInput);
    
    if (skillObj && !selectedSkills.some(s => s.id === skillObj.id)) {
      setSelectedSkills([...selectedSkills, skillObj]);
    }
    
    setSkillInput('');
    setShowSkillModal(false);
  };
  
  const removeSkill = (idToRemove) => {
    setSelectedSkills(selectedSkills.filter(skill => skill.id !== idToRemove));
  };

  async function handleSubmit() {
    if (!user) return;
    setIsSubmitting(true);
    
    const payload = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      contact_number: contactNumber.trim() || null,
      country: country.trim() || null,
      city: city.trim() || null,
      postal_code: postalCode.trim() || null,
      batch_id: batch || null,
      degree_id: degree || null 
    };

    let { data: updatedProfile, error: profileError } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', user.id)
      .select();

    if (!profileError && (!updatedProfile || updatedProfile.length === 0)) {
      const { error: insertError } = await supabase
        .from('profiles')
        .insert([{ ...payload, id: user.id, status: 'Pending' }]);
        
      if (insertError) profileError = insertError;
    }

    if (profileError) { 
      alert("Error saving profile. Please try again."); 
      console.error(profileError);
      setIsSubmitting(false);
      return;
    }

    if (selectedSkills.length > 0) {
      const profileSkillsData = selectedSkills.map(skill => ({
        profile_id: user.id,
        skill_id: skill.id
      }));
      await supabase.from('profile_skills').insert(profileSkillsData);
    }

    setIsSubmitting(false);
    window.location.href = '/'; 
  }

  const isStep1Valid = firstName.trim() && lastName.trim() && degree && batch;

  const availableSkills = databaseSkills.filter(
    dbSkill => !selectedSkills.some(selected => selected.id === dbSkill.id)
  );

  return (
    <div className="page-container" style={{ maxWidth: '700px', marginTop: '48px' }}>
      
      {showSkillModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '20px' }}>
          <div className="card p-24 flex-col gap-16" style={{ width: '100%', maxWidth: '500px', background: 'var(--bg-color)', overflow: 'visible' }}>
            <div className="flex-between mb-8">
              <h3 style={{ margin: 0 }}>Add New Skill</h3>
              <button onClick={() => setShowSkillModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-color)' }}>✕</button>
            </div>
            
            <label style={{ display: 'block', fontWeight: '500' }}>Select a skill to add</label>
            <select className="search-input w-full" value={skillInput} onChange={e => setSkillInput(e.target.value)}>
              <option value="" disabled>-- Choose a skill --</option>
              {availableSkills.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            
            <button className="btn-black w-full mt-8" onClick={saveSkill} disabled={!skillInput}>Add Skill</button>
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
              <div className="flex-between align-center">
                <h3 style={{ margin: 0 }}>Skills</h3>
                <button type="button" className="btn-outline btn-sm" onClick={() => setShowSkillModal(true)}>+ Add Skill</button>
              </div>

              <div className="flex-row-wrap gap-8 mt-8">
                {selectedSkills.map(skill => (
                  // 🚨 INTEGRATION: Using SkillBadge here
                  <SkillBadge 
                    key={skill.id} 
                    skill={skill} 
                    onRemove={() => removeSkill(skill.id)} 
                  />
                ))}
                {selectedSkills.length === 0 && (
                  <span className="text-secondary text-sm italic">No skills added yet. Click "+ Add Skill" to select from the list.</span>
                )}
              </div>
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