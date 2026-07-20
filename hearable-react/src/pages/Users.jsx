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
  
  const { users, isLoading } = useUsers(role);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [sortBy, setSortBy] = useState('name_asc');
  const [filterDegree, setFilterDegree] = useState('All');
  const [filterBatch, setFilterBatch] = useState('All');

  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 6;

  const [resumeModal, setResumeModal] = useState({ isOpen: false, isLoading: false, userName: '', resumes: [] });

  useEffect(() => {
    if (role !== 'admin') navigate('/');
  }, [role, navigate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab, sortBy, filterDegree, filterBatch]);

  useEffect(() => {
    setSortBy(activeTab === 'Pending' ? 'date_asc' : 'name_asc');
  }, [activeTab]);

  async function handleViewResumes(userId, userName) {
    setResumeModal({ isOpen: true, isLoading: true, userName, resumes: [] });
    const { data } = await supabase
      .from('resumes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
      
    setResumeModal({ isOpen: true, isLoading: false, userName, resumes: data || [] });
  }

  async function handleUpdateResumeStatus(resumeId, newStatus) {
    const { error } = await supabase
      .from('resumes')
      .update({ status: newStatus })
      .eq('id', resumeId);

    if (!error) {
      setResumeModal(prev => ({
        ...prev,
        resumes: prev.resumes.map(r => r.id === resumeId ? { ...r, status: newStatus } : r)
      }));
    } else {
      alert("Failed to update resume status.");
    }
  }

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
        <div className="flex-row align-center gap-16 flex-wrap">
          <h1 style={{ margin: 0 }}>Manage Users</h1>
          {role === 'admin' && (
            <div className="flex-row" style={{ background: 'var(--bg-color)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <button 
                onClick={() => navigate('/users')}
                style={{ padding: '6px 16px', borderRadius: '6px', border: 'none', fontWeight: '500', cursor: 'pointer', background: 'var(--card-bg)', color: 'var(--text-color)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
              >
                Job Seekers
              </button>
              <button 
                onClick={() => navigate('/companies')}
                style={{ padding: '6px 16px', borderRadius: '6px', border: 'none', fontWeight: '500', cursor: 'pointer', background: 'transparent', color: 'var(--secondary-text)', boxShadow: 'none' }}
              >
                Employers
              </button>
            </div>
          )}
        </div>
        
        <div className="flex-row gap-12">
          <button 
            className="btn-outline btn-sm" 
            onClick={() => navigate('/system-data')}
          >
            System Data
          </button>
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

              <div className="flex-row align-center" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '8px', flexWrap: 'wrap', gap: '16px', justifyContent: 'flex-end' }}>
                <button 
                  className="btn-black btn-sm" 
                  style={{ backgroundColor: '#047857', borderColor: '#047857', color: '#ffffff' }}
                  onClick={() => navigate(`/user/${user.id}`)}
                >
                  View Profile
                </button>
                <button 
                  className="btn-outline btn-sm" 
                  onClick={() => handleViewResumes(user.id, user.name)}
                >
                  View Resumes
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

      {resumeModal.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div className="card p-0" style={{ width: '100%', maxWidth: '600px', background: 'var(--card-bg)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
            
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="m-0" style={{ fontSize: '1.25rem' }}>Resumes for {resumeModal.userName}</h3>
              <button 
                onClick={() => setResumeModal({ isOpen: false, isLoading: false, userName: '', resumes: [] })} 
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-color)' }}
              >
                Close
              </button>
            </div>
            
            <div style={{ padding: '24px', maxHeight: '60vh', overflowY: 'auto' }}>
              {resumeModal.isLoading ? (
                <p className="text-secondary text-center">Loading resumes...</p>
              ) : resumeModal.resumes.length > 0 ? (
                <div className="flex-col gap-12">
                  {resumeModal.resumes.map(resume => (
                    <div key={resume.id} className="flex-between align-center p-16" style={{ border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                      <div>
                        <strong className="block mb-8" style={{ fontSize: '1rem' }}>{resume.title}</strong>
                        <div className="flex-row gap-12 align-center">
                          <StatusBadge status={resume.status || 'Pending'} />
                          <span className="text-sm text-secondary">
                            Uploaded: {new Date(resume.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex-col gap-8 align-end">
                        {resume.file_url && (
                          <a href={resume.file_url} target="_blank" rel="noopener noreferrer" className="btn-outline btn-sm" style={{ textDecoration: 'none', width: '100%', textAlign: 'center' }}>
                            View PDF
                          </a>
                        )}
                        <div className="flex-row gap-8">
                          {role === 'admin' && resume.status !== 'Approved' && (
                            <button 
                              className="btn-sm" 
                              style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 12px', cursor: 'pointer' }} 
                              onClick={() => handleUpdateResumeStatus(resume.id, 'Approved')}
                            >
                              Approve
                            </button>
                          )}
                          {role === 'admin' && resume.status !== 'Rejected' && (
                            <button 
                              className="btn-sm" 
                              style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 12px', cursor: 'pointer' }} 
                              onClick={() => handleUpdateResumeStatus(resume.id, 'Rejected')}
                            >
                              Reject
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-secondary text-center m-0">No resumes uploaded.</p>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}