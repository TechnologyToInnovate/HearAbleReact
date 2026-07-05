import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

export default function CompanyOnboardingModal({ isOpen, companyData, onSuccess }) {
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [industry, setIndustry] = useState('');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');
  const [founded, setFounded] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (companyData) {
      setName(companyData.name || '');
      setCountry(companyData.country || '');
      setCity(companyData.city || '');
      setPostalCode(companyData.postal_code || '');
      setIndustry(companyData.industry || '');
      setWebsite(companyData.website || '');
      setDescription(companyData.description || '');
      setFounded(companyData.founded_year || '');
    }
  }, [companyData]);

  if (!isOpen) return null;

 async function handleSubmit(e) {
    e.preventDefault();
    setIsSubmitting(true);

    const parsedYear = parseInt(founded, 10);

    try {
      // 🚨 Handle Location creation/update
      let locationId = companyData.location_id;
      if (country.trim() || city.trim() || postalCode.trim()) {
        const locationPayload = {
          country: country.trim() || 'Not specified',
          city: city.trim() || 'Not specified',
          postal_code: postalCode.trim() || null
        };
        
        if (locationId) {
          await supabase.from('locations').update(locationPayload).eq('id', locationId);
        } else {
          const { data: locData } = await supabase.from('locations').insert([locationPayload]).select().single();
          if (locData) locationId = locData.id;
        }
      }

      // 🚨 Update companies without the stripped columns
      const { error } = await supabase.from('companies').update({
        name, location_id: locationId, industry, website, description, 
        founded_year: isNaN(parsedYear) ? null : parsedYear
      }).eq('id', companyData.id);

      if (error) throw error;
      onSuccess();
    } catch (error) {
      alert("Failed to update company profile.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    // 🚨 REPLACED INLINE STYLES[cite: 42]
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '600px' }}>
        
        <div className="modal-header flex-col align-start">
          <h2 className="m-0">Verify Company Profile</h2>
          <p className="text-secondary text-sm mt-8 m-0">Please review the details provided by the administrator and complete your profile to continue.</p>
        </div>
        
        <div className="modal-body">
          <form onSubmit={handleSubmit} className="flex-col gap-24">
            <div>
              <label className="block mb-8 font-bold">Company Name *</label>
              <input type="text" className="search-input w-full" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            
            <div>
              <label className="block mb-8 font-bold">Headquarters / Location *</label>
              {/* 🚨 REPLACED INLINE STYLES WITH .form-grid-3[cite: 36] */}
              <div className="form-grid-3">
                <input type="text" className="search-input w-full" placeholder="Country" value={country} onChange={e => setCountry(e.target.value)} required />
                <input type="text" className="search-input w-full" placeholder="City" value={city} onChange={e => setCity(e.target.value)} required />
                <input type="text" className="search-input w-full" placeholder="Postal Code" value={postalCode} onChange={e => setPostalCode(e.target.value.replace(/\D/g, ''))} />
              </div>
            </div>
            
            <div className="form-grid-2">
              <div>
                <label className="block mb-8 font-bold">Industry *</label>
                <input type="text" className="search-input w-full" placeholder="e.g. Technology" value={industry} onChange={e => setIndustry(e.target.value)} required />
              </div>
              <div>
                <label className="block mb-8 font-bold">Year Founded</label>
                <input type="text" className="search-input w-full" placeholder="e.g. 2020" value={founded} onChange={e => setFounded(e.target.value)} />
              </div>
            </div>

            <div>
              <label className="block mb-8 font-bold">Website</label>
              <input type="url" className="search-input w-full" placeholder="https://" value={website} onChange={e => setWebsite(e.target.value)} />
            </div>

            <div>
              <label className="block mb-8 font-bold">About the Company</label>
              <textarea className="search-input w-full" value={description} onChange={e => setDescription(e.target.value)} style={{ height: '120px', resize: 'vertical' }} placeholder="Brief description of what your company does..." />
            </div>
            
            <div className="divider p-0 m-0 mt-8">
              <button type="submit" className="btn-black w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Confirm Details'}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}