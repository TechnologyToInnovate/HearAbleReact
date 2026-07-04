import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import AddSkillModal from './AddSkillModal';
import Avatar from '../common/Avatar'; // 🚨 Added Avatar import

export default function EditProfileModal({ isOpen, onClose, userId, onSuccess }) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    profile_pic: '', // 🚨 Added profile_pic state
    headline: '',
    city: '',
    country: '',
    contact_number: '',
    skills: []
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddSkillPopup, setShowAddSkillPopup] = useState(false);

  // Fetch the latest user data whenever the modal is opened
  useEffect(() => {
    if (isOpen && userId) {
      fetchUserData();
    }
  }, [isOpen, userId]);

  async function fetchUserData() {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select(`*, profile_skills ( skills ( name ) )`)
      .eq('id', userId)
      .maybeSingle();

    if (data && !error) {
      setFormData({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        profile_pic: data.profile_pic || '', // 🚨 Load existing pic URL
        headline: data.headline || '',
        city: data.city || '',
        country: data.country || '',
        contact_number: data.contact_number || '',
        skills: data.profile_skills ? data.profile_skills.map(ps => ps.skills.name) : []
      });
    }
    setIsLoading(false);
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- SKILL HANDLERS (Local State Only) ---
  const handleAddSkillToForm = (skillObj) => {
    setFormData(prev => ({
      ...prev,
      skills: [...(prev.skills || []), skillObj.name]
    }));
    setShowAddSkillPopup(false);
  };

  const handleRemoveSkillFromForm = (skillToRemove) => {
    setFormData(prev => ({
      ...prev,
      skills: (prev.skills || []).filter(skill => skill !== skillToRemove)
    }));
  };

  // --- SAVE EVERYTHING ---
  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // 1. Update basic profile info
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          profile_pic: formData.profile_pic, // 🚨 Save the new URL to database
          headline: formData.headline,
          city: formData.city,
          country: formData.country,
          contact_number: formData.contact_number
        })
        .eq('id', userId);

      if (profileError) throw profileError;

      // 2. Synchronize Skills
      if (formData.skills.length > 0) {
        // Find the IDs for the skills currently in the form
        const { data: skillsData } = await supabase
          .from('skills')
          .select('id, name')
          .in('name', formData.skills);

        // Delete all old skill links for this user
        await supabase
          .from('profile_skills')
          .delete()
          .eq('profile_id', userId);

        // Insert the newly updated list of skill links
        if (skillsData && skillsData.length > 0) {
          const skillInserts = skillsData.map(skill => ({
            profile_id: userId,
            skill_id: skill.id
          }));
          await supabase.from('profile_skills').insert(skillInserts);
        }
      } else {
        // If they removed all skills, just clear the table
        await supabase.from('profile_skills').delete().eq('profile_id', userId);
      }

      // Success! Refresh the profile page and close modal
      onSuccess(); 
      onClose(); 
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      
      {/* Our Reusable Add Skill Modal sits on top! */}
      <AddSkillModal 
        isOpen={showAddSkillPopup}
        onClose={() => setShowAddSkillPopup(false)}
        onAddSkill={handleAddSkillToForm}
        existingSkills={formData.skills || []} 
        isUpdating={false} 
      />

      <div className="card p-32" style={{ width: '100%', maxWidth: '600px', margin: '16px', maxHeight: '90vh', overflowY: 'auto' }}>
        <h2 className="m-0 mb-24 text-2xl">Edit Profile</h2>

        {isLoading ? (
          <p className="text-center text-secondary">Loading your information...</p>
        ) : (
          <form onSubmit={handleSave} className="flex-col gap-24">
            
            {/* 🚨 NEW PROFILE PIC SECTION 🚨 */}
            <div className="flex-col gap-8">
              <label className="font-medium">Profile Picture URL</label>
              <div className="flex-row gap-16 align-center">
                <Avatar 
                  src={formData.profile_pic} 
                  fallbackName={formData.first_name || 'User'} 
                  size="md" 
                  type="user" 
                />
                <div className="w-full">
                  <input 
                    type="url" 
                    name="profile_pic" 
                    value={formData.profile_pic} 
                    onChange={handleChange} 
                    placeholder="Paste an image link (e.g., https://imgur.com/image.jpg)" 
                    className="input-field w-full" 
                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', width: '100%' }} 
                  />
                </div>
              </div>
            </div>

            {/* Basic Info */}
            <div className="flex-row gap-16 flex-wrap">
              <div className="flex-col gap-8" style={{ flex: 1, minWidth: '200px' }}>
                <label className="font-medium">First Name</label>
                <input required type="text" name="first_name" value={formData.first_name} onChange={handleChange} className="input-field" style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
              </div>
              <div className="flex-col gap-8" style={{ flex: 1, minWidth: '200px' }}>
                <label className="font-medium">Last Name</label>
                <input required type="text" name="last_name" value={formData.last_name} onChange={handleChange} className="input-field" style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
              </div>
            </div>

            <div className="flex-col gap-8">
              <label className="font-medium">Headline</label>
              <input type="text" name="headline" value={formData.headline} onChange={handleChange} placeholder="e.g. Senior Frontend Developer" className="input-field" style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
            </div>

            {/* Location & Contact */}
            <div className="flex-row gap-16 flex-wrap">
              <div className="flex-col gap-8" style={{ flex: 1, minWidth: '150px' }}>
                <label className="font-medium">City</label>
                <input type="text" name="city" value={formData.city} onChange={handleChange} className="input-field" style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
              </div>
              <div className="flex-col gap-8" style={{ flex: 1, minWidth: '150px' }}>
                <label className="font-medium">Country</label>
                <input type="text" name="country" value={formData.country} onChange={handleChange} className="input-field" style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
              </div>
            </div>

            <div className="flex-col gap-8">
              <label className="font-medium">Contact Number</label>
              <input type="tel" name="contact_number" value={formData.contact_number} onChange={handleChange} className="input-field" style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
            </div>

            {/* SKILLS SECTION */}
            <div className="mb-8 mt-8">
              <div className="flex-between align-center mb-8 gap-16">
                <label className="m-0 font-medium">Skills</label>
                <button 
                  type="button" 
                  className="btn-outline btn-sm" 
                  onClick={() => setShowAddSkillPopup(true)}
                  style={{ padding: '4px 12px' }}
                >
                  + Add Skill
                </button>
              </div>
              
              <div className="flex-row-wrap gap-12 p-16" style={{ border: '1px solid var(--border-color)', borderRadius: '8px', minHeight: '60px' }}>
                {formData.skills && formData.skills.length > 0 ? (
                  formData.skills.map((skill, index) => (
                    <span 
                      key={index} 
                      className="badge badge-neutral flex-row align-center gap-8"
                      style={{ padding: '6px 12px', fontSize: '0.9rem', display: 'inline-flex' }}
                    >
                      {skill}
                      <button 
                        type="button"
                        onClick={() => handleRemoveSkillFromForm(skill)}
                        style={{ 
                          background: 'none', 
                          border: 'none', 
                          color: 'var(--secondary-text)', 
                          cursor: 'pointer', 
                          padding: '0 0 0 4px',
                          fontSize: '1.1rem',
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        title="Remove skill"
                      >
                        ×
                      </button>
                    </span>
                  ))
                ) : (
                  <p className="text-secondary m-0 text-sm">No skills added yet.</p>
                )}
              </div>
            </div>

            <div className="flex-row gap-12 mt-16" style={{ justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
              <button type="button" className="btn-outline" onClick={onClose} disabled={isSaving}>
                Cancel
              </button>
              <button type="submit" className="btn-black" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>

          </form>
        )}
      </div>
    </div>
  );
}