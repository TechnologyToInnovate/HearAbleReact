import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Batches() {
  const navigate = useNavigate();
  // Retrieve the user's role to enforce admin-only access
  const { role } = useAuth(); 
  
  // State for fetching and displaying the list of batches
  const [batches, setBatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State for the new batch form
  const [newBatch, setNewBatch] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Protect the route: redirect non-admins to the home page
  useEffect(() => {
    if (role !== 'admin') {
      navigate('/');
      return;
    }
    fetchBatches();
  }, [role, navigate]);

  // Fetches the full list of student/talent batches, ordered by batch number descending
  async function fetchBatches() {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('batches')
      .select('*')
      .order('batch_number', { ascending: false }); 
      
    if (data) setBatches(data);
    if (error) console.error(error);
    setIsLoading(false);
  }

  // Input formatter: enforces numeric-only input and a maximum length of 3 digits
  const handleBatchInput = (e) => {
    const val = e.target.value.replace(/\D/g, ''); 
    if (val.length <= 3) setNewBatch(val);
  };

  // Submits a new batch to the database
  async function handleAddBatch(e) {
    e.preventDefault();
    if (!newBatch.trim()) return;
    
    setIsAdding(true);
    const { error } = await supabase.from('batches').insert([{ batch_number: newBatch.trim() }]);
    
    setIsAdding(false);
    if (!error) {
      setNewBatch('');
      setCurrentPage(1); // Reset to the first page so the new entry is immediately visible
      fetchBatches();
    } else {
      alert("Failed to add batch. It might already exist!");
    }
  }

  // Deletes an existing batch and handles edge cases with pagination
  async function handleDeleteBatch(id, batchNumber) {
    if (!window.confirm(`Are you sure you want to delete Batch ${batchNumber}?`)) return;
    
    const { error } = await supabase.from('batches').delete().eq('id', id);
    if (!error) {
      setBatches(batches.filter(b => b.id !== id));
      
      // If the user deletes the last item on the current page, step back one page
      if (currentBatches.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } else {
      alert("Failed to delete batch.");
    }
  }

  // Calculate which items to display on the current pagination page
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentBatches = batches.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(batches.length / itemsPerPage);

  return (
    <div className="page-container" style={{ maxWidth: '800px' }}>
      <div className="flex-between mb-24">
        <h1 style={{ margin: 0 }}>Manage Batches</h1>
      </div>

      {/* --- ADD BATCH FORM --- */}
      <div className="card p-24 mb-32">
        <h3 className="mb-16 m-0">Add New Batch</h3>
        <form onSubmit={handleAddBatch} className="flex-row gap-16 align-center">
          <input 
            type="text" 
            className="search-input w-full" 
            placeholder="e.g. 123" 
            value={newBatch} 
            onChange={handleBatchInput} 
            required
          />
          <button type="submit" className="btn-black" disabled={isAdding} style={{ whiteSpace: 'nowrap' }}>
            {isAdding ? 'Adding...' : '+ Add Batch'}
          </button>
        </form>
      </div>

      {/* --- BATCH LIST --- */}
      <div className="card p-0" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', background: 'var(--card-bg)' }}>
          <h3 className="m-0">Current Batches</h3>
        </div>
        
        {isLoading ? (
          <p className="text-secondary text-center p-24 m-0">Loading batches...</p>
        ) : batches.length > 0 ? (
          <div className="flex-col">
            {currentBatches.map((batch, index) => (
              <div key={batch.id} className="flex-between" style={{ padding: '16px 24px', borderBottom: index !== currentBatches.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                <span style={{ fontWeight: '600', fontSize: '1.05rem', color: 'var(--primary-color)' }}>
                  Batch {batch.batch_number}
                </span>
                <button 
                  onClick={() => handleDeleteBatch(batch.id, batch.batch_number)}
                  style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontWeight: '500' }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-secondary text-center p-24 m-0">No batches have been added yet.</p>
        )}

        {/* --- PAGINATION CONTROLS --- */}
        {totalPages > 1 && (
          <div className="flex-between align-center" style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', background: 'var(--card-bg)' }}>
            <p className="text-sm text-secondary" style={{ margin: 0 }}>
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, batches.length)} of {batches.length} batches
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