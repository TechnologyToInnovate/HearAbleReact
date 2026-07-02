import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function EditProfileModal({ isOpen, onClose, userId, onSuccess }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [headline, setHeadline] = useState(''); 
  const [degree, setDegree] = useState(''); 
  const [batch, setBatch] = useState('');   
  
  const [email, setEmail] = useState('');
  const [contactNumber, setContactNumber] = useState(''); 
  
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  
  // DROPDOWN OPTIONS STATE
  const [degreeOptions, setDegreeOptions] = useState([]);
  const [batchOptions, setBatchOptions] = useState([]);
  const [databaseSkills, setDatabaseSkills] = useState([]); 

  // SKILLS STATE
  const [selectedSkills, setSelectedSkills] = useState([]); 
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [skillInput, setSkillInput] = useState(''); 

  useEffect(() => {
    if (!isOpen || !userId) return;

    async function loadProfile() {
      setIsLoading(true);
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) setEmail(authUser.email);

      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          profile_skills (
            skills ( id, name )
          )
        `)
        .eq('id', userId)
        .single();
      
      if (data && !error) {
        setFirstName(data.first_name || '');
        setLastName(data.last_name || '');
        setHeadline(data.headline || '');
        setContactNumber(data.contact_number || '');
        setCountry(data.country || '');
        setCity(data.city || '');
        setPostalCode(data.postal_code || '');
        setBatch(data.batch_id || '');
        setDegree(data.degree_id || '');
        
        if (data.profile_skills) {
          setSelectedSkills(data.profile_skills.map(ps => ({
            id: ps.skills.id,
            name: ps.skills.name
          })));
        } else {
          setSelectedSkills([]);
        }
      }

      const [degRes, batchRes, skillsRes] = await Promise.all([
        supabase.from('degrees').select('*').order('name'),
        supabase.from('batches').select('*').order('batch_number', { ascending: false }),
        supabase.from('skills').select('*').order('name')
      ]);
      
      if (degRes.data) setDegreeOptions(degRes.data);
      if (batchRes.data) setBatchOptions(batchRes.data);
      if (skillsRes.data) setDatabaseSkills(skillsRes.data);

      setIsLoading(false);
    }
    loadProfile();
  }, [isOpen, userId]);

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

  async function handleSaveChanges(e) {
    e.preventDefault();
    setIsSaving(true);

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        first_name: firstName.trim(), 
        last_name: lastName.trim(),
        headline: headline.trim(),
        contact_number: contactNumber.trim(),
        country: country.trim(),
        city: city.trim(),
        postal_code: postalCode.trim(),
        batch_id: batch,
        degree_id: degree 
      })
      .eq('id', userId);

    if (profileError) { 
      alert("Error saving profile: " + profileError.message); 
      setIsSaving(false);
      return; 
    }

    await supabase.from('profile_skills').delete().eq('profile_id', userId);
    
    if (selectedSkills.length > 0) {
      const profileSkillsData = selectedSkills.map(skill => ({
        profile_id: userId,
        skill_id: skill.id
      }));
      await supabase.from('profile_skills').insert(profileSkillsData);
    }

    setIsSaving(false);
    if (onSuccess) onSuccess();
    onClose(); 
  }

  if (!isOpen) return null;

  const mainOverlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' };
  const subModalOverlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '20px' };

  const availableSkills = databaseSkills.filter(
    dbSkill => !selectedSkills.some(selected => selected.id === dbSkill.id)
  );

  return (
    <div style={mainOverlayStyle}>
      
      {showSkillModal && (
        <div style={subModalOverlayStyle}>
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

      <div className="card p-0" style={{ width: '100%', maxWidth: '700px', maxHeight: '90vh', background: 'var(--bg-color)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        <div className="flex-between" style={{ padding: '24px 32px', borderBottom: '1px solid var(--border-color)', background: 'var(--card-bg)' }}>
          <h2 style={{ margin: 0 }}>Edit Profile</h2>
          <button className="btn-outline btn-sm" onClick={onClose}>✕ Close</button>
        </div>

        <div style={{ padding: '32px', overflowY: 'auto' }}>
          {isLoading ? (
            <p className="text-secondary text-center">Loading profile...</p>
          ) : (
            <form onSubmit={handleSaveChanges} className="flex-col gap-24">
              
              <div className="flex-col gap-16">
                <h3 style={{ margin: 0 }}>Basic Information</h3>
                <div className="form-grid-2">
                  <div><label className="mb-8" style={{ display: 'block', fontWeight: '500' }}>First Name *</label><input type="text" className="search-input w-full" value={firstName} onChange={e => setFirstName(e.target.value)} required /></div>
                  <div><label className="mb-8" style={{ display: 'block', fontWeight: '500' }}>Last Name *</label><input type="text" className="search-input w-full" value={lastName} onChange={e => setLastName(e.target.value)} required /></div>
                </div>
                <div className="form-grid-2">
                  <div>
                    <label className="mb-8" style={{ display: 'block', fontWeight: '500' }}>Degree *</label>
                    <select className="search-input w-full" value={degree} onChange={e => setDegree(e.target.value)} required>
                      <option value="" disabled>Select a Degree</option>
                      {degreeOptions.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.abbreviation ? `${d.abbreviation} - ${d.name}` : d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-8" style={{ display: 'block', fontWeight: '500' }}>Batch *</label>
                    <select className="search-input w-full" value={batch} onChange={e => setBatch(e.target.value)} required>
                      <option value="" disabled>Select a Batch</option>
                      {batchOptions.map(b => (
                        <option key={b.id} value={b.id}>Batch {b.batch_number}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div><label className="mb-8" style={{ display: 'block', fontWeight: '500' }}>Headline</label><input type="text" className="search-input w-full" placeholder="e.g. Computer Science Student at..." value={headline} onChange={e => setHeadline(e.target.value)} /></div>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)' }} />

              <div className="flex-col gap-16">
                <h3 style={{ margin: 0 }}>Contact Information</h3>
                <div className="form-grid-2">
                  <div><label className="mb-8" style={{ display: 'block', fontWeight: '500' }}>Email Address</label><input type="email" className="search-input w-full" value={email} disabled style={{ backgroundColor: 'var(--card-bg)', color: 'var(--secondary-text)', cursor: 'not-allowed' }} /></div>
                  <div><label className="mb-8" style={{ display: 'block', fontWeight: '500' }}>Contact Number</label><input type="tel" className="search-input w-full" placeholder="e.g. +1 234 567 8900" value={contactNumber} onChange={e => setContactNumber(e.target.value)} /></div>
                </div>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)' }} />

              <div className="flex-col gap-16">
                <h3 style={{ margin: 0 }}>Location</h3>
                <div className="form-grid-3">
                  <div><label className="mb-8" style={{ display: 'block', fontWeight: '500' }}>Country</label><input type="text" className="search-input w-full" value={country} onChange={e => setCountry(e.target.value)} placeholder="e.g. USA" /></div>
                  <div><label className="mb-8" style={{ display: 'block', fontWeight: '500' }}>City</label><input type="text" className="search-input w-full" value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. New York" /></div>
                  <div><label className="mb-8" style={{ display: 'block', fontWeight: '500' }}>Postal Code</label><input type="text" className="search-input w-full" value={postalCode} onChange={e => setPostalCode(e.target.value)} placeholder="e.g. 10001" /></div>
                </div>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)' }} />

              <div className="flex-col gap-16">
                <div className="flex-between align-center">
                  <h3 style={{ margin: 0 }}>Skills</h3>
                  <button type="button" className="btn-outline btn-sm" onClick={() => setShowSkillModal(true)}>+ Add</button>
                </div>

                {selectedSkills.length === 0 ? <p className="text-secondary text-sm m-0">No skills added.</p> : (
                  <div className="flex-row-wrap gap-8">
                    {selectedSkills.map(skill => (
                      <span key={skill.id} className="badge badge-primary" style={{ padding: '8px 16px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {skill.name} 
                        <button type="button" onClick={() => removeSkill(skill.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'inherit', fontSize: '1rem', padding: 0 }}>✕</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn-black" disabled={isSaving} style={{ padding: '12px 32px', fontSize: '1.1rem' }}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>

            </form>
          )}
        </div>
      </div>
    </div>
  );
}