import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

// Custom hooks and utilities
import { useUsers } from '../hooks/useUsers';
import { sortData } from '../utils/sortUtils';

// Shared UI components
import SearchBar from '../components/common/SearchBar';
import Avatar from '../components/common/Avatar';
import StatusBadge from '../components/common/StatusBadge';

export default function Users({ role }) {
  const navigate = useNavigate();
  
  // Fetch users and manage loading state via our custom hook
  const { users, isLoading, setUsers } = useUsers(role);

  // UI state for search, tabs, and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [sortBy, setSortBy] = useState('name_asc');
  const [filterDegree, setFilterDegree] = useState('All');
  const [filterBatch, setFilterBatch] = useState('All');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 6;

  // Protect the route: Only admins can access the user management dashboard
  useEffect(() => {
    if (role !== 'admin') navigate('/');
  }, [role, navigate]);

  // Reset pagination to the first page whenever search filters or sorting criteria change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab, sortBy, filterDegree, filterBatch]);

  // Automatically default to sorting by oldest first when viewing the 'Pending' queue
  useEffect(() => {
    setSortBy(activeTab === 'Pending' ? 'date_asc' : 'name_asc');
  }, [activeTab]);

  // Handles updating a user's status (e.g., Approving or Rejecting an account)
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

  // Soft-deletes a user account to preserve database integrity and relational data
  async function handleArchiveUser(userId, userName) {
    if (!window.confirm(`Are you sure you want to archive ${userName}?`)) return;

    const { error } = await supabase.from('profiles').update({ status: 'Archived' }).eq('id', userId);

    if (!error) {
      setUsers(users.map(u => u.id === userId ? { ...u, status: 'Archived' } : u));
    } else {
      alert("Failed to archive user.");
    }
  }

  // Dynamically extract unique degrees and batches from the user list to populate the filter dropdowns
  const uniqueDegrees = ['All', ...[...new Set(users.map(u => u.degreeText).filter(Boolean))].sort()];
  const uniqueBatches = ['All', ...[...new Set(users.map(u => u.batchText).filter(Boolean))].sort()];
  
  // Apply all active filters (search query, tab status, degree, and batch)
  const processedUsers = users.filter(user => {
    const matchesSearch = (user.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.degreeText || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab = activeTab === 'All' ? true : user.status === activeTab;
    const matchesDegree = filterDegree === 'All' || user.degreeText === filterDegree;
    const matchesBatch = filterBatch === 'All' || user.batchText === filterBatch;

    return matchesSearch && matchesTab && matchesDegree && matchesBatch;
  });

  // Apply the selected sorting criteria to the filtered list
  const sortedUsers = sortData(processedUsers, sortBy, 'name', 'created_at');

  // Calculate pagination slices
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = sortedUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(sortedUsers.length / usersPerPage);

  return (
    <div className="page-container-wide">

      {/* --- HEADER & NAVIGATION --- */}
      <div className="flex-between mb-24" style={{ flexWrap: 'wrap', gap: '16px' }}>
        <h1 style={{ margin: 0 }}>Manage Users</h1>
        <div className="flex-row gap-12">
          <button className="btn-outline btn-sm" onClick={() => navigate('/skills')}>Manage Skills</button>
          <button className="btn-outline btn-sm" onClick={() => navigate('/degrees')}>Manage Degrees</button>
          <button className="btn-outline btn-sm" onClick={() => navigate('/batches')}>Manage Batches</button>
        </div>
      </div>

      {/* --- STATUS TABS --- */}
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

      {/* --- SEARCH & FILTERS --- */}
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

      {/* --- USER GRID --- */}
      {isLoading ? (
        <p className="text-center text-secondary mt-32">Loading users...</p>
      ) : currentUsers.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '20px' }}>
          {currentUsers.map(user => (
            <div key={user.id} className="card p-16 flex-col" style={{ height: '100%', opacity: user.status === 'Archived' ? 0.6 : 1, minWidth: 0 }}>

              <div className="flex-between-start mb-12">
                
                {/* Left section: Avatar, Name, Email */}
                <div 
                  className="flex-row gap-12 align-start" 
                  style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
                  onClick={() => navigate(`/user/${user.id}`)}
                >
                  <Avatar src={user.profile_pic} fallbackName={user.first_name} size="md" type="user" />
                  
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 
                      style={{ margin: '0 0 4px 0', fontSize: '1.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                      title={user.name}
                    >
                      {user.name}
                    </h3>
                    <p 
                      className="text-sm m-0 mb-4" 
                      style={{ color: 'var(--text-color)', opacity: 0.8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                      title={user.email}
                    >
                      {user.email || 'Email not provided'}
                    </p>
                  </div>
                </div>

                {/* Right section: Badges and Dates */}
                <div className="flex-col align-end gap-8" style={{ flexShrink: 0, marginLeft: '12px' }}>
                  <StatusBadge status={user.status} />
                  <span className="text-sm text-secondary" style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                    Joined: {user.joinDate}
                  </span>
                </div>
              </div>

              {/* Middle section: Education Details */}
              <div className="mb-16 flex-grow" style={{ background: 'var(--bg-color)', padding: '12px', borderRadius: '8px', minWidth: 0 }}>
                <div style={{ marginBottom: '8px', minWidth: 0 }}>
                  <span className="text-sm text-secondary" style={{ display: 'block', marginBottom: '2px' }}>Degree</span>
                  <strong 
                    style={{ fontSize: '0.95rem', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                    title={user.degreeText}
                  >
                    {user.degreeText || 'Not provided'}
                  </strong>
                </div>
                <div style={{ minWidth: 0 }}>
                  <span className="text-sm text-secondary" style={{ display: 'block', marginBottom: '2px' }}>Batch</span>
                  <strong style={{ fontSize: '0.95rem', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user.batchText || 'Not provided'}
                  </strong>
                </div>
              </div>

              {/* Bottom section: Admin Actions */}
              <div className="flex-col gap-8 mt-auto">
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

      {totalPages > 1 && (
        <div className="flex-between align-center mt-32">
          <p className="text-sm text-secondary" style={{ margin: 0 }}>
            Showing {indexOfFirstUser + 1} to {Math.min(indexOfLastUser, sortedUsers.length)} of {sortedUsers.length} users
          </p>
          <div className="flex-row gap-8">
            <button className="btn-outline btn-sm" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>&larr; Previous</button>
            <button className="btn-outline btn-sm" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>Next &rarr;</button>
          </div>
        </div>
      )}
    </div>
  );
}