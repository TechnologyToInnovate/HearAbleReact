import React, { useState, useEffect, useMemo } from 'react';
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
import LocationSelect from '../components/common/LocationSelect'; // Added import

export default function Companies({ role }) {
  const navigate = useNavigate();
  const { companies, isLoading, refetch } = useCompanies();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [sortBy, setSortBy] = useState('name_asc'); 
  const [currentPage, setCurrentPage] = useState(1);
  const companiesPerPage = 6;

  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newCountry, setNewCountry] = useState('Philippines');
  const [newCity, setNewCity] = useState('');
  const [newPostalCode, setNewPostalCode] = useState('');
  const [newIndustry, setNewIndustry] = useState('');
  const [newFoundedYear, setNewFoundedYear] = useState('');
  const [newWebsite, setNewWebsite] = useState('');
  const [newDescription, setNewDescription] = useState('');

  // Generate an array of years from the current year down to 1900
  const currentYear = new Date().getFullYear();
  const years = useMemo(() => {
    return Array.from(new Array(currentYear - 1899), (val, index) => currentYear - index);
  }, [currentYear]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab, sortBy]);

  useEffect(() => {
    setSortBy('name_asc');
  }, [activeTab]);

  async function handleAddCompany(e) {
    e.preventDefault();
    setIsSubmitting(true);
    const emailToCheck = newEmail.toLowerCase().trim();

    try {
      const { data: isAdmin } = await supabase.from('admins').select('email').eq('email', emailToCheck).maybeSingle();
      if (isAdmin) {
        alert("Registration Blocked: This email is already registered as a System Administrator.");
        setIsSubmitting(false);
        return;
      }

      const { data: isUser } = await supabase.from('profiles').select('id').eq('email', emailToCheck).maybeSingle();
      if (isUser) {
        alert("Registration Blocked: This email is already registered as a Standard User.");
        setIsSubmitting(false);
        return;
      }

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
      
      setNewEmail(''); setNewName(''); setNewCountry('Philippines'); setNewCity(''); setNewPostalCode('');
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
        // Added overflow: 'visible' to prevent dropdown clipping
        <section className="card p-20 mb-32" style={{ maxWidth: '800px', margin: '0 auto 32px', overflow: 'visible' }}>
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
            
            {/* Updated Year Founded to a dropdown */}
            <div className="form-grid-3 mt-8">
              <div><label>Industry *</label><input type="text" className="search-input w-full" value={newIndustry} onChange={(e) => setNewIndustry(e.target.value)} required /></div>
              <div>
                <label>Year Founded</label>
                <select className="search-input w-full" value={newFoundedYear} onChange={e => setNewFoundedYear(e.target.value)}>
                  <option value="">Select Year</option>
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div><label>Website</label><input type="url" className="search-input w-full" value={newWebsite} onChange={(e) => setNewWebsite(e.target.value)} /></div>
            </div>
            
            <div className="mt-8">
              <label>About the Company</label>
              <textarea className="search-input w-full" rows="3" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} />
            </div>
            
            {/* Replaced location inputs with LocationSelect component */}
            <label style={{ display: 'block', fontWeight: '500', marginTop: '16px' }}>Location Details *</label>
            <div className="flex-col gap-16">
              <LocationSelect country={newCountry} setCountry={setNewCountry} city={newCity} setCity={setNewCity} />
              <input type="text" className="search-input w-full" placeholder="Postal Code" value={newPostalCode} onChange={(e) => setNewPostalCode(e.target.value.replace(/\D/g, ''))} />
            </div>
            
            <button type="submit" className="btn-black w-full mt-24" disabled={isSubmitting}>
              {isSubmitting ? 'Registering...' : 'Add to Pre-Approved Roster'}
            </button>
          </form>
        </section>
      ) : (
        <>
          <div className="flex-between mb-24" style={{ flexWrap: 'wrap', gap: '16px' }}>
            <div className="flex-row align-center gap-16 flex-wrap">
              <h1 style={{ margin: 0 }}>{role === 'admin' ? 'Manage Users' : 'Companies'}</h1>
              {role === 'admin' && (
                <div className="flex-row" style={{ background: 'var(--bg-color)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <button 
                    onClick={() => navigate('/users')}
                    style={{ padding: '6px 16px', borderRadius: '6px', border: 'none', fontWeight: '500', cursor: 'pointer', background: 'transparent', color: 'var(--secondary-text)', boxShadow: 'none' }}
                  >
                    Job Seekers
                  </button>
                  <button 
                    onClick={() => navigate('/companies')}
                    style={{ padding: '6px 16px', borderRadius: '6px', border: 'none', fontWeight: '500', cursor: 'pointer', background: 'var(--card-bg)', color: 'var(--text-color)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
                  >
                    Employers
                  </button>
                </div>
              )}
            </div>
            
            {role === 'admin' && (
              <button className="btn-black" onClick={() => setShowAddForm(true)}>Add Company</button>
            )}
          </div>

          {role === 'admin' && (
            <div className="flex-row gap-8 mb-24" style={{ overflowX: 'auto', paddingBottom: '4px', borderBottom: '1px solid var(--border-color)' }}>
              {['All', 'Active', 'Inactive', 'Pre-Approved', 'Archived'].map(tab => (
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
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {currentCompanies.map(company => {
                const currentStatus = company.status === 'Approved' ? 'Active' : (company.status || 'Active');
                const city = company.locations?.city || company.city;
                const country = company.locations?.country || company.country;
                const locationText = formatLocation(city, country);

                const hasDeafBadge = company.has_interpreters || company.has_trained_staff || company.has_visual_alarms || company.has_captioning;

                const maxChars = 150;
                const desc = company.description || '';
                const isLongDesc = desc.length > maxChars;
                const displayDesc = isLongDesc ? desc.substring(0, maxChars).trim() + '...' : desc;

                return (
                  <div
                    key={company.id}
                    className="card p-24"
                    style={{ display: 'flex', flexDirection: 'column', gap: '16px', cursor: 'pointer', opacity: currentStatus === 'Archived' ? 0.6 : 1 }}
                    onClick={() => !company.isPreApprovedOnly && navigate(`/company/${company.id}`)}
                  >
                    
                    <div className="flex-between-start" style={{ flexWrap: 'wrap', gap: '16px' }}>
                      <div className="flex-row gap-16 align-start" style={{ flex: '1 1 300px' }}>
                        <Avatar src={company.logo_url} fallbackName={company.name} size="md" type="company" />
                        <div>
                          <h3 className="text-xl" style={{ margin: '0 0 8px 0' }}>
                            {company.name}
                          </h3>
                          <p className="text-sm text-secondary" style={{ margin: 0 }}>
                            {locationText}
                            {company.founded_year && ` • Est. ${company.founded_year}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex-col align-end gap-8" style={{ flexShrink: 0 }}>
                        <div className="flex-row gap-8 align-center">
                          {hasDeafBadge && role !== 'guest' && <DeafAccessibleBadge size="sm" showText={true} features={company} isAccessible={hasDeafBadge} />}
                          {role === 'admin' && <StatusBadge status={currentStatus} />}
                        </div>
                        {role === 'admin' && (
                          <span className="text-sm text-secondary" style={{ fontSize: '0.8rem' }}>
                            Joined: {formatShortDate(company.created_at)}
                          </span>
                        )}
                      </div>
                    </div>

                    {desc && (
                      <div style={{ marginTop: '4px' }}>
                        <p className="text-secondary text-sm" style={{ margin: 0, lineHeight: '1.6' }}>
                          {displayDesc}
                          {isLongDesc && (
                            <span 
                              style={{ color: 'var(--primary-color)', fontWeight: '600', marginLeft: '6px', cursor: 'pointer' }}
                              onClick={(e) => {
                                e.stopPropagation(); 
                                if (!company.isPreApprovedOnly) navigate(`/company/${company.id}`);
                              }}
                            >
                              more
                            </span>
                          )}
                        </p>
                      </div>
                    )}

                    <div className="flex-row align-center" style={{ justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '8px', flexWrap: 'wrap', gap: '16px' }}>
                      {!company.isPreApprovedOnly && (
                        <button className="btn-black btn-sm" onClick={(e) => { e.stopPropagation(); navigate(`/company/${company.id}`); }}>
                          View Profile
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
                <button className="btn-outline btn-sm" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>&larr; Previous</button>
                <button className="btn-outline btn-sm" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>Next &rarr;</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}