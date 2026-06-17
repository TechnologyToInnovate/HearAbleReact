import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function Companies({ role }) {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchCompanies() {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('name', { ascending: true });

      if (!error && data) {
        setCompanies(data);
      }
      setIsLoading(false);
    }
    fetchCompanies();
  }, []);

  const filteredCompanies = companies.filter(company => 
    company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (company.description && company.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (company.address && company.address.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="page-container">
      
      {/* HEADER */}
      <div className="flex-between-start mb-32">
        <div>
          <h2 className="text-3xl mb-8" style={{ margin: 0 }}>
            {role === 'admin' ? 'Manage Partner Companies' : 'Approved Partners'}
          </h2>
          <p className="text-secondary text-lg" style={{ margin: 0 }}>
            {role === 'admin' 
              ? 'View and manage all companies registered on the Hearable platform.' 
              : 'Discover top companies hiring graduates from our institution.'}
          </p>
        </div>
      </div>

      {/* SEARCH BOX */}
      <div className="search-box-wrapper mb-32" style={{ maxWidth: '500px' }}>
        <span className="search-icon">🔍</span>
        <input 
          type="text" 
          placeholder="Search by company name, industry, or location..." 
          className="search-input" 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)} 
        />
      </div>

      {isLoading && <p className="text-center text-secondary">Loading companies...</p>}
      
      {/* EMPTY STATE */}
      {!isLoading && filteredCompanies.length === 0 && (
        <div className="card text-center text-secondary p-20" style={{ padding: '48px 24px' }}>
          <div className="text-3xl mb-16">🏢</div>
          <h3 className="mb-8" style={{ margin: 0 }}>No companies found</h3>
          <p>We couldn't find any partners matching your search.</p>
        </div>
      )}

      {/* COMPANY GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
        {filteredCompanies.map(company => (
          <div 
            key={company.id} 
            className="card p-20" 
            style={{ display: 'flex', flexDirection: 'column', height: '100%', transition: 'all 0.2s', cursor: 'pointer' }} 
            onClick={() => navigate(`/company/${company.id}`)} 
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'} 
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            
            {/* AVATAR & TITLE */}
            <div className="flex-row mb-16">
              <div className="avatar" style={{ width: '48px', height: '48px', background: 'var(--primary-color)', color: 'white', borderRadius: '12px', flexShrink: 0 }}>
                {company.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg" style={{ margin: '0 0 4px 0' }}>{company.name}</h3>
                <p className="text-sm text-secondary" style={{ margin: 0 }}>
                  📍 {company.address || 'Location not specified'}
                </p>
              </div>
            </div>

            {/* DESCRIPTION (Uses inline webkit-clamp to safely cut off long text) */}
            <p className="text-sm text-secondary mb-24" style={{ lineHeight: '1.5', flexGrow: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {company.description || "No description provided."}
            </p>

            <button 
              className="btn-outline w-full" 
              onClick={(e) => { e.stopPropagation(); navigate(`/company/${company.id}`); }}
            >
              View Company Profile
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}