import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Degrees() {
  const navigate = useNavigate();
  const { role } = useAuth(); // 🚨 NEW: Pulling role from context
  const [degrees, setDegrees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [newDegree, setNewDegree] = useState('');
  const [newAbbrev, setNewAbbrev] = useState(''); 
  const [isAdding, setIsAdding] = useState(false);

  // --- EDITING STATE ---
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editAbbrev, setEditAbbrev] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // --- PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (role !== 'admin') {
      navigate('/');
      return;
    }
    fetchDegrees();
  }, [role, navigate]);

  async function fetchDegrees() {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('degrees')
      .select('*')
      .order('name', { ascending: true });
      
    if (data) setDegrees(data);
    if (error) console.error(error);
    setIsLoading(false);
  }

  async function handleAddDegree(e) {
    e.preventDefault();
    if (!newDegree.trim()) return;
    
    setIsAdding(true);
    const { error } = await supabase.from('degrees').insert([{ 
      name: newDegree.trim(),
      abbreviation: newAbbrev.trim() || null 
    }]);
    
    setIsAdding(false);
    if (!error) {
      setNewDegree('');
      setNewAbbrev('');
      setCurrentPage(1); 
      fetchDegrees();
    } else {
      alert("Failed to add degree. It might already exist!");
    }
  }

  async function handleDeleteDegree(id, name) {
    if (!window.confirm(`Are you sure you want to delete the degree: ${name}?`)) return;
    
    const { error } = await supabase.from('degrees').delete().eq('id', id);
    if (!error) {
      setDegrees(degrees.filter(d => d.id !== id));
      if (currentDegrees.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } else {
      alert("Failed to delete degree.");
    }
  }

  // --- EDIT FUNCTIONS ---
  function startEditing(degree) {
    setEditingId(degree.id);
    setEditName(degree.name);
    setEditAbbrev(degree.abbreviation || '');
  }

  function cancelEditing() {
    setEditingId(null);
    setEditName('');
    setEditAbbrev('');
  }

  async function handleSaveEdit(id) {
    if (!editName.trim()) return;
    
    setIsSavingEdit(true);
    const updatedData = { 
      name: editName.trim(), 
      abbreviation: editAbbrev.trim() || null 
    };

    const { error } = await supabase
      .from('degrees')
      .update(updatedData)
      .eq('id', id);

    setIsSavingEdit(false);

    if (!error) {
      // Update local state to reflect changes instantly without refetching
      setDegrees(degrees.map(d => d.id === id ? { ...d, ...updatedData } : d).sort((a, b) => a.name.localeCompare(b.name)));
      cancelEditing();
    } else {
      alert("Failed to update degree.");
    }
  }

  // --- PAGINATION LOGIC ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentDegrees = degrees.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(degrees.length / itemsPerPage);

  return (
    <div className="page-container" style={{ maxWidth: '800px' }}>
      <div className="flex-between mb-24">
        <h1 style={{ margin: 0 }}>Manage Degrees</h1>
      </div>

      <div className="card p-24 mb-32">
        <h3 className="mb-16 m-0">Add New Degree</h3>
        <form onSubmit={handleAddDegree} className="flex-row gap-16 align-center">
          <input 
            type="text" 
            className="search-input" 
            placeholder="Abbrev (Optional)" 
            value={newAbbrev} 
            onChange={(e) => setNewAbbrev(e.target.value)} 
            style={{ width: '160px' }}
          />
          <input 
            type="text" 
            className="search-input w-full" 
            placeholder="Degree Name (e.g. Computer Science)" 
            value={newDegree} 
            onChange={(e) => setNewDegree(e.target.value)} 
            required
          />
          <button type="submit" className="btn-black" disabled={isAdding} style={{ whiteSpace: 'nowrap' }}>
            {isAdding ? 'Adding...' : '+ Add Degree'}
          </button>
        </form>
      </div>

      <div className="card p-0" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', background: 'var(--card-bg)' }}>
          <h3 className="m-0">Current Degrees</h3>
        </div>
        
        {isLoading ? (
          <p className="text-secondary text-center p-24 m-0">Loading degrees...</p>
        ) : degrees.length > 0 ? (
          <div className="flex-col">
            {currentDegrees.map((degree, index) => (
              <div key={degree.id} className="flex-between" style={{ padding: '16px 24px', borderBottom: index !== currentDegrees.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                
                {editingId === degree.id ? (
                  // EDIT MODE
                  <div className="flex-row gap-12 align-center w-full">
                    <input 
                      type="text" 
                      className="search-input" 
                      style={{ width: '120px', padding: '6px 12px' }} 
                      placeholder="Abbrev" 
                      value={editAbbrev} 
                      onChange={(e) => setEditAbbrev(e.target.value)} 
                    />
                    <input 
                      type="text" 
                      className="search-input w-full" 
                      style={{ padding: '6px 12px' }} 
                      placeholder="Degree Name" 
                      value={editName} 
                      onChange={(e) => setEditName(e.target.value)} 
                      required 
                    />
                    <div className="flex-row gap-8">
                      <button className="btn-black btn-sm" onClick={() => handleSaveEdit(degree.id)} disabled={isSavingEdit}>
                        {isSavingEdit ? '...' : 'Save'}
                      </button>
                      <button className="btn-outline btn-sm" onClick={cancelEditing} disabled={isSavingEdit}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  // DISPLAY MODE
                  <>
                    <span style={{ fontWeight: '500', fontSize: '1.05rem' }}>
                      {degree.abbreviation && <strong style={{ color: 'var(--primary-color)', marginRight: '8px' }}>[{degree.abbreviation}]</strong>}
                      {degree.name}
                    </span>
                    <div className="flex-row gap-12">
                      <button 
                        onClick={() => startEditing(degree)}
                        style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontWeight: '500' }}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteDegree(degree.id, degree.name)}
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
          <p className="text-secondary text-center p-24 m-0">No degrees have been added yet.</p>
        )}

        {/* --- PAGINATION CONTROLS --- */}
        {totalPages > 1 && (
          <div className="flex-between align-center" style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', background: 'var(--card-bg)' }}>
            <p className="text-sm text-secondary" style={{ margin: 0 }}>
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, degrees.length)} of {degrees.length} degrees
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