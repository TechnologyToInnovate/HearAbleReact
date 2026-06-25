import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function Companies({ role }) {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [activeTab, setActiveTab] = useState('All');

  const [currentPage, setCurrentPage] = useState(1);
  const companiesPerPage = 10;

  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 🚨 LOCATION UPDATE: Split location fields for Pre-Approve
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newCountry, setNewCountry] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newPostalCode, setNewPostalCode] = useState('');

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab]);

  async function fetchCompanies() {
    setIsLoading(true);
    
    const { data: regData } = await supabase.from('companies').select('*');
    const registered = regData || [];

    const { data: preData } = await supabase.from('pre_approved_companies').select('*');
    const preApprovedList = preData || [];

    const registeredNames = registered.map(c => c.name.toLowerCase());
    
    const pendingPreApproved = preApprovedList
      .filter(pc => !registeredNames.includes(pc.name.toLowerCase()))
      .map(pc => ({
        ...pc,
        id: pc.id || `pre-${pc.email}`, 
        status: 'Pre-Approved',
        description: '⏳ Pre-approved account. Waiting for the company to sign up.',
        isPreApprovedOnly: true 
      }));

    const combined = [...registered, ...pendingPreApproved].sort((a, b) => a.name.localeCompare(b.name));
    
    setCompanies(combined);
    setIsLoading(false);
  }

  async function handleAddCompany(e) {
    e.preventDefault();
    setIsSubmitting(true);
    
    // 🚨 LOCATION UPDATE: Insert the split fields
    const { error } = await supabase.from('pre_approved_companies').insert([{
      email: newEmail.toLowerCase().trim(),
      name: newName,
      country: newCountry.trim() || null,
      city: newCity.trim() || null,
      postal_code: newPostalCode.trim() || null
    }]);

    if (!error) {
      alert(`Success! ${newEmail} is on the roster.`);
      setNewEmail(''); setNewName(''); setNewCountry(''); setNewCity(''); setNewPostalCode('');
      setShowAddForm(false);
      fetchCompanies(); 
    } else {
      alert("Failed to pre-approve company. Email might already be on the list.");
      console.error(error);
    }
    setIsSubmitting(false);
  }

  async function handleUpdateStatus(e, id, newStatus) {
    e.stopPropagation();
    const { error } = await supabase.from('companies').update({ status: newStatus }).eq('id', id);
    if (!error) {
      setCompanies(companies.map(c => c.id === id ? { ...c, status: newStatus } : c));
    } else {
      alert("Failed to update status.");
    }
  }

  async function handleDeleteCompany(e, company) {
    e.stopPropagation(); 
    if (!window.confirm(`Are you sure you want to permanently remove ${company.name}? This action cannot be undone.`)) return;

    if (company.isPreApprovedOnly) {
      const { error } = await supabase.from('pre_approved_companies').delete().eq('name', company.name);
      if (!error) {
        setCompanies(companies.filter(c => c.id !== company.id));
      } else {
        alert("Failed to remove pre-approved company.");
      }
      return;
    }

    await supabase.from('pre_approved_companies').delete().eq('name', company.name);
    await supabase.from('applications').delete().eq('company_id', company.id); 
    await supabase.from('jobs').delete().eq('company_id', company.id); 
    const { error } = await supabase.from('companies').delete().eq('id', company.id);
    
    if (!error) {
      setCompanies(companies.filter(c => c.id !== company.id));
      if (currentCompanies.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } else {
      alert("Failed to delete company.");
    }
  }

  const filteredCompanies = companies.filter(company => {
    // 🚨 LOCATION UPDATE: Search by city or country now
    const matchesSearch = company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (company.city && company.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (company.country && company.country.toLowerCase().includes(searchQuery.toLowerCase()));

    const currentStatus = company.status === 'Approved' ? 'Active' : (company.status || 'Active');

    if (role !== 'admin') {
      return matchesSearch && currentStatus === 'Active';
    }

    let matchesTab = true;
    if (activeTab === 'Active') matchesTab = currentStatus === 'Active';
    if (activeTab === 'Pre-Approved') matchesTab = currentStatus === 'Pre-Approved';
    if (activeTab === 'Inactive') matchesTab = currentStatus === 'Inactive';
    if (activeTab === 'Archived') matchesTab = currentStatus === 'Archived';

    return matchesSearch && matchesTab;
  });

  const indexOfLastCompany = currentPage * companiesPerPage;
  const indexOfFirstCompany = indexOfLastCompany - companiesPerPage;
  const currentCompanies = filteredCompanies.slice(indexOfFirstCompany, indexOfLastCompany);
  const totalPages = Math.ceil(filteredCompanies.length / companiesPerPage);

  return (
    <div className="page-container-wide">
      
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
                <input type="email" className="search-input w-full" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required />
              </div>
              <div>
                <label>Company Name *</label>
                <input type="text" className="search-input w-full" value={newName} onChange={(e) => setNewName(e.target.value)} required />
              </div>
            </div>
            
            {/* 🚨 LOCATION UPDATE: 3-Grid format */}
            <label style={{ display: 'block', fontWeight: '500', marginTop: '8px' }}>Location Details</label>
            <div className="form-grid-3">
              <div>
                <input type="text" className="search-input w-full" placeholder="Country (e.g. USA)" value={newCountry} onChange={(e) => setNewCountry(e.target.value)} />
              </div>
              <div>
                <input type="text" className="search-input w-full" placeholder="City (e.g. Austin)" value={newCity} onChange={(e) => setNewCity(e.target.value)} />
              </div>
              <div>
                <input type="text" className="search-input w-full" placeholder="Postal Code" value={newPostalCode} onChange={(e) => setNewPostalCode(e.target.value)} />
              </div>
            </div>

            <button type="submit" className="btn-black w-full mt-16" disabled={isSubmitting}>
              {isSubmitting ? 'Registering...' : 'Add to Pre-Approved Roster'}
            </button>
          </form>
        </section>
      ) : (
        <>
          {role === 'admin' && (
            <div className="flex-between mb-24">
              <h1 style={{ margin: 0 }}>Manage Companies</h1>
              <button className="btn-black" onClick={() => setShowAddForm(true)}>+ Add Company</button>
            </div>
          )}

          {role === 'admin' && (
            <div className="flex-row gap-8 mb-24" style={{ overflowX: 'auto', paddingBottom: '4px', borderBottom: '1px solid var(--border-color)' }}>
              {['All', 'Active', 'Pre-Approved', 'Inactive', 'Archived'].map(tab => (
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
          )}

          <div className="search-box-wrapper mb-24" style={{ width: '100%' }}>
            <span className="search-icon">🔍</span>
            <input 
              type="text" 
              placeholder={role === 'admin' ? `Search ${activeTab.toLowerCase()} companies...` : "Search companies..."} 
              className="search-input" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
            />
          </div>

          {isLoading ? (
            <p className="text-center text-secondary">Loading companies...</p>
          ) : currentCompanies.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
              {currentCompanies.map(company => {
                const currentStatus = company.status === 'Approved' ? 'Active' : (company.status || 'Active');
                
                // 🚨 LOCATION UPDATE: Format string safely
                const locationText = [company.city, company.country].filter(Boolean).join(', ');

                return (
                  <div 
                    key={company.id} 
                    className="card p-20" 
                    style={{ display: 'flex', flexDirection: 'column', height: '100%', cursor: 'pointer', opacity: currentStatus === 'Archived' ? 0.6 : 1 }} 
                    onClick={() => !company.isPreApprovedOnly && navigate(`/company/${company.id}`)} 
                  >
                    <div className="flex-between-start mb-16">
                      <div className="flex-row gap-16 align-center">
                        <div style={{ width: '56px', height: '56px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-color)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {company.logo_url ? (
                            <img src={company.logo_url} alt={`${company.name} logo`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <img src="https://placehold.co/100x100/e5e7eb/6b7280?text=🏢" alt="Default Company" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          )}
                        </div>
                        <div>
                          <h3 className="text-lg" style={{ margin: '0 0 4px 0' }}>{company.name}</h3>
                          <p className="text-sm text-secondary" style={{ margin: 0 }}>
                            📍 {locationText || company.address || 'Location not specified'} 
                            {company.founded_year && ` • Est. ${company.founded_year}`}
                          </p>
                        </div>
                      </div>

                      {role === 'admin' && (
                        <span style={{
                          padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', flexShrink: 0,
                          backgroundColor: currentStatus === 'Active' ? '#dcfce7' : currentStatus === 'Inactive' ? '#fef9c3' : currentStatus === 'Pre-Approved' ? '#e0e7ff' : '#f3f4f6',
                          color: currentStatus === 'Active' ? '#166534' : currentStatus === 'Inactive' ? '#854d0e' : currentStatus === 'Pre-Approved' ? '#3730a3' : '#374151'
                        }}>
                          {currentStatus}
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-secondary mb-24" style={{ lineHeight: '1.5', flexGrow: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {company.description || "No description provided."}
                    </p>

                    <div className="flex-col gap-8">
                      {role === 'admin' && !company.isPreApprovedOnly && (
                        <div className="flex-row gap-8 mb-8">
                          {currentStatus !== 'Active' && (
                            <button className="btn-outline flex-grow btn-sm" onClick={(e) => handleUpdateStatus(e, company.id, 'Active')} style={{ borderColor: '#86efac', color: '#166534', background: '#ecfdf5' }}>Set Active</button>
                          )}
                          {currentStatus !== 'Inactive' && (
                            <button className="btn-outline flex-grow btn-sm" onClick={(e) => handleUpdateStatus(e, company.id, 'Inactive')} style={{ borderColor: '#fde047', color: '#854d0e', background: '#fefce8' }}>Set Inactive</button>
                          )}
                          {currentStatus !== 'Archived' && (
                            <button className="btn-outline flex-grow btn-sm" onClick={(e) => handleUpdateStatus(e, company.id, 'Archived')} style={{ borderColor: '#d1d5db', color: '#374151', background: '#f9fafb' }}>Archive</button>
                          )}
                        </div>
                      )}

                      {!company.isPreApprovedOnly && (
                        <button className="btn-outline w-full" onClick={(e) => { e.stopPropagation(); navigate(`/company/${company.id}`); }}>
                          View Company Profile
                        </button>
                      )}

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
                );
              })}
            </div>
          ) : (
            <div className="card text-center text-secondary p-20" style={{ padding: '48px 24px' }}>
              <div className="text-3xl mb-16">🏢</div>
              <h3 className="mb-8">No matching companies found</h3>
              <p>Try adjusting your search or tab filters.</p>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex-between align-center mt-32">
              <p className="text-sm text-secondary" style={{ margin: 0 }}>
                Showing {indexOfFirstCompany + 1} to {Math.min(indexOfLastCompany, filteredCompanies.length)} of {filteredCompanies.length} companies
              </p>
              <div className="flex-row gap-8">
                <button 
                  className="btn-outline btn-sm" 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <button 
                  className="btn-outline btn-sm" 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          )}

        </>
      )}
    </div>
  );
}