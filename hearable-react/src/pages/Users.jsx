import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Custom hooks and utilities
import { useUsers } from '../hooks/useUsers';
import { sortData } from '../utils/sortUtils';

// Shared UI components
import SearchBar from '../components/common/SearchBar';
import Avatar from '../components/common/Avatar';
import StatusBadge from '../components/common/StatusBadge';

export default function Users({ role }) {
  const navigate = useNavigate();
  
  const { users, isLoading } = useUsers(role);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [sortBy, setSortBy] = useState('name_asc');
  const [filterDegree, setFilterDegree] = useState('All');
  const [filterBatch, setFilterBatch] = useState('All');

  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 6;

  useEffect(() => {
    if (role !== 'admin') navigate('/');
  }, [role, navigate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab, sortBy, filterDegree, filterBatch]);

  useEffect(() => {
    setSortBy(activeTab === 'Pending' ? 'date_asc' : 'name_asc');
  }, [activeTab]);

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

  const sortedUsers = sortData(processedUsers, sortBy, 'name', 'created_at');

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = sortedUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(sortedUsers.length / usersPerPage);

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
      ) : currentUsers.length > 0 ? (
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {currentUsers.map(user => (
            <div
              key={user.id}
              className="card p-24"
              style={{ display: 'flex', flexDirection: 'column', gap: '16px', opacity: user.status === 'Archived' ? 0.6 : 1 }}
            >
              
              <div className="flex-between-start" style={{ flexWrap: 'wrap', gap: '16px' }}>
                <div 
                  className="flex-row gap-16 align-start" 
                  style={{ flex: '1 1 300px', cursor: 'pointer' }}
                  onClick={() => navigate(`/user/${user.id}`)}
                >
                  <Avatar src={user.profile_pic} fallbackName={user.first_name} size="md" type="user" />
                  <div>
                    <h3 className="text-xl" style={{ margin: '0 0 8px 0' }}>
                      {user.name}
                    </h3>
                    {/* 🚨 UPDATED: Removed user email display */}
                    <p className="text-sm text-secondary" style={{ margin: 0 }}>
                      {user.degreeText || 'Degree not provided'} 
                      {user.batchText ? ` • Batch ${user.batchText}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex-col align-end gap-8" style={{ flexShrink: 0 }}>
                  <StatusBadge status={user.status} />
                  <span className="text-sm text-secondary" style={{ fontSize: '0.8rem' }}>
                    Joined: {user.joinDate}
                  </span>
                </div>
              </div>

              <div className="flex-row align-center flex-end" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '8px', flexWrap: 'wrap', gap: '16px' }}>
                <button className="btn-black btn-sm" onClick={() => navigate(`/user/${user.id}`)}>
                  Review Full Profile
                </button>
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