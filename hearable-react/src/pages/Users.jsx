import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import FilterButton from '../components/FilterButton'; 

export default function Users({ role }) {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (role !== 'admin') {
      navigate('/');
      return;
    }

    async function fetchUsers() {
      setIsLoading(true);
      const { data } = await supabase.from('profiles').select('*').order('name', { ascending: true });
      if (data) setUsers(data);
      setIsLoading(false);
    }
    fetchUsers();
  }, [role, navigate]);

async function handleDeleteUser(e, id) {
    e.stopPropagation(); 
    if (!window.confirm("Are you sure you want to permanently remove this user profile?")) return;

    // 1. Wipe their applications first so the database allows the profile deletion
    await supabase.from('applications').delete().eq('applicant_id', id);

    // 2. Now safely delete the user profile
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    
    if (!error) {
      setUsers(users.filter(u => u.id !== id));
      alert("User removed successfully.");
    } else {
      alert("Failed to remove user.");
      console.error(error);
    }
  }

  const filteredUsers = users.filter(person => 
    (person.name && person.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (person.major && person.major.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="page-container-wide">

      <div className="search-box-wrapper mb-16" style={{ width: '100%' }}>
        <span className="search-icon">🔍</span>
        <input 
          type="text" 
          placeholder="Search by name or profession..." 
          className="search-input" 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)} 
        />
      </div>

      <div className="mb-32">
        <FilterButton />
      </div>

      {isLoading && <p style={{ textAlign: 'center', color: 'var(--secondary-text)' }}>Loading user profiles...</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
        {filteredUsers.map(person => (
          <div 
            key={person.id} 
            className="card" 
            style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px' }} 
          >
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <div className="avatar" style={{ width: '48px', height: '48px', background: 'var(--text-color)', color: 'white', flexShrink: 0 }}>
                {person.name ? person.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem' }}>{person.name || 'Anonymous User'}</h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--secondary-text)' }}>
                  💼 {person.major || 'No profession listed'}
                </p>
              </div>
            </div>

            <p style={{ fontSize: '0.9rem', color: 'var(--secondary-text)', lineHeight: '1.5', marginBottom: '24px', flexGrow: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {person.bio || "No bio provided."}
            </p>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
              {person.skills && person.skills.length > 0 ? (
                person.skills.slice(0, 3).map((skill, idx) => (
                  <span key={idx} className="tag">{skill}</span>
                ))
              ) : (
                <span style={{ fontSize: '0.85rem', color: 'var(--border-color)' }}>---</span>
              )}
            </div>

            <div className="flex-col gap-8">
              <button 
                className="btn-outline w-full" 
                onClick={() => navigate(`/user/${person.id}`)}
              >
                View Full Profile
              </button>
              
              {/* NEW: Admin Delete Button */}
              <button 
                className="w-full" 
                onClick={(e) => handleDeleteUser(e, person.id)}
                style={{ background: 'white', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 20px', fontWeight: '500', cursor: 'pointer' }}
              >
                🗑️ Remove User
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}