import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function OnboardingModal({ isOpen, userId, onSuccess }) {
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  // Step 1 Fields
  const [name, setName] = useState('');
  const [major, setMajor] = useState('');
  const [bio, setBio] = useState(''); 
  
  // Step 2 Fields
  const [university, setUniversity] = useState('');
  const [skills, setSkills] = useState('');

  if (!isOpen) return null;

  function handleNext(e) {
    e.preventDefault();
    setStep(2);
  }

  async function handleSave(e, isSkipped = false) {
    if (e) e.preventDefault();
    setIsSaving(true);
    
    let skillsArray = [];
    let educationArray = [];

    if (!isSkipped) {
      // 1. Format skills into the new Object structure { name, link }
      if (skills) {
        skillsArray = skills
          .split(',')
          .map(s => ({ name: s.trim(), link: '' }))
          .filter(s => s.name.length > 0);
      }
      
      // 2. Format the university input into the new Education Object structure { name, location }
      if (university) {
        educationArray = [{ name: university, location: 'Not specified' }];
      }
    }

    // Notice we are now passing 'education' instead of 'university'
    const updates = { 
      name, 
      major, 
      bio, 
      education: educationArray, 
      skills: skillsArray 
    };

    const { error } = await supabase.from('profiles').update(updates).eq('id', userId);

    setIsSaving(false);
    
    if (!error) {
      onSuccess(); 
    } else {
      alert("Failed to save profile. Please try again.");
      console.error(error);
    }
  }

  return (
    <div style={{ 
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', 
      zIndex: 9999, padding: '20px' 
    }}>
      <div className="card p-20" style={{ 
        width: '100%', maxWidth: '600px', maxHeight: '90vh', 
        overflowY: 'auto', background: 'var(--bg-color)', 
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' 
      }}>
        
        <div className="text-center mb-24">
          <div className="avatar-lg mb-16" style={{ width: '64px', height: '64px', fontSize: '2rem', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--primary-color)', color: 'white' }}>🎉</div>
          <h2 style={{ margin: '0 0 8px 0' }}>Welcome to Hearable!</h2>
          <p className="text-secondary" style={{ margin: 0 }}>
            {step === 1 ? "Let's set up your profile so companies can discover you." : "Almost done! Add some extra details to stand out."}
          </p>
        </div>
        
        {step === 1 ? (
          <form onSubmit={handleNext} className="flex-col">
            <div>
              <label>Full Name *</label>
              <input type="text" className="search-input" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Jane Doe" />
            </div>
            
            <div>
              <label>Professional Title *</label>
              <input type="text" className="search-input" value={major} onChange={(e) => setMajor(e.target.value)} required placeholder="e.g. Software Engineer" />
            </div>
            
            <div>
              <label>Headline</label>
              <input type="text" className="search-input" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="e.g. Creative problem solver with a passion for web development..." />
            </div>

            <div className="mt-24" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
              <button type="submit" className="btn-black w-full">
                Next →
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={(e) => handleSave(e, false)} className="flex-col">
            <div>
              <label>University / Alma Mater</label>
              <input type="text" className="search-input" value={university} onChange={(e) => setUniversity(e.target.value)} placeholder="e.g. State University" />
            </div>
            
            <div>
              <label>Top Skills (comma separated)</label>
              <input type="text" className="search-input" value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="e.g. React, Python, Communication" />
            </div>

            <div className="flex-col mt-24" style={{ gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
              <button type="submit" className="btn-black w-full" disabled={isSaving}>
                {isSaving ? 'Building Profile...' : 'Complete Profile'}
              </button>
              
              <button type="button" className="btn-outline w-full" onClick={(e) => handleSave(e, true)} disabled={isSaving}>
                Skip this step
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}