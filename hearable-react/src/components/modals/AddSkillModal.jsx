import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

export default function AddSkillModal({ isOpen, onClose, onAddSkill, existingSkills = [], isUpdating = false }) {
  const [selectedSkill, setSelectedSkill] = useState('');
  const [availableSkills, setAvailableSkills] = useState([]);
  const [isLoadingSkills, setIsLoadingSkills] = useState(false);

  // Fetch the skills from the database whenever the modal opens
  useEffect(() => {
    if (isOpen) {
      fetchAllSkills();
      setSelectedSkill(''); // Reset the dropdown each time it opens
    }
  }, [isOpen]);

  async function fetchAllSkills() {
    setIsLoadingSkills(true);
    const { data, error } = await supabase
      .from('skills')
      .select('id, name')
      .order('name');
      
    if (!error && data) {
      setAvailableSkills(data);
    }
    setIsLoadingSkills(false);
  }

  // Hide the modal if it's not open
  if (!isOpen) return null;

  // Filter out skills the user already has so they don't show up in the dropdown
  const unaddedSkills = availableSkills.filter(skill => !existingSkills.includes(skill.name));

  const handleSave = () => {
    // Find the full skill object (with ID and name) and pass it back to the parent
    const skillObj = availableSkills.find(s => s.name === selectedSkill);
    if (skillObj) {
      onAddSkill(skillObj);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card p-32" style={{ width: '100%', maxWidth: '450px', margin: '16px' }}>
        <h2 className="m-0 mb-8 text-xl">Add a New Skill</h2>
        <p className="text-secondary m-0 mb-24">Adding skills improves your job matches.</p>
        
        {isLoadingSkills ? (
          <p className="text-secondary mb-24">Loading skills...</p>
        ) : (
          <select
            value={selectedSkill}
            onChange={(e) => setSelectedSkill(e.target.value)}
            disabled={isUpdating}
            style={{ 
              width: '100%',
              padding: '12px 14px',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              fontSize: '1rem',
              marginBottom: '24px',
              backgroundColor: 'var(--bg-color)',
              color: 'var(--text-color)',
              cursor: 'pointer'
            }}
          >
            <option value="">-- Select a skill --</option>
            {unaddedSkills.map(skill => (
              <option key={skill.id} value={skill.name}>
                {skill.name}
              </option>
            ))}
          </select>
        )}
        
        <div className="flex-row gap-12" style={{ justifyContent: 'flex-end' }}>
          <button 
            className="btn-outline" 
            onClick={onClose}
            disabled={isUpdating}
          >
            Cancel
          </button>
          <button 
            className="btn-black" 
            onClick={handleSave}
            disabled={!selectedSkill || isUpdating || isLoadingSkills} 
          >
            {isUpdating ? 'Saving...' : 'Save Skill'}
          </button>
        </div>
      </div>
    </div>
  );
}