import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../supabaseClient';
import LocationSelect from '../common/LocationSelect';

export default function EditCompanyModal({ companyId, onClose, onSuccess }) {
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [foundedYear, setFoundedYear] = useState('');
  const [website, setWebsite] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [description, setDescription] = useState('');
  
  const [locationId, setLocationId] = useState(null);
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');

  const [contactId, setContactId] = useState(null);
  const [contactPersonName, setContactPersonName] = useState('');
  const [contactPersonPic, setContactPersonPic] = useState('');
  const [contactPersonEmail, setContactPersonEmail] = useState('');
  const [contactPersonNumber, setContactPersonNumber] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate an array of years from the current year down to 1900
  const currentYear = new Date().getFullYear();
  const years = useMemo(() => {
    return Array.from(new Array(currentYear - 1899), (val, index) => currentYear - index);
  }, [currentYear]);

  useEffect(() => {
    async function fetchCompanyDetails() {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('companies')
        .select(`*, locations(*), company_contacts(*)`)
        .eq('id', companyId)
        .single();

      if (data) {
        setName(data.name || ''); setIndustry(data.industry || ''); setFoundedYear(data.founded_year || '');
        setWebsite(data.website || ''); setLogoUrl(data.logo_url || ''); setDescription(data.description || '');
        
        if (data.locations) {
          setLocationId(data.locations.id);
          setCountry(data.locations.country || ''); 
          setCity(data.locations.city || ''); 
          setPostalCode(data.locations.postal_code || '');
        }

        if (data.company_contacts && data.company_contacts.length > 0) {
          const contact = data.company_contacts[0];
          setContactId(contact.id);
          setContactPersonName(contact.name || ''); 
          setContactPersonPic(contact.profile_pic_url || '');
          setContactPersonEmail(contact.email || ''); 
          setContactPersonNumber(contact.contact_number || '');
        }
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

    try {
      let finalLocationId = locationId;
      
      const safeCountry = String(country).trim();
      const safeCity = String(city).trim();
      const safePostal = String(postalCode).trim();

      if (safeCountry || safeCity || safePostal) {
        const locationPayload = {
          country: safeCountry || 'Not specified',
          city: safeCity || 'Not specified',
          postal_code: safePostal || null
        };

        if (locationId) {
          const { error: updateLocError } = await supabase.from('locations').update(locationPayload).eq('id', locationId);
          if (updateLocError) throw updateLocError;
        } else {
          const { data: locData, error: locErr } = await supabase.from('locations').insert([locationPayload]).select().single();
          if (locErr) throw locErr;
          if (locData) finalLocationId = locData.id;
        }
      }

      const parsedYear = parseInt(foundedYear, 10);
      const updatedCompanyData = {
        name: String(name).trim(), 
        industry: String(industry).trim(), 
        founded_year: isNaN(parsedYear) ? null : parsedYear,
        website: String(website).trim(), 
        logo_url: String(logoUrl).trim(), 
        description: String(description).trim(),
        location_id: finalLocationId
      };

      const { error: companyError } = await supabase.from('companies').update(updatedCompanyData).eq('id', companyId);
      if (companyError) throw companyError;

      if (contactPersonName.trim() || contactPersonEmail.trim() || contactPersonNumber.trim()) {
        const contactPayload = {
          company_id: companyId,
          name: contactPersonName.trim() || 'Representative',
          profile_pic_url: contactPersonPic.trim() || null,
          email: contactPersonEmail.trim() || null,
          contact_number: contactPersonNumber.trim() || null
        };

        if (contactId) {
          await supabase.from('company_contacts').update(contactPayload).eq('id', contactId);
        } else {
          await supabase.from('company_contacts').insert([contactPayload]);
        }
      }

      if (onSuccess) onSuccess(); 
      onClose(); 
    } catch (error) {
      console.error(error);
      alert("Failed to update company profile.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ overflow: 'visible' }}>
        <div className="modal-header">
          <h2 className="m-0">Edit Company Profile</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ overflowY: 'visible', overflowX: 'hidden', paddingBottom: '32px' }}>
          {isLoading ? (
            <p className="text-center text-secondary">Loading profile data...</p>
          ) : (
            <form onSubmit={handleSubmit} className="flex-col gap-24">
              
              <div>
                <label className="mb-8 block font-medium">Company Name *</label>
                <input type="text" className="search-input w-full" value={name} onChange={e => setName(e.target.value)} required />
              </div>

              <div className="form-grid-2">
                <div>
                  <label className="mb-8 block font-medium">Industry</label>
                  <input type="text" className="search-input w-full" placeholder="e.g. Technology" value={industry} onChange={e => setIndustry(e.target.value)} />
                </div>
                <div>
                  <label className="mb-8 block font-medium">Founded Year</label>
                  <select className="search-input w-full" value={foundedYear} onChange={e => setFoundedYear(e.target.value)}>
                    <option value="">Select Year</option>
                    {years.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-8 block font-medium">Location</label>
                <div className="flex-col gap-16">
                  <LocationSelect country={country} setCountry={setCountry} city={city} setCity={setCity} />
                  <input type="text" className="search-input w-full" placeholder="Postal Code" value={postalCode} onChange={e => setPostalCode(e.target.value.replace(/\D/g, ''))} />
                </div>
              </div>

              <div className="form-grid-2">
                <div>
                  <label className="mb-8 block font-medium">Website URL</label>
                  <input type="url" className="search-input w-full" placeholder="https://example.com" value={website} onChange={e => setWebsite(e.target.value)} />
                </div>
                <div>
                  <label className="mb-8 block font-medium">Company Logo URL</label>
                  <input type="url" className="search-input w-full" placeholder="Link to your image" value={logoUrl} onChange={e => setLogoUrl(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="mb-8 block font-medium">About the Company</label>
                <textarea className="search-input w-full" style={{ height: '120px', resize: 'vertical' }} placeholder="Describe your company..." value={description} onChange={e => setDescription(e.target.value)} />
              </div>

              <div className="sub-card">
                <h4 className="mb-16 m-0">Company Representative</h4>
                <div className="flex-col gap-16">
                  <div className="form-grid-2">
                    <div>
                      <label className="mb-8 block font-medium">Full Name</label>
                      <input type="text" className="search-input w-full" placeholder="e.g. Jane Doe" value={contactPersonName} onChange={e => setContactPersonName(e.target.value)} />
                    </div>
                    <div>
                      <label className="mb-8 block font-medium">Profile Picture URL</label>
                      <input type="url" className="search-input w-full" placeholder="Link to profile image" value={contactPersonPic} onChange={e => setContactPersonPic(e.target.value)} />
                    </div>
                  </div>
                  
                  <div className="form-grid-2">
                    <div>
                      <label className="mb-8 block font-medium">Email Address</label>
                      <input type="email" className="search-input w-full" placeholder="e.g. jane@company.com" value={contactPersonEmail} onChange={e => setContactPersonEmail(e.target.value)} />
                    </div>
                    <div>
                      <label className="mb-8 block font-medium">Phone Number</label>
                      <input type="tel" className="search-input w-full" placeholder="e.g. 1234567890" value={contactPersonNumber} onChange={e => setContactPersonNumber(e.target.value.replace(/\D/g, ''))} />
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