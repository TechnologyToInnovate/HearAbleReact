import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function EditCompanyModal({ companyId, onClose }) {
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [foundedYear, setFoundedYear] = useState('');
  const [website, setWebsite] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [description, setDescription] = useState('');
  
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');

  // --- CONTACT PERSON STATE (UPDATED) ---
  const [contactPersonName, setContactPersonName] = useState('');
  const [contactPersonPic, setContactPersonPic] = useState('');
  const [contactPersonEmail, setContactPersonEmail] = useState('');
  const [contactPersonNumber, setContactPersonNumber] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchCompanyDetails() {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      if (data) {
        setName(data.name || '');
        setIndustry(data.industry || '');
        setFoundedYear(data.founded_year || '');
        setWebsite(data.website || '');
        setLogoUrl(data.logo_url || '');
        setDescription(data.description || '');
        
        setCountry(data.country || '');
        setCity(data.city || '');
        setPostalCode(data.postal_code || '');

        // Load split contact person data
        setContactPersonName(data.contact_person_name || '');
        setContactPersonPic(data.contact_person_pic || '');
        setContactPersonEmail(data.contact_person_email || '');
        setContactPersonNumber(data.contact_person_number || '');
      } else {
        console.error("Error fetching company:", error);
      }
      setIsLoading(false);
    }
    fetchCompanyDetails();
  }, [companyId]);

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSubmitting(true);

    const updatedData = {
      name: name.trim(),
      industry: industry.trim(),
      founded_year: foundedYear ? parseInt(foundedYear, 10) : null,
      website: website.trim(),
      logo_url: logoUrl.trim(),
      description: description.trim(),
      country: country.trim() || null,
      city: city.trim() || null,
      postal_code: postalCode.trim() || null,
      // Save split contact person data
      contact_person_name: contactPersonName.trim() || null,
      contact_person_pic: contactPersonPic.trim() || null,
      contact_person_email: contactPersonEmail.trim() || null,
      contact_person_number: contactPersonNumber.trim() || null
    };

    const { error } = await supabase
      .from('companies')
      .update(updatedData)
      .eq('id', companyId);

    setIsSubmitting(false);

    if (!error) {
      onClose(); 
    } else {
      alert("Failed to update company profile.");
      console.error(error);
    }
  }

  const overlayStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 9999, padding: '20px'
  };

  return (
    <div style={overlayStyle}>
      <div className="card p-0" style={{ width: '100%', maxWidth: '700px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-color)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden' }}>
        
        <div className="flex-between" style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', background: 'var(--card-bg)' }}>
          <h2 style={{ margin: 0 }}>Edit Company Profile</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-color)' }}>✕</button>
        </div>

        <div style={{ padding: '24px', overflowY: 'auto' }}>
          {isLoading ? (
            <p className="text-center text-secondary">Loading profile data...</p>
          ) : (
            <form onSubmit={handleSubmit} className="flex-col gap-24">
              
              <div>
                <label className="mb-8" style={{ display: 'block', fontWeight: '500' }}>Company Name *</label>
                <input type="text" className="search-input w-full" value={name} onChange={e => setName(e.target.value)} required />
              </div>

              <div className="form-grid-2">
                <div>
                  <label className="mb-8" style={{ display: 'block', fontWeight: '500' }}>Industry</label>
                  <input type="text" className="search-input w-full" placeholder="e.g. Technology" value={industry} onChange={e => setIndustry(e.target.value)} />
                </div>
                <div>
                  <label className="mb-8" style={{ display: 'block', fontWeight: '500' }}>Founded Year</label>
                  <input type="number" className="search-input w-full" placeholder="e.g. 2015" value={foundedYear} onChange={e => setFoundedYear(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="mb-8" style={{ display: 'block', fontWeight: '500' }}>Headquarters / Location</label>
                <div className="form-grid-3">
                  <input type="text" className="search-input w-full" placeholder="Country" value={country} onChange={e => setCountry(e.target.value)} />
                  <input type="text" className="search-input w-full" placeholder="City" value={city} onChange={e => setCity(e.target.value)} />
                  <input type="text" className="search-input w-full" placeholder="Postal Code" value={postalCode} onChange={e => setPostalCode(e.target.value)} />
                </div>
              </div>

              <div className="form-grid-2">
                <div>
                  <label className="mb-8" style={{ display: 'block', fontWeight: '500' }}>Website URL</label>
                  <input type="url" className="search-input w-full" placeholder="https://example.com" value={website} onChange={e => setWebsite(e.target.value)} />
                </div>
                <div>
                  <label className="mb-8" style={{ display: 'block', fontWeight: '500' }}>Company Logo URL</label>
                  <input type="url" className="search-input w-full" placeholder="Link to your image" value={logoUrl} onChange={e => setLogoUrl(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="mb-8" style={{ display: 'block', fontWeight: '500' }}>About the Company</label>
                <textarea className="search-input w-full" style={{ height: '120px', resize: 'vertical' }} placeholder="Describe your company, mission, and culture..." value={description} onChange={e => setDescription(e.target.value)} />
              </div>

              {/* --- UPDATED: CONTACT PERSON SECTION --- */}
              <div style={{ padding: '24px', background: 'var(--card-bg)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <h4 style={{ margin: '0 0 16px 0' }}>Company Representative</h4>
                
                <div className="flex-col gap-16">
                  <div className="form-grid-2">
                    <div>
                      <label className="mb-8" style={{ display: 'block', fontWeight: '500' }}>Full Name</label>
                      <input type="text" className="search-input w-full" placeholder="e.g. Jane Doe" value={contactPersonName} onChange={e => setContactPersonName(e.target.value)} />
                    </div>
                    <div>
                      <label className="mb-8" style={{ display: 'block', fontWeight: '500' }}>Profile Picture URL</label>
                      <input type="url" className="search-input w-full" placeholder="Link to profile image" value={contactPersonPic} onChange={e => setContactPersonPic(e.target.value)} />
                    </div>
                  </div>
                  
                  <div className="form-grid-2">
                    <div>
                      <label className="mb-8" style={{ display: 'block', fontWeight: '500' }}>Email Address</label>
                      <input type="email" className="search-input w-full" placeholder="e.g. jane@company.com" value={contactPersonEmail} onChange={e => setContactPersonEmail(e.target.value)} />
                    </div>
                    <div>
                      <label className="mb-8" style={{ display: 'block', fontWeight: '500' }}>Phone Number</label>
                      <input type="tel" className="search-input w-full" placeholder="e.g. +1 234 567 8900" value={contactPersonNumber} onChange={e => setContactPersonNumber(e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-row gap-16 mt-8" style={{ paddingTop: '24px', borderTop: '1px solid var(--border-color)', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-outline" onClick={onClose} disabled={isSubmitting}>Cancel</button>
                <button type="submit" className="btn-black" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Changes'}</button>
              </div>

            </form>
          )}
        </div>
      </div>
    </div>
  );
}