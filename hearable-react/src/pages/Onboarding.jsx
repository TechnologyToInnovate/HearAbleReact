import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import SkillBadge from '../components/common/SkillBadge'; 
import AddSkillModal from '../components/modals/AddSkillModal'; // 🚨 IMPORT REUSABLE MODAL

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, role } = useAuth(); 
  
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [firstName, setFirstName] = useState(''); const [lastName, setLastName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [degree, setDegree] = useState(''); const [batch, setBatch] = useState('');   
  const [country, setCountry] = useState(''); const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  
  const [degreeOptions, setDegreeOptions] = useState([]);
  const [batchOptions, setBatchOptions] = useState([]);

  const [selectedSkills, setSelectedSkills] = useState([]); 
  const [showSkillModal, setShowSkillModal] = useState(false);

  useEffect(() => {
    if (role !== 'needs_onboarding') navigate('/');
  }, [role, navigate]);

  useEffect(() => {
    async function fetchOptions() {
      // 🚨 REMOVED SKILLS FETCHING (AddSkillModal handles it)
      const [degRes, batchRes] = await Promise.all([
        supabase.from('degrees').select('*').order('name'),
        supabase.from('batches').select('*').order('batch_number', { ascending: false })
      ]);
      if (degRes.data) setDegreeOptions(degRes.data);
      if (batchRes.data) setBatchOptions(batchRes.data);
    }
    fetchOptions();
  }, []);

  // 🚨 REFACTORED TO RECEIVE THE SKILL OBJECT DIRECTLY FROM THE COMPONENT
  const handleAddSkill = (skillObj) => {
    if (skillObj && !selectedSkills.some(s => s.id === skillObj.id)) {
      setSelectedSkills([...selectedSkills, skillObj]);
    }
    setShowSkillModal(false);
  };
  
  const removeSkill = (idToRemove) => setSelectedSkills(selectedSkills.filter(skill => skill.id !== idToRemove));

async function handleSubmit() {
    if (!user) return;
    setIsSubmitting(true);
    
    // 🚨 NEW: Save location data into the normalized locations table
    let locationId = null;
    if (country.trim() || city.trim() || postalCode.trim()) {
      const { data: locData } = await supabase
        .from('locations')
        .insert([{ 
          country: country.trim() || 'Not specified', 
          city: city.trim() || 'Not specified', 
          postal_code: postalCode.trim() || null 
        }])
        .select()
        .single();
        
      if (locData) {
        locationId = locData.id;
      }
    }

    // 🚨 UPDATED: Removed country, city, and postalCode. Added location_id.
    const payload = {
      first_name: firstName.trim(), 
      last_name: lastName.trim(), 
      contact_number: contactNumber.trim() || null,
      location_id: locationId, 
      batch_id: batch || null, 
      degree_id: degree || null 
    };

    let { data: updatedProfile, error: profileError } = await supabase.from('profiles').update(payload).eq('id', user.id).select();

    if (!profileError && (!updatedProfile || updatedProfile.length === 0)) {
      const { error: insertError } = await supabase.from('profiles').insert([{ ...payload, id: user.id, status: 'Pending' }]);
      if (insertError) profileError = insertError;
    }

    if (profileError) { 
      alert("Error saving profile. Please try again."); 
      setIsSubmitting(false); return;
    }

    if (selectedSkills.length > 0) {
      await supabase.from('profile_skills').insert(selectedSkills.map(skill => ({ profile_id: user.id, skill_id: skill.id })));
    }

    setIsSubmitting(false);
    window.location.href = '/'; 
  }

  const isStep1Valid = firstName.trim() && lastName.trim() && degree && batch;

  return (
    <div className="page-container" style={{ maxWidth: '700px', marginTop: '48px' }}>
      
      {/* 🚨 REPLACED HARDCODED MODAL WITH REUSABLE COMPONENT */}
      <AddSkillModal 
        isOpen={showSkillModal} 
        onClose={() => setShowSkillModal(false)} 
        onAddSkill={handleAddSkill} 
        existingSkills={selectedSkills.map(s => s.name)} 
      />

      <div className="card p-0 flex-col overflow-hidden">
        
        <div className="flex-between p-24" style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--card-bg)' }}>
          <h2 className="m-0">Set Up Your Profile</h2>
          <span className="text-secondary font-bold text-sm">Step {step} of 3</span>
        </div>

        <div className="p-32">
          
          {step === 1 && (
            <div className="flex-col gap-24">
              <h3 className="m-0">Basic Information</h3>
              <div className="form-grid-2">
                <div className="flex-col gap-8">
                  <label className="font-bold text-sm">First Name *</label>
                  <input type="text" className="search-input w-full" value={firstName} onChange={e => setFirstName(e.target.value)} required />
                </div>
                <div className="flex-col gap-8">
                  <label className="font-bold text-sm">Last Name *</label>
                  <input type="text" className="search-input w-full" value={lastName} onChange={e => setLastName(e.target.value)} required />
                </div>
              </div>
              <div className="form-grid-2">
                <div className="flex-col gap-8">
                  <label className="font-bold text-sm">Degree *</label>
                  <select className="search-input w-full" value={degree} onChange={e => setDegree(e.target.value)} required>
                    <option value="" disabled>Select a Degree</option>
                    {degreeOptions.map(d => <option key={d.id} value={d.id}>{d.abbreviation ? `${d.abbreviation} - ${d.name}` : d.name}</option>)}
                  </select>
                </div>
                <div className="flex-col gap-8">
                  <label className="font-bold text-sm">Batch *</label>
                  <select className="search-input w-full" value={batch} onChange={e => setBatch(e.target.value)} required>
                    <option value="" disabled>Select a Batch</option>
                    {batchOptions.map(b => <option key={b.id} value={b.id}>Batch {b.batch_number}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex-col gap-24">
              <h3 className="m-0">Contact & Location</h3>
              <div className="flex-col gap-8">
                <label className="font-bold text-sm">Contact Number</label>
                <input type="tel" className="search-input w-full" value={contactNumber} onChange={e => setContactNumber(e.target.value)} placeholder="e.g. +1 234 567 8900" />
              </div>
              <div className="form-grid-3">
                <div className="flex-col gap-8">
                  <label className="font-bold text-sm">Country</label>
                  <input type="text" className="search-input w-full" value={country} onChange={e => setCountry(e.target.value)} placeholder="e.g. USA" />
                </div>
                <div className="flex-col gap-8">
                  <label className="font-bold text-sm">City</label>
                  <input type="text" className="search-input w-full" value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. New York" />
                </div>
                <div className="flex-col gap-8">
                  <label className="font-bold text-sm">Postal Code</label>
                  <input type="text" className="search-input w-full" value={postalCode} onChange={e => setPostalCode(e.target.value)} placeholder="e.g. 10001" />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex-col gap-24">
              <div className="flex-between align-center">
                <h3 className="m-0">Skills</h3>
                <button type="button" className="btn-outline btn-sm" onClick={() => setShowSkillModal(true)}>+ Add Skill</button>
              </div>

              <div className="flex-row-wrap gap-8 mt-8">
                {selectedSkills.map(skill => <SkillBadge key={skill.id} skill={skill} onRemove={() => removeSkill(skill.id)} />)}
                {selectedSkills.length === 0 && <span className="text-secondary text-sm italic">No skills added yet. Click "+ Add Skill" to select from the list.</span>}
              </div>
            </div>
          )}
        </div>

        <div className="flex-between align-center p-24" style={{ borderTop: '1px solid var(--border-color)', background: 'var(--card-bg)' }}>
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