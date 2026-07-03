import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Skills() {
  const { role } = useAuth();
  const navigate = useNavigate();

  const [skills, setSkills] = useState([]);
  const [degrees, setDegrees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- ADDING STATE ---
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillDegree, setNewSkillDegree] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // --- EDITING STATE ---
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDegree, setEditDegree] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // --- PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (role !== 'admin') {
      navigate('/');
      return;
    }
    fetchData();
  }, [role, navigate]);

  async function fetchData() {
    setIsLoading(true);
    
    const { data: skillsData } = await supabase
      .from('skills')
      .select('*, degrees(name, abbreviation)')
      .order('name', { ascending: true });
      
    const { data: degreesData } = await supabase
      .from('degrees')
      .select('*')
      .order('name', { ascending: true });

    if (skillsData) setSkills(skillsData);
    if (degreesData) setDegrees(degreesData);
    
    setIsLoading(false);
  }

  async function handleAddSkill(e) {
    e.preventDefault();
    if (!newSkillName.trim()) return;
    
    setIsAdding(true);
    const { error } = await supabase.from('skills').insert([{ 
      name: newSkillName.trim(),
      degree_id: newSkillDegree || null 
    }]);
    
    setIsAdding(false);
    if (!error) {
      setNewSkillName('');
      setNewSkillDegree('');
      setCurrentPage(1); 
      fetchData();
    } else {
      alert("Failed to add skill. It might already exist!");
    }
  }

  async function handleDeleteSkill(id, name) {
    if (!window.confirm(`Are you sure you want to delete the skill: ${name}? This will remove it from all users and jobs.`)) return;
    
    const { error } = await supabase.from('skills').delete().eq('id', id);
    if (!error) {
      setSkills(skills.filter(s => s.id !== id));
      if (currentSkills.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } else {
      alert("Failed to delete skill.");
    }
  }

  // --- EDIT FUNCTIONS ---
  function startEditing(skill) {
    setEditingId(skill.id);
    setEditName(skill.name);
    setEditDegree(skill.degree_id || '');
  }

  function cancelEditing() {
    setEditingId(null);
    setEditName('');
    setEditDegree('');
  }

  async function handleSaveEdit(id) {
    if (!editName.trim()) return;
    
    setIsSavingEdit(true);
    const updatedData = { 
      name: editName.trim(), 
      degree_id: editDegree || null 
    };

    const { error } = await supabase
      .from('skills')
      .update(updatedData)
      .eq('id', id);

    setIsSavingEdit(false);

    if (!error) {
      const linkedDegree = degrees.find(d => d.id === editDegree) || null;
      setSkills(skills.map(s => s.id === id ? { ...s, ...updatedData, degrees: linkedDegree } : s).sort((a, b) => a.name.localeCompare(b.name)));
      cancelEditing();
    } else {
      alert("Failed to update skill.");
    }
  }

  // --- PAGINATION LOGIC ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSkills = skills.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(skills.length / itemsPerPage);

  return (
    <div className="page-container" style={{ maxWidth: '800px' }}>
      
      {/* Header without Back Button */}
      <div className="flex-between align-center mb-24">
        <div className="flex-row gap-16 align-center">
          <h1 className="m-0">Manage Skills</h1>
        </div>
      </div>

      <div className="card p-24 mb-32">
        <h3 className="mb-16 m-0">Add New Skill</h3>
        <form onSubmit={handleAddSkill} className="flex-row gap-16 align-center" style={{ flexWrap: 'wrap' }}>
          <input 
            type="text" 
            className="search-input" 
            style={{ flex: 1, minWidth: '200px' }}
            placeholder="Skill Name (e.g. ReactJS)" 
            value={newSkillName} 
            onChange={(e) => setNewSkillName(e.target.value)} 
            required
          />
          <select 
            className="search-input" 
            style={{ flex: 1, minWidth: '200px' }}
            value={newSkillDegree} 
            onChange={(e) => setNewSkillDegree(e.target.value)}
          >
            <option value="">No Linked Degree (General Skill)</option>
            {degrees.map(d => (
              <option key={d.id} value={d.id}>
                {d.abbreviation ? `${d.abbreviation} - ${d.name}` : d.name}
              </option>
            ))}
          </select>
          <button type="submit" className="btn-black" disabled={isAdding} style={{ whiteSpace: 'nowrap' }}>
            {isAdding ? 'Adding...' : '+ Add Skill'}
          </button>
        </form>
      </div>

      <div className="card p-0" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', background: 'var(--card-bg)' }}>
          <h3 className="m-0">Skill Database</h3>
        </div>
        
        {isLoading ? (
          <p className="text-secondary text-center p-24 m-0">Loading skills...</p>
        ) : skills.length > 0 ? (
          <div className="flex-col">
            {currentSkills.map((skill, index) => (
              <div key={skill.id} className="flex-between align-center" style={{ padding: '16px 24px', borderBottom: index !== currentSkills.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                
                {editingId === skill.id ? (
                  // EDIT MODE
                  <div className="flex-row gap-12 align-center w-full" style={{ flexWrap: 'wrap' }}>
                    <input 
                      type="text" 
                      className="search-input" 
                      style={{ flex: 1, padding: '6px 12px', minWidth: '150px' }} 
                      placeholder="Skill Name" 
                      value={editName} 
                      onChange={(e) => setEditName(e.target.value)} 
                      required 
                    />
                    <select 
                      className="search-input" 
                      style={{ flex: 1, padding: '6px 12px', minWidth: '150px' }}
                      value={editDegree} 
                      onChange={(e) => setEditDegree(e.target.value)}
                    >
                      <option value="">No Linked Degree</option>
                      {degrees.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.abbreviation ? `${d.abbreviation} - ${d.name}` : d.name}
                        </option>
                      ))}
                    </select>
                    <div className="flex-row gap-8">
                      <button className="btn-black btn-sm" onClick={() => handleSaveEdit(skill.id)} disabled={isSavingEdit}>
                        {isSavingEdit ? '...' : 'Save'}
                      </button>
                      <button className="btn-outline btn-sm" onClick={cancelEditing} disabled={isSavingEdit}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  // DISPLAY MODE
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <span style={{ fontWeight: '500', fontSize: '1.05rem' }}>
                        {skill.name}
                      </span>
                      {skill.degrees ? (
                        <span className="badge badge-info" style={{ fontSize: '0.75rem', padding: '4px 8px' }}>Linked: {skill.degrees.abbreviation || skill.degrees.name}</span>
                      ) : (
                        <span className="badge badge-neutral" style={{ fontSize: '0.75rem', padding: '4px 8px' }}>General</span>
                      )}
                    </div>
                    <div className="flex-row gap-12 ml-16">
                      <button 
                        onClick={() => startEditing(skill)}
                        style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontWeight: '500' }}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteSkill(skill.id, skill.name)}
                        style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontWeight: '500' }}
                      >
                        Remove
                      </button>
                    </div>
                  </>
                )}

              </div>
            ))}
          </div>
        ) : (
          <p className="text-secondary text-center p-24 m-0">No skills have been added yet.</p>
        )}

        {/* --- PAGINATION CONTROLS --- */}
        {totalPages > 1 && (
          <div className="flex-between align-center" style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', background: 'var(--card-bg)' }}>
            <p className="text-sm text-secondary" style={{ margin: 0 }}>
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, skills.length)} of {skills.length} skills
            </p>
            <div className="flex-row gap-8">
              <button 
                className="btn-outline btn-sm" 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <button 
                className="btn-outline btn-sm" 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}