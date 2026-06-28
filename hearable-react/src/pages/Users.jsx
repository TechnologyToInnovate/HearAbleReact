import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function Users({ role }) {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [sortBy, setSortBy] = useState('name_asc');
  const [filterDegree, setFilterDegree] = useState('All');
  const [filterBatch, setFilterBatch] = useState('All');

  useEffect(() => {
    if (role !== 'admin') {
      navigate('/');
      return;
    }
    fetchUsers();
  }, [role, navigate]);

  // Auto-switch to "Oldest First" when viewing Pending users
  useEffect(() => {
    if (activeTab === 'Pending') {
      setSortBy('date_asc');
    } else {
      setSortBy('name_asc');
    }
  }, [activeTab]);

  async function fetchUsers() {
    setIsLoading(true);

    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          *,
          degrees ( name, abbreviation ),
          batches ( batch_number )
        `);

      if (error) throw error;

      const mappedProfiles = profiles.map(p => ({
        ...p,
        degreeText: p.degrees ? (p.degrees.abbreviation ? `${p.degrees.abbreviation} - ${p.degrees.name}` : p.degrees.name) : null,
        batchText: p.batches ? String(p.batches.batch_number) : null,
        joinDate: p.created_at ? new Date(p.created_at).toLocaleDateString() : 'Unknown'
      }));

      const { data: companies } = await supabase.from('companies').select('id');
      const companyIds = companies ? companies.map(c => c.id) : [];

      const { data: admins, error: adminError } = await supabase.from('admins').select('id');
      const adminIds = admins && !adminError ? admins.map(a => a.id).filter(Boolean) : [];

      const pureUsers = mappedProfiles.filter(user =>
        !companyIds.includes(user.id) &&
        !adminIds.includes(user.id)
      );

      setUsers(pureUsers);

    } catch (error) {
      console.error("Error fetching users:", error);
      alert("Error fetching users: " + error.message);
    }

    setIsLoading(false);
  }

  async function handleUpdateStatus(userId, newStatus) {
    // Stamp the approval date if they are approved
    const updatePayload = { status: newStatus };
    if (newStatus === 'Approved') {
      updatePayload.approved_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('id', userId);

    if (!error) {
      setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u));
      
      if (newStatus === 'Approved') {
        await supabase.from('notifications').insert([{
          user_id: userId,
          title: 'Account Approved! 🚀',
          message: 'An administrator has approved your account. You now have full access to apply for jobs!',
          link: '/jobs'
        }]);
      }
      
    } else {
      alert("Failed to update user status.");
    }
  }

  async function handleDeleteUser(userId, userName) {
    if (!window.confirm(`Are you sure you want to permanently remove ${userName || 'this user'}? This action cannot be undone and will delete their login credentials.`)) return;

    // 🚨 THE FIX: This now calls our secure Postgres function!
    const { error } = await supabase.rpc('admin_delete_user', { target_id: userId });

    if (!error) {
      setUsers(users.filter(u => u.id !== userId));
      alert(`${userName || 'User'} has been completely removed from the system.`);
    } else {
      alert("Failed to delete user: " + error.message);
      console.error(error);
    }
  }

  const uniqueDegrees = ['All', ...[...new Set(users.map(u => u.degreeText).filter(Boolean))].sort()];
  const uniqueBatches = ['All', ...[...new Set(users.map(u => u.batchText).filter(Boolean))].sort()];
  
  let processedUsers = users.filter(user => {
    const matchesSearch = (user.name && user.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.degreeText && user.degreeText.toLowerCase().includes(searchQuery.toLowerCase()));

    let matchesTab = true;
    if (activeTab === 'Pending') matchesTab = user.status === 'Pending';
    if (activeTab === 'Approved') matchesTab = user.status === 'Approved';
    if (activeTab === 'Rejected') matchesTab = user.status === 'Rejected';

    const matchesDegree = filterDegree === 'All' || user.degreeText === filterDegree;
    const matchesBatch = filterBatch === 'All' || user.batchText === filterBatch;

    return matchesSearch && matchesTab && matchesDegree && matchesBatch;
  });

  // Time-based sorting logic
  processedUsers.sort((a, b) => {
    if (sortBy === 'name_asc') return (a.name || '').localeCompare(b.name || '');
    if (sortBy === 'name_desc') return (b.name || '').localeCompare(a.name || '');
    if (sortBy === 'date_asc') return new Date(a.created_at || 0) - new Date(b.created_at || 0); // Oldest first
    if (sortBy === 'date_desc') return new Date(b.created_at || 0) - new Date(a.created_at || 0); // Newest first
    return 0;
  });

  return (
    <div className="page-container-wide">

      <div className="flex-between mb-24" style={{ flexWrap: 'wrap', gap: '16px' }}>
        <h1 style={{ margin: 0 }}>Manage Users</h1>
        <div className="flex-row gap-12">
          <button className="btn-outline btn-sm" onClick={() => navigate('/degrees')}>🎓 Manage Degrees</button>
          <button className="btn-outline btn-sm" onClick={() => navigate('/batches')}>📅 Manage Batches</button>
        </div>
      </div>

      <div className="flex-row gap-8 mb-24" style={{ overflowX: 'auto', paddingBottom: '4px', borderBottom: '1px solid var(--border-color)' }}>
        {['All', 'Pending', 'Approved', 'Rejected'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 20px',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === tab ? '2px solid var(--primary-color)' : '2px solid transparent',
              color: activeTab === tab ? 'var(--primary-color)' : 'var(--secondary-text)',
              fontWeight: activeTab === tab ? '600' : '400',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="search-box-wrapper mb-16" style={{ width: '100%' }}>
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder="Search by name or degree..."
          className="search-input w-full"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="flex-row-wrap gap-16 mb-32">
        <select className="search-input" style={{ width: 'auto', minWidth: '180px', padding: '10px 16px' }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="name_asc">Sort by: Name (A-Z)</option>
          <option value="name_desc">Sort by: Name (Z-A)</option>
          <option value="date_asc">Sort by: Oldest First</option>
          <option value="date_desc">Sort by: Newest First</option>
        </select>

        <select className="search-input" style={{ width: 'auto', minWidth: '180px', padding: '10px 16px' }} value={filterDegree} onChange={e => setFilterDegree(e.target.value)}>
          {uniqueDegrees.map(degree => (
            <option key={degree} value={degree}>{degree === 'All' ? 'All Degrees' : degree}</option>
          ))}
        </select>

        <select className="search-input" style={{ width: 'auto', minWidth: '180px', padding: '10px 16px' }} value={filterBatch} onChange={e => setFilterBatch(e.target.value)}>
          {uniqueBatches.map(batch => (
            <option key={batch} value={batch}>{batch === 'All' ? 'All Batches' : `Batch ${batch}`}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <p className="text-center text-secondary mt-32">Loading users...</p>
      ) : processedUsers.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          {processedUsers.map(user => (
            <div key={user.id} className="card p-20 flex-col" style={{ height: '100%' }}>

              <div className="flex-between-start mb-16">
                <div className="flex-row gap-12 align-center">
                  <div className="avatar" style={{ flexShrink: 0 }}>
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem' }}>{user.name || 'Incomplete Profile'}</h3>
                    <p className="text-sm text-secondary m-0">
                      {user.status === 'Pending' ? 'Awaiting Review' : `Status: ${user.status || 'Active'}`}
                    </p>
                  </div>
                </div>

                <div className="flex-col align-end gap-8">
                  <span style={{
                    padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold',
                    backgroundColor: user.status === 'Approved' ? '#dcfce7' : user.status === 'Rejected' ? '#fef2f2' : '#fef9c3',
                    color: user.status === 'Approved' ? '#166534' : user.status === 'Rejected' ? '#991b1b' : '#854d0e'
                  }}>
                    {user.status || 'Active'}
                  </span>
                  <span className="text-sm text-secondary" style={{ fontSize: '0.8rem' }}>
                    📅 Joined: {user.joinDate}
                  </span>
                </div>
              </div>

              <div className="mb-24 flex-grow" style={{ background: 'var(--bg-color)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ marginBottom: '8px' }}>
                  <span className="text-sm text-secondary" style={{ display: 'block', marginBottom: '2px' }}>Degree</span>
                  <strong style={{ fontSize: '0.95rem' }}>{user.degreeText || 'Not provided'}</strong>
                </div>
                <div>
                  <span className="text-sm text-secondary" style={{ display: 'block', marginBottom: '2px' }}>Batch</span>
                  <strong style={{ fontSize: '0.95rem' }}>{user.batchText || 'Not provided'}</strong>
                </div>
              </div>

              <div className="flex-col gap-8">
                <div className="flex-row gap-8">
                  {user.status !== 'Approved' && (
                    <button className="btn-outline flex-grow btn-sm" onClick={() => handleUpdateStatus(user.id, 'Approved')} style={{ background: '#ecfdf5', borderColor: '#34d399', color: '#065f46' }}>✓ Approve</button>
                  )}
                  {user.status !== 'Rejected' && (
                    <button className="btn-outline flex-grow btn-sm" onClick={() => handleUpdateStatus(user.id, 'Rejected')} style={{ background: '#fef2f2', borderColor: '#f87171', color: '#991b1b' }}>✕ Reject</button>
                  )}
                </div>

                <button className="btn-outline w-full btn-sm mb-4" onClick={() => navigate(`/user/${user.id}`)}>
                  View Full Profile
                </button>

                <button
                  className="w-full"
                  onClick={() => handleDeleteUser(user.id, user.name)}
                  style={{ background: 'white', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', padding: '8px 16px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  🗑️ Remove User
                </button>
              </div>

            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center text-secondary p-32 mt-32">
          <div className="text-3xl mb-16">👥</div>
          <h3 className="mb-8">No users found</h3>
          <p>Try adjusting your search or filters.</p>
        </div>
      )}
    </div>
  );
}