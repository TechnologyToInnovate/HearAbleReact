import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../../supabaseClient';

export default function AddSkillModal({ isOpen, onClose, onAddSkill, existingSkills = [], isUpdating = false, userId }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkill, setSelectedSkill] = useState(null);
  
  const [allSkills, setAllSkills] = useState([]);
  const [degreeSkills, setDegreeSkills] = useState([]);
  
  const [isLoadingSkills, setIsLoadingSkills] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const dropdownRef = useRef(null);

  // Fetch skills when the modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setSelectedSkill(null);
      setIsDropdownOpen(false);
      fetchSkillsData();
    }
  }, [isOpen, userId]);

  async function fetchSkillsData() {
    setIsLoadingSkills(true);
    
    // 1. Fetch ALL skills from the database
    const { data: allData } = await supabase
      .from('skills')
      .select('id, name')
      .order('name');
      
    if (allData) setAllSkills(allData);

    // 2. Fetch the user's DEGREE-SPECIFIC skills based on your schema
    if (userId) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('degree_id')
          .eq('id', userId)
          .single();

        if (profile?.degree_id) {
          // Utilizing the foreign key relationship in your degree_skills table
          const { data: recommended } = await supabase
            .from('degree_skills') 
            .select('skills(id, name)')
            .eq('degree_id', profile.degree_id);
            
          if (recommended) {
            // Flattens { skills: { id, name } } into just { id, name }
            const formattedDegreeSkills = recommended.map(item => item.skills);
            setDegreeSkills(formattedDegreeSkills);
          }
        }
      } catch (error) {
        console.error("Could not fetch degree skills:", error);
      }
    }
    
    setIsLoadingSkills(false);
  }

  // Filter out skills the user already has on their profile
  const unaddedAllSkills = useMemo(() => {
    return allSkills.filter(skill => !existingSkills.includes(skill.name));
  }, [allSkills, existingSkills]);

  const unaddedDegreeSkills = useMemo(() => {
    return degreeSkills.filter(skill => !existingSkills.includes(skill.name));
  }, [degreeSkills, existingSkills]);

  // The logic that swaps between Degree Skills and Global Search
  const displayedSkills = useMemo(() => {
    if (!searchTerm.trim()) {
      // Show degree skills if blank (fallback to all if they have no degree skills mapped)
      return unaddedDegreeSkills.length > 0 ? unaddedDegreeSkills : unaddedAllSkills;
    }
    // Search the global skills table if they type a letter
    return unaddedAllSkills.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [searchTerm, unaddedAllSkills, unaddedDegreeSkills]);

  // Close dropdown if they click outside of it
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectSkill = (skillObj) => {
    setSearchTerm(skillObj.name); 
    setSelectedSkill(skillObj);   
    setIsDropdownOpen(false);     
  };

  const handleSave = () => {
    if (selectedSkill) {
      onAddSkill(selectedSkill);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card p-32" style={{ width: '100%', maxWidth: '450px', margin: '16px', overflow: 'visible' }}>
        <h2 className="m-0 mb-8 text-xl">Add a New Skill</h2>
        <p className="text-secondary m-0 mb-24">Adding skills improves your job matches.</p>
        
        {isLoadingSkills ? (
          <p className="text-secondary mb-24">Loading skills...</p>
        ) : (
          <div style={{ position: 'relative', marginBottom: '24px' }} ref={dropdownRef}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setSelectedSkill(null); // Reset if they edit the text
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              placeholder="Type to search for a skill..."
              disabled={isUpdating}
              className="search-input w-full"
              autoComplete="off"
            />

            {/* The Custom Autocomplete Dropdown */}
            {isDropdownOpen && displayedSkills.length > 0 && (
              <ul style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                maxHeight: '160px', /* Limits to ~4 items to prevent clutter */
                overflowY: 'auto',  /* Enables the native vertical scrollbar */
                backgroundColor: 'var(--card-bg, #ffffff)',
                border: '1px solid var(--border-color, #e5e7eb)',
                borderRadius: '8px',
                marginTop: '4px',
                padding: 0,
                listStyle: 'none',
                zIndex: 1010,
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}>
                {displayedSkills.map((skill) => (
                  <li 
                    key={skill.id}
                    onClick={() => handleSelectSkill(skill)}
                    style={{
                      padding: '10px 12px',
                      cursor: 'pointer',
                      fontSize: '0.95rem',
                      borderBottom: '1px solid var(--border-color, #f3f4f6)'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--hover-bg, #f9fafb)'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    {skill.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        
        <div className="flex-row gap-12" style={{ justifyContent: 'flex-end' }}>
          <button className="btn-outline" onClick={onClose} disabled={isUpdating}>
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