import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import FilterButton from '../components/FilterButton'; // <-- NEW COMPONENT

export default function Companies({ role }) {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newDescription, setNewDescription] = useState('');

  useEffect(() => {
    fetchCompanies();
  }, []);

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

  async function handleAddCompany(e) {
    e.preventDefault();
    setIsSubmitting(true);
    
    const { error } = await supabase.from('companies').insert([{
      name: newName,
      address: newAddress,
      description: newDescription,
      status: 'Active'
    }]);

    if (!error) {
      alert("Company added successfully!");
      setNewName(''); setNewAddress(''); setNewDescription('');
      setShowAddForm(false);
      fetchCompanies(); 
    } else {
      alert("Failed to add company. Check console.");
      console.error(error);
    }
    setIsSubmitting(false);
  }

  async function handleDeleteCompany(e, id) {
    e.stopPropagation(); 
    if (!window.confirm("Are you sure you want to permanently remove this company?")) return;

    const { error } = await supabase.from('companies').delete().eq('id', id);
    
    if (!error) {
      setCompanies(companies.filter(c => c.id !== id));
    } else {
      alert("Failed to remove company.");
      console.error(error);
    }
  }

  const filteredCompanies = companies.filter(company => 
    company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (company.description && company.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (company.address && company.address.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="page-container-wide">
      
      {showAddForm && role === 'admin' ? (
        <section className="card p-20 mb-32" style={{ maxWidth: '800px', margin: '0 auto 32px' }}>
          <div className="flex-between mb-24" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
            <h3 style={{ margin: 0 }}>Register New Company</h3>
            <button className="btn-outline btn-sm" onClick={() => setShowAddForm(false)}>← Cancel</button>
          </div>
          <form onSubmit={handleAddCompany} className="flex-col">
            <div className="form-grid-2">
              <div>
                <label>Company Name *</label>
                <input type="text" className="search-input" value={newName} onChange={(e) => setNewName(e.target.value)} required />
              </div>
              <div>
                <label>Location / Address *</label>
                <input type="text" className="search-input" value={newAddress} onChange={(e) => setNewAddress(e.target.value)} required />
              </div>
            </div>
            <div>
              <label>Company Description</label>
              <textarea className="search-input" style={{ height: '100px' }} value={newDescription} onChange={(e) => setNewDescription(e.target.value)} />
            </div>
            <button type="submit" className="btn-black w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Registering...' : 'Register Company'}
            </button>
          </form>
        </section>
      ) : (
        <>
          <div className="search-box-wrapper mb-16" style={{ width: '100%' }}>
            <span className="search-icon">🔍</span>
            <input 
              type="text" 
              placeholder="Search by company name, industry, or location..." 
              className="search-input" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
            />
          </div>

          <div className="flex-between mb-32">
            <FilterButton />
            {role === 'admin' && (
              <button className="btn-black" onClick={() => setShowAddForm(true)}>+ Add Company</button>
            )}
          </div>

          {isLoading && <p className="text-center text-secondary">Loading companies...</p>}
          
          {!isLoading && filteredCompanies.length === 0 && (
            <div className="card text-center text-secondary p-20" style={{ padding: '48px 24px' }}>
              <div className="text-3xl mb-16">🏢</div>
              <h3 className="mb-8" style={{ margin: 0 }}>No companies found</h3>
              <p>We couldn't find any companies matching your search.</p>
            </div>
          )}

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

                <p className="text-sm text-secondary mb-24" style={{ lineHeight: '1.5', flexGrow: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {company.description || "No description provided."}
                </p>

                <div className="flex-col gap-8">
                  <button 
                    className="btn-outline w-full" 
                    onClick={(e) => { e.stopPropagation(); navigate(`/company/${company.id}`); }}
                  >
                    View Company Profile
                  </button>

                  {role === 'admin' && (
                    <button 
                      className="w-full" 
                      onClick={(e) => handleDeleteCompany(e, company.id)}
                      style={{ background: 'white', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 20px', fontWeight: '500', cursor: 'pointer' }}
                    >
                      🗑️ Remove Company
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}