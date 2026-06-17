import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function Graduates({ role }) {
  const navigate = useNavigate();
  const [alumni, setAlumni] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // If not admin, kick them back to dashboard
    if (role !== 'admin') {
      navigate('/');
      return;
    }

    async function fetchAlumni() {
      setIsLoading(true);
      const { data } = await supabase.from('profiles').select('*').order('name', { ascending: true });
      if (data) setAlumni(data);
      setIsLoading(false);
    }
    fetchAlumni();
  }, [role, navigate]);

  const filteredAlumni = alumni.filter(person => 
    (person.name && person.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (person.major && person.major.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '64px' }}>
      
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '8px' }}>Manage Alumni Talent</h2>
        <p className="subtext" style={{ margin: 0 }}>View and moderate all registered graduate profiles on the platform.</p>
      </div>

      <div className="search-box-wrapper" style={{ marginBottom: '32px', maxWidth: '500px' }}>
        <span className="search-icon">🔍</span>
        <input 
          type="text" 
          placeholder="Search by name or profession..." 
          className="search-input" 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)} 
        />
      </div>

      {isLoading && <p style={{ textAlign: 'center', color: 'var(--secondary-text)' }}>Loading alumni profiles...</p>}

      {/* ALUMNI GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
        {filteredAlumni.map(person => (
          <div 
            key={person.id} 
            className="card" 
            style={{ display: 'flex', flexDirection: 'column', height: '100%', transition: 'all 0.2s', cursor: 'pointer', padding: '20px' }} 
            onClick={() => navigate(`/user/${person.id}`)} 
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'} 
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            
            {/* UNIVERSAL HEADER: Avatar + Titles */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <div className="avatar" style={{ width: '48px', height: '48px', background: 'var(--text-color)', color: 'white', flexShrink: 0 }}>
                {person.name ? person.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem' }}>{person.name || 'Anonymous User'}</h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--secondary-text)' }}>
                  💼 {person.major || 'No profession listed'}
                </p>
              </div>
            </div>

            {/* BODY: Clamped Bio */}
            <p style={{ fontSize: '0.9rem', color: 'var(--secondary-text)', lineHeight: '1.5', marginBottom: '24px', flexGrow: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {person.bio || "No bio provided."}
            </p>

            {/* UNIVERSAL FOOTER: Tags */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
              {person.skills && person.skills.length > 0 ? (
                person.skills.slice(0, 3).map((skill, idx) => (
                  <span key={idx} className="tag">{skill}</span>
                ))
              ) : (
                <span style={{ fontSize: '0.85rem', color: 'var(--border-color)' }}>---</span>
              )}
            </div>

            <button 
              className="btn-outline w-full" 
              onClick={(e) => { e.stopPropagation(); navigate(`/user/${person.id}`); }}
            >
              View Full Profile
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}