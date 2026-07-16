import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useCompanies } from '../hooks/useCompanies';
import { sortData } from '../utils/sortUtils';
import { formatLocation } from '../utils/formatUtils';
import { formatShortDate } from '../utils/dateUtils';
import SearchBar from '../components/common/SearchBar';
import Avatar from '../components/common/Avatar';
import StatusBadge from '../components/common/StatusBadge';
import DeafAccessibleBadge from '../components/common/DeafAccessibleBadge';

export default function Companies({ role }) {
  const navigate = useNavigate();
  const { companies, isLoading, setCompanies, refetch } = useCompanies();
  
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
    setCurrentPage(1);
  }, [searchQuery, activeTab, sortBy]);

  useEffect(() => {
    setSortBy(activeTab === 'Pending' ? 'date_asc' : 'name_asc');
  }, [activeTab]);

  async function handleAddCompany(e) {
    e.preventDefault();
    setIsSubmitting(true);
    const emailToCheck = newEmail.toLowerCase().trim();

    try {
      // 🚨 CROSS-VERIFICATION SECURITY CHECKS

      // 1. Check if email is already an Administrator
      const { data: isAdmin } = await supabase.from('admins').select('email').eq('email', emailToCheck).maybeSingle();
      if (isAdmin) {
        alert("Registration Blocked: This email is already registered as a System Administrator.");
        setIsSubmitting(false);
        return;
      }

      // 2. Check if email is already a Standard User
      const { data: isUser } = await supabase.from('profiles').select('id').eq('email', emailToCheck).maybeSingle();
      if (isUser) {
        alert("Registration Blocked: This email is already registered as a Standard User.");
        setIsSubmitting(false);
        return;
      }

      // Proceed with inserting location first
      let locationId = null;
      if (newCountry.trim() || newCity.trim() || newPostalCode.trim()) {
        const { data: locData, error: locError } = await supabase
          .from('locations')
          .insert([{ 
            country: newCountry.trim() || 'Not specified', 
            city: newCity.trim() || 'Not specified',
            postal_code: newPostalCode.trim() || null
          }])
          .select()
          .single();
          
        if (locError) throw locError;
        if (locData) locationId = locData.id;
      }

      // Insert company into pre_approved_companies
      const { error: companyError } = await supabase.from('pre_approved_companies').insert([{
        email: emailToCheck, 
        name: newName, 
        location_id: locationId,
        industry: newIndustry.trim() || null, 
        founded_year: newFoundedYear ? parseInt(newFoundedYear) : null,
        website: newWebsite.trim() || null, 
        description: newDescription.trim() || null
      }]);

      if (companyError) throw companyError;

      alert(`Success! ${emailToCheck} is on the roster.`);
      
      setNewEmail(''); setNewName(''); setNewCountry(''); setNewCity(''); setNewPostalCode('');
      setNewIndustry(''); setNewFoundedYear(''); setNewWebsite(''); setNewDescription('');
      setShowAddForm(false);
      refetch(); 
      
    } catch (error) {
      console.error(error);
      alert("Failed to pre-approve company. Ensure the email is not already on the roster.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdateStatus(e, id, newStatus) {
    e.stopPropagation(); 
    const updatePayload = { status: newStatus };
    if (newStatus === 'Active') updatePayload.approved_at = new Date().toISOString();

    const { error } = await supabase.from('companies').update(updatePayload).eq('id', id);
    if (!error) {
      setCompanies(companies.map(c => c.id === id ? { ...c, status: newStatus } : c));
    } else {
      alert("Failed to update status.");
    }
  }

  async function handleToggleDeafAccessibility(e, id, currentStatus) {
    e.stopPropagation();
    const newStatus = !currentStatus;
    const { error } = await supabase.from('companies').update({ is_deaf_accessible: newStatus }).eq('id', id);
    
    if (!error) {
      setCompanies(companies.map(c => c.id === id ? { ...c, is_deaf_accessible: newStatus } : c));
    } else {
      alert("Failed to update accessibility status.");
    }
  }

  let filteredCompanies = companies.filter(company => {
    const searchCity = company.locations?.city || company.city || '';
    const searchCountry = company.locations?.country || company.country || '';

    const matchesSearch = (company.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (company.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      searchCity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      searchCountry.toLowerCase().includes(searchQuery.toLowerCase());

    const currentStatus = company.status === 'Approved' ? 'Active' : (company.status || 'Active');

    if (role !== 'admin') return matchesSearch && currentStatus === 'Active';

    const matchesTab = activeTab === 'All' ? true : currentStatus === activeTab;
    return matchesSearch && matchesTab;
  });

  const sortedCompanies = sortData(filteredCompanies, sortBy, 'name', 'created_at');
  const indexOfLastCompany = currentPage * companiesPerPage;
  const indexOfFirstCompany = indexOfLastCompany - companiesPerPage;
  const currentCompanies = sortedCompanies.slice(indexOfFirstCompany, indexOfLastCompany);
  const totalPages = Math.ceil(sortedCompanies.length / companiesPerPage);

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
              <div><label>Company Email *</label><input type="email" className="search-input w-full" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required /></div>
              <div><label>Company Name *</label><input type="text" className="search-input w-full" value={newName} onChange={(e) => setNewName(e.target.value)} required /></div>
            </div>
            <div className="form-grid-3 mt-8">
              <div><label>Industry</label><input type="text" className="search-input w-full" value={newIndustry} onChange={(e) => setNewIndustry(e.target.value)} /></div>
              <div><label>Year Founded</label><input type="number" className="search-input w-full" value={newFoundedYear} onChange={(e) => setNewFoundedYear(e.target.value)} /></div>
              <div><label>Website</label><input type="url" className="search-input w-full" value={newWebsite} onChange={(e) => setNewWebsite(e.target.value)} /></div>
            </div>
            <div className="mt-8">
              <label>About the Company</label>
              <textarea className="search-input w-full" rows="3" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} />
            </div>
            <label style={{ display: 'block', fontWeight: '500', marginTop: '16px' }}>Location Details</label>
            <div className="form-grid-3">
              <div><input type="text" className="search-input w-full" placeholder="Country" value={newCountry} onChange={(e) => setNewCountry(e.target.value)} /></div>
              <div><input type="text" className="search-input w-full" placeholder="City" value={newCity} onChange={(e) => setNewCity(e.target.value)} /></div>
              <div><input type="text" className="search-input w-full" placeholder="Postal Code" value={newPostalCode} onChange={(e) => setNewPostalCode(e.target.value.replace(/\D/g, ''))} /></div>
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
          )}

          <div className="flex-row-wrap gap-16 mb-24">
            <div style={{ flexGrow: 1 }}>
              <SearchBar 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                placeholder={role === 'admin' ? `Search ${activeTab.toLowerCase()} companies...` : "Search companies..."} 
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
                const city = company.locations?.city || company.city;
                const country = company.locations?.country || company.country;
                const locationText = formatLocation(city, country);

                return (
                  <div
                    key={company.id}
                    className="card p-20"
                    style={{ display: 'flex', flexDirection: 'column', height: '100%', cursor: 'pointer', opacity: currentStatus === 'Archived' ? 0.6 : 1 }}
                    onClick={() => !company.isPreApprovedOnly && navigate(`/company/${company.id}`)}
                  >
                    <div className="flex-between-start mb-16">
                      <div className="flex-row gap-16 align-start" style={{ flex: 1, minWidth: 0, paddingRight: '16px' }}>
                        <div style={{ flexShrink: 0 }}>
                          <Avatar src={company.logo_url} fallbackName={company.name} size="md" type="company" />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h3 className="text-lg" style={{ margin: '0 0 4px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={company.name}>
                            {company.name}
                          </h3>
                          {role === 'admin' && (
                            <p className="text-sm m-0 mb-4" style={{ color: 'var(--text-color)', opacity: 0.8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {company.email || 'Email not provided'}
                            </p>
                          )}
                          <p className="text-sm text-secondary" style={{ margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {locationText}
                            {company.founded_year && ` • Est. ${company.founded_year}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex-col align-end gap-8" style={{ flexShrink: 0 }}>
                        {company.is_deaf_accessible && <DeafAccessibleBadge size="sm" showText={true} />}
                        {role === 'admin' && (
                          <>
                            <StatusBadge status={currentStatus} />
                            <span className="text-sm text-secondary" style={{ fontSize: '0.8rem' }}>
                              Joined: {formatShortDate(company.created_at)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-secondary mb-24" style={{ lineHeight: '1.5', flexGrow: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {company.description || "No description provided."}
                    </p>

                    <div className="flex-col gap-8">
                      {role === 'admin' && !company.isPreApprovedOnly && (
                        <>
                          <div className="flex-row gap-8 mb-8">
                            {currentStatus !== 'Active' && <button className="btn-outline flex-grow btn-sm" onClick={(e) => handleUpdateStatus(e, company.id, 'Active')} style={{ borderColor: '#86efac', color: '#166534', background: '#ecfdf5' }}>Set Active</button>}
                            {currentStatus !== 'Inactive' && <button className="btn-outline flex-grow btn-sm" onClick={(e) => handleUpdateStatus(e, company.id, 'Inactive')} style={{ borderColor: '#fde047', color: '#854d0e', background: '#fefce8' }}>Set Inactive</button>}
                            {currentStatus !== 'Archived' && <button className="btn-outline flex-grow btn-sm" onClick={(e) => handleUpdateStatus(e, company.id, 'Archived')} style={{ borderColor: '#d1d5db', color: '#374151', background: '#f9fafb' }}>Archive</button>}
                          </div>
                          <div className="flex-row gap-8 mb-8">
                            <button 
                              className="btn-outline flex-grow btn-sm" 
                              onClick={(e) => handleToggleDeafAccessibility(e, company.id, company.is_deaf_accessible)} 
                              style={{ 
                                borderColor: company.is_deaf_accessible ? '#93c5fd' : '#d1d5db', 
                                color: company.is_deaf_accessible ? '#1d4ed8' : '#4b5563', 
                                background: company.is_deaf_accessible ? '#eff6ff' : '#f3f4f6' 
                              }}
                            >
                              {company.is_deaf_accessible ? 'Revoke Deaf Access' : 'Set Deaf Accessible'}
                            </button>
                          </div>
                        </>
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
                Showing {indexOfFirstCompany + 1} to {Math.min(indexOfLastCompany, sortedCompanies.length)} of {sortedCompanies.length} companies
              </p>
              <div className="flex-row gap-8">
                <button className="btn-outline btn-sm" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>Previous</button>
                <button className="btn-outline btn-sm" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>Next</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}