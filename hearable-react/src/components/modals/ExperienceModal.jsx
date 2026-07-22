import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../supabaseClient';

export default function ExperienceModal({ isOpen, onClose, userId, onSuccess, initialData }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [allSkills, setAllSkills] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]); 
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setTitle(initialData.title || '');
        setDescription(initialData.description || '');
        if (initialData.work_experience_skills) {
          const loadedSkills = initialData.work_experience_skills.map(ws => ws.skills);
          setSelectedSkills(loadedSkills);
        } else {
          setSelectedSkills([]);
        }
      } else {
        setTitle('');
        setDescription('');
        setSelectedSkills([]);
      }
      setSearchTerm('');
      fetchAllSkills();
    }
  }, [isOpen, initialData]);

  async function fetchAllSkills() {
    const { data } = await supabase.from('skills').select('id, name').order('name');
    if (data) setAllSkills(data);
  }

  const availableSkills = useMemo(() => {
    return allSkills.filter(skill => !selectedSkills.find(s => s.id === skill.id));
  }, [allSkills, selectedSkills]);

  const displayedSkills = useMemo(() => {
    if (!searchTerm.trim()) return availableSkills;
    return availableSkills.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [searchTerm, availableSkills]);

  const handleSelectSkill = (skillObj) => {
    setSelectedSkills(prev => [...prev, skillObj]);
    setSearchTerm('');
    setIsDropdownOpen(false);     
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      let expId = initialData?.id;

      if (expId) {
        // Edit mode
        await supabase.from('work_experiences').update({ title, description }).eq('id', expId);
        // Clear old skills mapping to replace with current selection
        await supabase.from('work_experience_skills').delete().eq('work_experience_id', expId);
      } else {
        // Add mode
        const { data: expData, error: expError } = await supabase
          .from('work_experiences')
          .insert([{ profile_id: userId, title, description }])
          .select()
          .single();
        if (expError) throw expError;
        expId = expData.id;
      }

      // Re-insert skills
      if (selectedSkills.length > 0) {
        const skillInserts = selectedSkills.map(skill => ({
          work_experience_id: expId,
          skill_id: skill.id
        }));
        await supabase.from('work_experience_skills').insert(skillInserts);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      alert('Failed to save experience.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div className="card p-32" style={{ width: '100%', maxWidth: '600px', overflow: 'visible' }}>
        <h2 className="m-0 mb-24 text-2xl">{initialData ? 'Edit' : 'Add'} Experience</h2>
        
        <form onSubmit={handleSave} className="flex-col gap-16">
          <div>
            <label className="font-bold text-sm block mb-8">Job Title *</label>
            <input required type="text" className="search-input w-full" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div>
            <label className="font-bold text-sm block mb-8">Description</label>
            <textarea className="search-input w-full" value={description} onChange={(e) => setDescription(e.target.value)} style={{ minHeight: '100px', resize: 'vertical' }} />
          </div>

          <div>
            <label className="font-bold text-sm block mb-8">Tag Skills Acquired (Optional)</label>
            
            {selectedSkills.length > 0 && (
              <div className="flex-row-wrap gap-8 mb-12">
                {selectedSkills.map(skill => (
                  <span key={skill.id} className="badge badge-neutral flex-row align-center gap-8">
                    {skill.name}
                    <button type="button" onClick={() => setSelectedSkills(prev => prev.filter(s => s.id !== skill.id))} style={{ background: 'none', border: 'none', color: 'var(--secondary-text)', cursor: 'pointer', padding: '0 0 0 4px', fontSize: '1.1rem', fontWeight: 'bold' }}>×</button>
                  </span>
                ))}
              </div>
            )}

            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                value={searchTerm} 
                onChange={(e) => { setSearchTerm(e.target.value); setIsDropdownOpen(true); }} 
                onFocus={() => setIsDropdownOpen(true)} 
                onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                placeholder="Search and link a skill..." 
                className="search-input w-full" 
                autoComplete="off" 
              />
              {isDropdownOpen && displayedSkills.length > 0 && (
                <ul style={{ position: 'absolute', top: '100%', left: 0, right: 0, maxHeight: '160px', overflowY: 'auto', backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', marginTop: '4px', padding: 0, listStyle: 'none', zIndex: 1010 }}>
                  {displayedSkills.map((skill) => (
                    <li key={skill.id} onClick={() => handleSelectSkill(skill)} style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6' }} onMouseEnter={(e) => e.target.style.backgroundColor = '#f9fafb'} onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}>{skill.name}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="flex-row gap-12 mt-16" style={{ justifyContent: 'flex-end' }}>
            <button type="button" className="btn-outline" onClick={onClose} disabled={isSaving}>Cancel</button>
            <button type="submit" className="btn-black" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}