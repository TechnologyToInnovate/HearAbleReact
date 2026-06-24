import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import FilterButton from '../components/FilterButton'; 

export default function Companies({ role }) {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Form States
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Pre-Approve Variables
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newAddress, setNewAddress] = useState('');

  useEffect(() => {
    fetchCompanies();
  }, []);

  async function fetchCompanies() {
    setIsLoading(true);
    const { data } = await supabase.from('companies').select('*').order('name', { ascending: true });
    if (data) setCompanies(data);
    setIsLoading(false);
  }

  // --- ADD COMPANY FUNCTION ---
  async function handleAddCompany(e) {
    e.preventDefault();
    setIsSubmitting(true);
    
    const { error } = await supabase.from('pre_approved_companies').insert([{
      email: newEmail.toLowerCase().trim(),
      name: newName,
      address: newAddress
    }]);

    if (!error) {
      alert(`Success! ${newEmail} is on the roster. They can now sign up on the Login page!`);
      setNewEmail(''); setNewName(''); setNewAddress('');
      setShowAddForm(false);
    } else {
      alert("Failed to pre-approve company. Email might already be on the list.");
      console.error(error);
    }
    setIsSubmitting(false);
  }

  // --- DELETE COMPANY FUNCTION ---
async function handleDeleteCompany(e, company) {
    e.stopPropagation(); 
    if (!window.confirm(`Are you sure you want to permanently remove ${company.name}?`)) return;

    // 1. Delete the pre-approved record if it exists (prevents the duplicate key error later)
    // We add .eq('name', company.name) just in case the email differs
    await supabase.from('pre_approved_companies').delete().eq('name', company.name);

    // 2. Delete all applications
    await supabase.from('applications').delete().eq('company', company.name);

    // 3. Delete jobs
    await supabase.from('jobs').delete().eq('company', company.name);

    // 4. Delete the company profile
    const { error } = await supabase.from('companies').delete().eq('id', company.id);
    
    if (!error) {
      setCompanies(companies.filter(c => c.id !== company.id));
    } else {
      alert("Failed to delete company.");
    }
  }

  const filteredCompanies = companies.filter(company => 
    company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (company.address && company.address.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="page-container-wide">
      
      {/* SHOW THE ADD FORM IF TRIGGERED */}
      {showAddForm && role === 'admin' ? (
        <section className="card p-20 mb-32" style={{ maxWidth: '800px', margin: '0 auto 32px' }}>
          <div className="flex-between mb-24" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
            <h3 style={{ margin: 0 }}>Pre-Approve New Company</h3>
            <button className="btn-outline btn-sm" onClick={() => setShowAddForm(false)}>← Cancel</button>
          </div>
          <div className="mb-24" style={{ background: '#ecfdf5', color: '#047857', padding: '12px', borderRadius: '8px', border: '1px solid #a7f3d0', fontSize: '0.9rem' }}>
            <strong>Admin Notice:</strong> Add a company email. When they go to the Login page and "Sign Up", their profile will be automatically built and approved!
          </div>
          <form onSubmit={handleAddCompany} className="flex-col">
            <div className="form-grid-2">
              <div>
                <label>Company Email *</label>
                <input type="email" className="search-input" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required />
              </div>
              <div>
                <label>Company Name *</label>
                <input type="text" className="search-input" value={newName} onChange={(e) => setNewName(e.target.value)} required />
              </div>
            </div>
            <div>
              <label>Location / HQ</label>
              <input type="text" className="search-input" value={newAddress} onChange={(e) => setNewAddress(e.target.value)} />
            </div>
            <button type="submit" className="btn-black w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Registering...' : 'Add to Pre-Approved Roster'}
            </button>
          </form>
        </section>
      ) : (
        <>
          {/* SHOW THE MAIN COMPANIES LIST */}
          <div className="search-box-wrapper mb-16" style={{ width: '100%' }}>
            <span className="search-icon">🔍</span>
            <input type="text" placeholder="Search by company name or location..." className="search-input" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>

          <div className="flex-between mb-32">
            <FilterButton />
            {role === 'admin' && (
              <button className="btn-black" onClick={() => setShowAddForm(true)}>+ Add Company</button>
            )}
          </div>

          {isLoading && <p className="text-center text-secondary">Loading companies...</p>}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
            {filteredCompanies.map(company => (
              <div 
                key={company.id} 
                className="card p-20" 
                style={{ display: 'flex', flexDirection: 'column', height: '100%', cursor: 'pointer' }} 
                onClick={() => navigate(`/company/${company.id}`)} 
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
                  <button className="btn-outline w-full" onClick={(e) => { e.stopPropagation(); navigate(`/company/${company.id}`); }}>
                    View Company Profile
                  </button>

                  {role === 'admin' && (
                    <button 
                      className="w-full" 
                      onClick={(e) => handleDeleteCompany(e, company)}
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