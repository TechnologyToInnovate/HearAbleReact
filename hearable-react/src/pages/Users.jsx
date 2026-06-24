import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function Users({ role }) {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // NEW: Multi-select dropdown state
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [statusFilters, setStatusFilters] = useState(['Pending', 'Approved', 'Rejected']); // 'Archived' off by default

  // Form States
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Pre-Approve Variables
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newIdNumber, setNewIdNumber] = useState('');
  const [newMajor, setNewMajor] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setIsLoading(true);
    const { data } = await supabase.from('profiles').select('*').order('name', { ascending: true });
    if (data) setUsers(data);
    setIsLoading(false);
  }

  // --- ADD PRE-APPROVED USER ---
  async function handleAddUser(e) {
    e.preventDefault();
    setIsSubmitting(true);
    
    const { error } = await supabase.from('pre_approved_users').insert([{
      email: newEmail.toLowerCase().trim(),
      name: newName,
      id_number: newIdNumber,
      major: newMajor
    }]);

    if (!error) {
      alert(`Success! ${newEmail} is on the roster.`);
      setNewEmail(''); setNewName(''); setNewIdNumber(''); setNewMajor('');
      setShowAddForm(false);
    } else {
      alert("Failed to pre-approve user. Email might already be on the list.");
    }
    setIsSubmitting(false);
  }

  // --- UNIFIED STATUS HANDLER ---
  async function handleUpdateStatus(e, id, newStatus) {
    e.stopPropagation();
    const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', id);
    if (!error) {
      setUsers(users.map(u => u.id === id ? { ...u, status: newStatus } : u));
    } else {
      alert("Failed to update status.");
      console.error(error);
    }
  }

  // --- DELETE USER ---
  async function handleDeleteUser(e, id) {
    e.stopPropagation(); 
    if (!window.confirm("Are you sure you want to permanently remove this user profile?")) return;

    await supabase.from('applications').delete().eq('applicant_id', id);
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    
    if (!error) {
      setUsers(users.filter(u => u.id !== id));
    } else {
      alert("Failed to remove user.");
      console.error(error);
    }
  }

  // Toggle filter array helper
  function toggleStatusFilter(status) {
    setStatusFilters(prev => 
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  }

  // --- MULTI-FILTER LOGIC ---
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.major && user.major.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.id_number && user.id_number.includes(searchQuery));

    const currentStatus = user.status || 'Pending';
    const matchesFilter = statusFilters.includes(currentStatus);

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="page-container-wide">
      
      {showAddForm && role === 'admin' ? (
        <section className="card p-20 mb-32" style={{ maxWidth: '800px', margin: '0 auto 32px' }}>
          <div className="flex-between mb-24" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
            <h3 style={{ margin: 0 }}>Pre-Approve New User</h3>
            <button className="btn-outline btn-sm" onClick={() => setShowAddForm(false)}>← Cancel</button>
          </div>
          <form onSubmit={handleAddUser} className="flex-col">
            <div className="form-grid-2">
              <div><label>User Email *</label><input type="email" className="search-input" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required /></div>
              <div><label>Full Name *</label><input type="text" className="search-input" value={newName} onChange={(e) => setNewName(e.target.value)} required /></div>
            </div>
            <div className="form-grid-2">
              <div><label>ID Number (8 Digits) *</label><input type="text" className="search-input" value={newIdNumber} onChange={(e) => setNewIdNumber(e.target.value)} required maxLength="8" /></div>
              <div><label>Major / Program</label><input type="text" className="search-input" value={newMajor} onChange={(e) => setNewMajor(e.target.value)} /></div>
            </div>
            <button type="submit" className="btn-black w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Registering...' : 'Add to Pre-Approved Roster'}
            </button>
          </form>
        </section>
      ) : (
        <>
          <div className="flex-between mb-24">
            <h1 style={{ margin: 0 }}>Manage Users</h1>
            {role === 'admin' && (
              <button className="btn-black" onClick={() => setShowAddForm(true)}>+ Add User</button>
            )}
          </div>

          {/* --- SEARCH AND DROPDOWN FILTER BAR --- */}
          <div className="flex-row gap-16 mb-24" style={{ width: '100%', position: 'relative' }}>
            <div className="search-box-wrapper" style={{ flexGrow: 1 }}>
              <span className="search-icon">🔍</span>
              <input type="text" placeholder="Search users by name, ID, or major..." className="search-input" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>

            {/* CUSTOM MULTI-SELECT DROPDOWN */}
            <div style={{ position: 'relative' }}>
              <button className="btn-outline" onClick={() => setShowFilterDropdown(!showFilterDropdown)} style={{ height: '100%', minWidth: '140px' }}>
                ⚙️ Filter Status
              </button>
              
              {showFilterDropdown && (
                <div className="card p-0" style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: '220px', zIndex: 100, boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-color)' }}>
                    <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 'bold' }}>Show Users With Status:</p>
                  </div>
                  {['Pending', 'Approved', 'Rejected', 'Archived'].map((status) => (
                    <label key={status} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', margin: 0, userSelect: 'none' }}>
                      <input 
                        type="checkbox" 
                        checked={statusFilters.includes(status)} 
                        onChange={() => toggleStatusFilter(status)}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '0.95rem' }}>{status === 'Approved' ? 'Accepted' : status}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {isLoading ? (
            <p className="text-center text-secondary">Loading users...</p>
          ) : filteredUsers.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
              {filteredUsers.map(user => {
                const currentStatus = user.status || 'Pending';
                return (
                  <div key={user.id} className="card p-20" style={{ display: 'flex', flexDirection: 'column', height: '100%', cursor: 'pointer', opacity: currentStatus === 'Archived' ? 0.6 : 1 }} onClick={() => navigate(`/user/${user.id}`)}>
                    
                    {/* Header with Status Badge */}
                    <div className="flex-between-start mb-16">
                      <div className="flex-row">
                        <div className="avatar" style={{ width: '48px', height: '48px', background: 'var(--primary-color)', color: 'white', borderRadius: '50%' }}>
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-lg" style={{ margin: '0 0 4px 0' }}>{user.name}</h3>
                          <p className="text-sm text-secondary" style={{ margin: 0 }}>ID: {user.id_number || 'N/A'}</p>
                        </div>
                      </div>
                      
                      {/* Status Badge */}
                      <span style={{
                        padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold',
                        backgroundColor: currentStatus === 'Approved' ? '#dcfce7' : currentStatus === 'Rejected' ? '#fee2e2' : currentStatus === 'Archived' ? '#f3f4f6' : '#fef9c3',
                        color: currentStatus === 'Approved' ? '#166534' : currentStatus === 'Rejected' ? '#991b1b' : currentStatus === 'Archived' ? '#374151' : '#854d0e'
                      }}>
                        {currentStatus === 'Approved' ? 'Accepted' : currentStatus}
                      </span>
                    </div>

                    <p className="text-sm text-secondary mb-24" style={{ flexGrow: 1 }}>{user.major || "No major provided."}</p>

                    <div className="flex-col gap-8">
                      {/* APPROVAL CONTROLS */}
                      {role === 'admin' && (
                        <div className="flex-row gap-8 mb-8" style={{ flexWrap: 'wrap' }}>
                          {currentStatus === 'Pending' && (
                            <>
                              <button className="btn-black flex-grow btn-sm" onClick={(e) => handleUpdateStatus(e, user.id, 'Approved')}>✅ Accept</button>
                              <button className="btn-outline flex-grow btn-sm" onClick={(e) => handleUpdateStatus(e, user.id, 'Rejected')} style={{ color: '#dc2626', borderColor: '#fecaca' }}>❌ Reject</button>
                            </>
                          )}
                          
                          {currentStatus !== 'Pending' && currentStatus !== 'Archived' && (
                            <button className="btn-outline flex-grow btn-sm" onClick={(e) => handleUpdateStatus(e, user.id, 'Archived')} style={{ borderColor: '#d1d5db', color: '#374151' }}>📦 Archive</button>
                          )}
                          
                          {currentStatus === 'Archived' && (
                            <button className="btn-outline flex-grow btn-sm" onClick={(e) => handleUpdateStatus(e, user.id, 'Approved')} style={{ borderColor: '#86efac', color: '#166534' }}>♻️ Restore</button>
                          )}
                        </div>
                      )}

                      <button className="btn-outline w-full" onClick={(e) => { e.stopPropagation(); navigate(`/user/${user.id}`); }}>View Profile</button>
                      {role === 'admin' && (
                        <button className="w-full" onClick={(e) => handleDeleteUser(e, user.id)} style={{ background: 'white', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 20px', fontWeight: '500', cursor: 'pointer' }}>
                          🗑️ Remove User
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="card text-center text-secondary p-20" style={{ padding: '48px 24px' }}>
              <div className="text-3xl mb-16">📭</div>
              <h3 className="mb-8">No matching users found</h3>
              <p>Try adjusting your search or updating your status filters.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}