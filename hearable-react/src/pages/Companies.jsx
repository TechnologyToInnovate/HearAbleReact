import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function Companies({ role }) {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [sortBy, setSortBy] = useState('name_asc'); 

  const [currentPage, setCurrentPage] = useState(1);
  const companiesPerPage = 10;

  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newCountry, setNewCountry] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newPostalCode, setNewPostalCode] = useState('');
  const [newIndustry, setNewIndustry] = useState('');
  const [newFoundedYear, setNewFoundedYear] = useState('');
  const [newWebsite, setNewWebsite] = useState('');
  const [newDescription, setNewDescription] = useState('');

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab, sortBy]);

  useEffect(() => {
    if (activeTab === 'Pending') {
      setSortBy('date_asc');
    } else {
      setSortBy('name_asc');
    }
  }, [activeTab]);

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
        description: pc.description || 'Pre-approved account. Waiting for the company to sign up.',
        isPreApprovedOnly: true,
        created_at: pc.created_at || new Date().toISOString()
      }));

    const combined = [...registered, ...pendingPreApproved];
    setCompanies(combined);
    setIsLoading(false);
  }

  async function handleAddCompany(e) {
    e.preventDefault();
    setIsSubmitting(true);

    const { error } = await supabase.from('pre_approved_companies').insert([{
      email: newEmail.toLowerCase().trim(),
      name: newName,
      country: newCountry.trim() || null,
      city: newCity.trim() || null,
      postal_code: newPostalCode.trim() || null,
      industry: newIndustry.trim() || null,
      founded_year: newFoundedYear ? parseInt(newFoundedYear) : null,
      website: newWebsite.trim() || null,
      description: newDescription.trim() || null
    }]);

    if (!error) {
      alert(`Success! ${newEmail} is on the roster.`);
      
      setNewEmail(''); setNewName(''); setNewCountry(''); setNewCity(''); setNewPostalCode('');
      setNewIndustry(''); setNewFoundedYear(''); setNewWebsite(''); setNewDescription('');
      
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
    
    const updatePayload = { status: newStatus };
    if (newStatus === 'Active') {
      updatePayload.approved_at = new Date().toISOString();
    }

    const { error } = await supabase.from('companies').update(updatePayload).eq('id', id);
    if (!error) {
      setCompanies(companies.map(c => c.id === id ? { ...c, status: newStatus } : c));
    } else {
      alert("Failed to update status.");
    }
  }

  let filteredCompanies = companies.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (company.email && company.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (company.city && company.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (company.country && company.country.toLowerCase().includes(searchQuery.toLowerCase()));

    const currentStatus = company.status === 'Approved' ? 'Active' : (company.status || 'Active');

    if (role !== 'admin') {
      return matchesSearch && currentStatus === 'Active';
    }

    let matchesTab = true;
    if (activeTab === 'Pending') matchesTab = currentStatus === 'Pending';
    if (activeTab === 'Active') matchesTab = currentStatus === 'Active';
    if (activeTab === 'Pre-Approved') matchesTab = currentStatus === 'Pre-Approved';
    if (activeTab === 'Inactive') matchesTab = currentStatus === 'Inactive';
    if (activeTab === 'Archived') matchesTab = currentStatus === 'Archived';

    return matchesSearch && matchesTab;
  });

  filteredCompanies.sort((a, b) => {
    if (sortBy === 'name_asc') return (a.name || '').localeCompare(b.name || '');
    if (sortBy === 'name_desc') return (b.name || '').localeCompare(a.name || '');
    if (sortBy === 'date_asc') return new Date(a.created_at || 0) - new Date(b.created_at || 0);
    if (sortBy === 'date_desc') return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    return 0;
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
            <button className="btn-outline btn-sm" onClick={() => setShowAddForm(false)}>Cancel</button>
          </div>
          <div className="mb-24" style={{ background: '#ecfdf5', color: '#047857', padding: '12px', borderRadius: '8px', border: '1px solid #a7f3d0', fontSize: '0.9rem' }}>
            <strong>Admin Notice:</strong> Fill out the company's details here. When they sign up, this data will be automatically applied to their new profile.
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

            <div className="form-grid-3 mt-8">
              <div>
                <label>Industry</label>
                <input type="text" className="search-input w-full" placeholder="e.g. Technology" value={newIndustry} onChange={(e) => setNewIndustry(e.target.value)} />
              </div>
              <div>
                <label>Year Founded</label>
                <input 
                  type="number" 
                  className="search-input w-full" 
                  placeholder="e.g. 2015" 
                  value={newFoundedYear} 
                  onChange={(e) => setNewFoundedYear(e.target.value)} 
                />
              </div>
              <div>
                <label>Website</label>
                <input type="url" className="search-input w-full" placeholder="https://..." value={newWebsite} onChange={(e) => setNewWebsite(e.target.value)} />
              </div>
            </div>

            <div className="mt-8">
              <label>About the Company</label>
              <textarea 
                className="search-input w-full" 
                placeholder="A brief description of the company..." 
                rows="3"
                value={newDescription} 
                onChange={(e) => setNewDescription(e.target.value)} 
              />
            </div>

            <label style={{ display: 'block', fontWeight: '500', marginTop: '16px' }}>Location Details</label>
            <div className="form-grid-3">
              <div>
                <input type="text" className="search-input w-full" placeholder="Country (e.g. USA)" value={newCountry} onChange={(e) => setNewCountry(e.target.value)} />
              </div>
              <div>
                <input type="text" className="search-input w-full" placeholder="City (e.g. Austin)" value={newCity} onChange={(e) => setNewCity(e.target.value)} />
              </div>
              <div>
                <input
                  type="text"
                  className="search-input w-full"
                  placeholder="Postal Code"
                  value={newPostalCode}
                  onChange={(e) => setNewPostalCode(e.target.value.replace(/\D/g, ''))}
                />
              </div>
            </div>

            <button type="submit" className="btn-black w-full mt-24" disabled={isSubmitting}>
              {isSubmitting ? 'Registering...' : 'Add to Pre-Approved Roster'}
            </button>
          </form>
        </section>
      ) : (
        <>
          {role === 'admin' && (
            <div className="flex-between mb-24">
              <h1 style={{ margin: 0 }}>Manage Companies</h1>
              <button className="btn-black" onClick={() => setShowAddForm(true)}>Add Company</button>
            </div>
          )}

          {role === 'admin' && (
            <div className="flex-row gap-8 mb-24" style={{ overflowX: 'auto', paddingBottom: '4px', borderBottom: '1px solid var(--border-color)' }}>
              {['All', 'Pending', 'Active', 'Inactive', 'Pre-Approved', 'Archived'].map(tab => (
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

          <div className="flex-row-wrap gap-16 mb-24">
            <div className="search-box-wrapper" style={{ flexGrow: 1 }}>
              <span className="search-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              </span>
              <input
                type="text"
                placeholder={role === 'admin' ? `Search ${activeTab.toLowerCase()} companies...` : "Search companies..."}
                className="search-input w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {role === 'admin' && (
              <select className="search-input" style={{ width: 'auto', minWidth: '180px' }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
                <option value="name_asc">Sort by: Name (A-Z)</option>
                <option value="name_desc">Sort by: Name (Z-A)</option>
                <option value="date_asc">Sort by: Oldest First</option>
                <option value="date_desc">Sort by: Newest First</option>
              </select>
            )}
          </div>

          {isLoading ? (
            <p className="text-center text-secondary">Loading companies...</p>
          ) : currentCompanies.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
              {currentCompanies.map(company => {
                const currentStatus = company.status === 'Approved' ? 'Active' : (company.status || 'Active');
                const locationText = [company.city, company.country].filter(Boolean).join(', ');

                return (
                  <div
                    key={company.id}
                    className="card p-20"
                    style={{ display: 'flex', flexDirection: 'column', height: '100%', cursor: 'pointer', opacity: currentStatus === 'Archived' ? 0.6 : 1 }}
                    onClick={() => !company.isPreApprovedOnly && navigate(`/company/${company.id}`)}
                  >
                    <div className="flex-between-start mb-16">
                      <div className="flex-row gap-16 align-start">
                        <div style={{ width: '56px', height: '56px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-color)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {company.logo_url ? (
                            <img src={company.logo_url} alt={`${company.name} logo`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 6h.01"></path><path d="M16 6h.01"></path><path d="M12 6h.01"></path><path d="M12 10h.01"></path><path d="M12 14h.01"></path><path d="M16 10h.01"></path><path d="M16 14h.01"></path><path d="M8 10h.01"></path><path d="M8 14h.01"></path></svg>
                          )}
                        </div>
                        <div>
                          <h3 className="text-lg" style={{ margin: '0 0 4px 0' }}>{company.name}</h3>
                          {/* 🚨 NEW: Added Company Email Here */}
                          <p className="text-sm m-0 mb-4" style={{ color: 'var(--text-color)', opacity: 0.8 }}>
                            {company.email || 'Email not provided'}
                          </p>
                          <p className="text-sm text-secondary" style={{ margin: 0 }}>
                            {locationText || company.address || 'Location not specified'}
                            {company.founded_year && ` • Est. ${company.founded_year}`}
                          </p>
                        </div>
                      </div>

                      {role === 'admin' && (
                        <div className="flex-col align-end gap-8">
                          <span style={{
                            padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', flexShrink: 0,
                            backgroundColor: currentStatus === 'Active' ? '#dcfce7' : currentStatus === 'Inactive' ? '#fef9c3' : currentStatus === 'Pre-Approved' ? '#e0e7ff' : '#f3f4f6',
                            color: currentStatus === 'Active' ? '#166534' : currentStatus === 'Inactive' ? '#854d0e' : currentStatus === 'Pre-Approved' ? '#3730a3' : '#374151'
                          }}>
                            {currentStatus}
                          </span>
                          <span className="text-sm text-secondary" style={{ fontSize: '0.8rem' }}>
                            Joined: {new Date(company.created_at).toLocaleDateString()}
                          </span>
                        </div>
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
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="card text-center text-secondary p-20" style={{ padding: '48px 24px' }}>
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