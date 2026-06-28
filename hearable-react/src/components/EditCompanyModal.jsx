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

  const [contactPersonName, setContactPersonName] = useState('');
  const [contactPersonPic, setContactPersonPic] = useState('');
  const [contactPersonEmail, setContactPersonEmail] = useState('');
  const [contactPersonNumber, setContactPersonNumber] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchCompanyDetails() {
      setIsLoading(true);
      const { data, error } = await supabase.from('companies').select('*').eq('id', companyId).single();

      if (data) {
        setName(data.name || ''); setIndustry(data.industry || ''); setFoundedYear(data.founded_year || '');
        setWebsite(data.website || ''); setLogoUrl(data.logo_url || ''); setDescription(data.description || '');
        setCountry(data.country || ''); setCity(data.city || ''); setPostalCode(data.postal_code || '');
        setContactPersonName(data.contact_person_name || ''); setContactPersonPic(data.contact_person_pic || '');
        setContactPersonEmail(data.contact_person_email || ''); setContactPersonNumber(data.contact_person_number || '');
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
      name: name.trim(), industry: industry.trim(), founded_year: foundedYear ? parseInt(foundedYear, 10) : null,
      website: website.trim(), logo_url: logoUrl.trim(), description: description.trim(),
      country: country.trim() || null, city: city.trim() || null, postal_code: postalCode.trim() || null,
      contact_person_name: contactPersonName.trim() || null, contact_person_pic: contactPersonPic.trim() || null,
      contact_person_email: contactPersonEmail.trim() || null, contact_person_number: contactPersonNumber.trim() || null
    };

    const { error } = await supabase.from('companies').update(updatedData).eq('id', companyId);
    setIsSubmitting(false);

    if (!error) onClose(); 
    else alert("Failed to update company profile.");
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        
        <div className="modal-header">
          <h2 className="m-0">Edit Company Profile</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {isLoading ? (
            <p className="text-center text-secondary">Loading profile data...</p>
          ) : (
            <form onSubmit={handleSubmit} className="flex-col gap-24">
              
              <div>
                <label className="mb-8" style={{ display: 'block', fontWeight: '500' }}>Company Name *</label>
                <input type="text" className="search-input" value={name} onChange={e => setName(e.target.value)} required />
              </div>

              <div className="form-grid-2">
                <div>
                  <label className="mb-8" style={{ display: 'block', fontWeight: '500' }}>Industry</label>
                  <input type="text" className="search-input" placeholder="e.g. Technology" value={industry} onChange={e => setIndustry(e.target.value)} />
                </div>
                <div>
                  <label className="mb-8" style={{ display: 'block', fontWeight: '500' }}>Founded Year</label>
                  <input type="number" className="search-input" placeholder="e.g. 2015" value={foundedYear} onChange={e => setFoundedYear(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="mb-8" style={{ display: 'block', fontWeight: '500' }}>Location</label>
                <div className="form-grid-3">
                  <input type="text" className="search-input" placeholder="Country" value={country} onChange={e => setCountry(e.target.value)} />
                  <input type="text" className="search-input" placeholder="City" value={city} onChange={e => setCity(e.target.value)} />
                  <input type="text" className="search-input" placeholder="Postal Code" value={postalCode} onChange={e => setPostalCode(e.target.value.replace(/\D/g, ''))} />
                </div>
              </div>

              <div className="form-grid-2">
                <div>
                  <label className="mb-8" style={{ display: 'block', fontWeight: '500' }}>Website URL</label>
                  <input type="url" className="search-input" placeholder="https://example.com" value={website} onChange={e => setWebsite(e.target.value)} />
                </div>
                <div>
                  <label className="mb-8" style={{ display: 'block', fontWeight: '500' }}>Company Logo URL</label>
                  <input type="url" className="search-input" placeholder="Link to your image" value={logoUrl} onChange={e => setLogoUrl(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="mb-8" style={{ display: 'block', fontWeight: '500' }}>About the Company</label>
                <textarea className="search-input" style={{ height: '120px', resize: 'vertical' }} placeholder="Describe your company..." value={description} onChange={e => setDescription(e.target.value)} />
              </div>

              {/* CONTACT PERSON SECTION */}
              <div className="sub-card">
                <h4 className="mb-16 m-0">Company Representative</h4>
                <div className="flex-col gap-16">
                  <div className="form-grid-2">
                    <div>
                      <label className="mb-8" style={{ display: 'block', fontWeight: '500' }}>Full Name</label>
                      <input type="text" className="search-input" placeholder="e.g. Jane Doe" value={contactPersonName} onChange={e => setContactPersonName(e.target.value)} />
                    </div>
                    <div>
                      <label className="mb-8" style={{ display: 'block', fontWeight: '500' }}>Profile Picture URL</label>
                      <input type="url" className="search-input" placeholder="Link to profile image" value={contactPersonPic} onChange={e => setContactPersonPic(e.target.value)} />
                    </div>
                  </div>
                  
                  <div className="form-grid-2">
                    <div>
                      <label className="mb-8" style={{ display: 'block', fontWeight: '500' }}>Email Address</label>
                      <input type="email" className="search-input" placeholder="e.g. jane@company.com" value={contactPersonEmail} onChange={e => setContactPersonEmail(e.target.value)} />
                    </div>
                    <div>
                      <label className="mb-8" style={{ display: 'block', fontWeight: '500' }}>Phone Number</label>
                      <input type="tel" className="search-input" placeholder="e.g. 1234567890" value={contactPersonNumber} onChange={e => setContactPersonNumber(e.target.value.replace(/\D/g, ''))} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-row gap-16 align-center justify-end divider m-0 mt-8">
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