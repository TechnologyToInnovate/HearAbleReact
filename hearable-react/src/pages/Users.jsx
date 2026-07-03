import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

// 🚨 NEW IMPORTS: Hooks, Utils, and Common Components
import { useUsers } from '../hooks/useUsers';
import { sortData } from '../utils/sortUtils';
import SearchBar from '../components/common/SearchBar';
import Avatar from '../components/common/Avatar';
import StatusBadge from '../components/common/StatusBadge';

export default function Users({ role }) {
  const navigate = useNavigate();
  
  // 1. Data fetching is completely abstracted into our custom hook
  const { users, isLoading, setUsers } = useUsers(role);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [sortBy, setSortBy] = useState('name_asc');
  const [filterDegree, setFilterDegree] = useState('All');
  const [filterBatch, setFilterBatch] = useState('All');

  useEffect(() => {
    if (role !== 'admin') navigate('/');
  }, [role, navigate]);

  useEffect(() => {
    setSortBy(activeTab === 'Pending' ? 'date_asc' : 'name_asc');
  }, [activeTab]);

  async function handleUpdateStatus(userId, newStatus) {
    const updatePayload = { 
      status: newStatus,
      ...(newStatus === 'Approved' ? { approved_at: new Date().toISOString() } : {})
    };

    const { error } = await supabase.from('profiles').update(updatePayload).eq('id', userId);

    if (!error) {
      setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u));
      if (newStatus === 'Approved') {
        await supabase.from('notifications').insert([{
          user_id: userId, title: 'Account Approved!', 
          message: 'An administrator has approved your account.', link: '/jobs'
        }]);
      }
    } else {
      alert("Failed to update user status.");
    }
  }

  async function handleArchiveUser(userId, userName) {
    if (!window.confirm(`Are you sure you want to archive ${userName}?`)) return;

    const { error } = await supabase.from('profiles').update({ status: 'Archived' }).eq('id', userId);

    if (!error) {
      setUsers(users.map(u => u.id === userId ? { ...u, status: 'Archived' } : u));
    } else {
      alert("Failed to archive user.");
    }
  }

  // 2. Simplified derived state
  const uniqueDegrees = ['All', ...[...new Set(users.map(u => u.degreeText).filter(Boolean))].sort()];
  const uniqueBatches = ['All', ...[...new Set(users.map(u => u.batchText).filter(Boolean))].sort()];
  
  const processedUsers = users.filter(user => {
    const matchesSearch = (user.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.degreeText || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab = activeTab === 'All' ? true : user.status === activeTab;
    const matchesDegree = filterDegree === 'All' || user.degreeText === filterDegree;
    const matchesBatch = filterBatch === 'All' || user.batchText === filterBatch;

    return matchesSearch && matchesTab && matchesDegree && matchesBatch;
  });

  // 3. Replaced complex sorting logic with our utility
  const sortedUsers = sortData(processedUsers, sortBy, 'name', 'created_at');

  return (
    <div className="page-container-wide">

      <div className="flex-between mb-24" style={{ flexWrap: 'wrap', gap: '16px' }}>
        <h1 style={{ margin: 0 }}>Manage Users</h1>
        <div className="flex-row gap-12">
          <button className="btn-outline btn-sm" onClick={() => navigate('/skills')}>Manage Skills</button>
          <button className="btn-outline btn-sm" onClick={() => navigate('/degrees')}>Manage Degrees</button>
          <button className="btn-outline btn-sm" onClick={() => navigate('/batches')}>Manage Batches</button>
        </div>
      </div>

      <div className="flex-row gap-8 mb-24" style={{ overflowX: 'auto', paddingBottom: '4px', borderBottom: '1px solid var(--border-color)' }}>
        {['All', 'Pending', 'Approved', 'Rejected', 'Archived'].map(tab => (
          <button
            key={tab} onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 20px', border: 'none', background: 'none',
              borderBottom: activeTab === tab ? '2px solid var(--primary-color)' : '2px solid transparent',
              color: activeTab === tab ? 'var(--primary-color)' : 'var(--secondary-text)',
              fontWeight: activeTab === tab ? '600' : '400', cursor: 'pointer', fontSize: '1rem',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 4. Using our universal SearchBar component */}
      <div className="mb-16">
        <SearchBar 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)} 
          placeholder="Search by name, email, or degree..." 
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
          {uniqueDegrees.map(degree => <option key={degree} value={degree}>{degree === 'All' ? 'All Degrees' : degree}</option>)}
        </select>
        <select className="search-input" style={{ width: 'auto', minWidth: '180px', padding: '10px 16px' }} value={filterBatch} onChange={e => setFilterBatch(e.target.value)}>
          {uniqueBatches.map(batch => <option key={batch} value={batch}>{batch === 'All' ? 'All Batches' : `Batch ${batch}`}</option>)}
        </select>
      </div>

      {isLoading ? (
        <p className="text-center text-secondary mt-32">Loading users...</p>
      ) : sortedUsers.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          {sortedUsers.map(user => (
            <div key={user.id} className="card p-20 flex-col" style={{ height: '100%', opacity: user.status === 'Archived' ? 0.6 : 1 }}>

              <div className="flex-between-start mb-16">
                <div className="flex-row gap-12 align-start">
                  {/* 5. Using our clean Avatar component */}
                  <Avatar fallbackName={user.first_name} size="sm" type="user" />
                  
                  <div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem' }}>{user.name}</h3>
                    <p className="text-sm m-0 mb-4" style={{ color: 'var(--text-color)', opacity: 0.8 }}>
                      {user.email || 'Email not provided'}
                    </p>
                  </div>
                </div>

                <div className="flex-col align-end gap-8">
                  {/* 6. Using our universal StatusBadge component */}
                  <StatusBadge status={user.status} />
                  <span className="text-sm text-secondary" style={{ fontSize: '0.8rem' }}>
                    Joined: {user.joinDate}
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
                {user.status !== 'Archived' && (
                  <div className="flex-row gap-8">
                    {user.status !== 'Approved' && (
                      <button className="btn-outline flex-grow btn-sm" onClick={() => handleUpdateStatus(user.id, 'Approved')} style={{ background: '#ecfdf5', borderColor: '#34d399', color: '#065f46' }}>Approve</button>
                    )}
                    {user.status !== 'Rejected' && (
                      <button className="btn-outline flex-grow btn-sm" onClick={() => handleUpdateStatus(user.id, 'Rejected')} style={{ background: '#fef2f2', borderColor: '#f87171', color: '#991b1b' }}>Reject</button>
                    )}
                  </div>
                )}

                <button className="btn-outline w-full btn-sm mb-4" onClick={() => navigate(`/user/${user.id}`)}>
                  View Full Profile
                </button>

                {user.status === 'Archived' ? (
                  <div className="badge badge-neutral w-full" style={{ padding: '8px', textAlign: 'center', display: 'block' }}>
                    User Archived
                  </div>
                ) : (
                  <button
                    className="w-full"
                    onClick={() => handleArchiveUser(user.id, user.name)}
                    style={{ background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', borderRadius: '8px', padding: '8px 16px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
                  >
                    Archive User
                  </button>
                )}
              </div>

            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center text-secondary p-32 mt-32">
          <h3 className="mb-8">No users found</h3>
          <p>Try adjusting your search or filters.</p>
        </div>
      )}
    </div>
  );
}