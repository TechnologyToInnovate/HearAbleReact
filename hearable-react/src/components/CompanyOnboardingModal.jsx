import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function CompanyOnboardingModal({ isOpen, companyData, onSuccess }) {
  const [name, setName] = useState('');
  
  // 🚨 LOCATION UPDATE: Split into 3 fields instead of 'address'
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
      
      // 🚨 Pulling the split location data passed from the pre-approval roster
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

    // 🚨 Push the 3 new location fields to the database
    const { error } = await supabase.from('companies').update({
      name, 
      country,
      city,
      postal_code: postalCode,
      industry, 
      website, 
      description, 
      founded_year: isNaN(parsedYear) ? null : parsedYear
    }).eq('id', companyData.id);

    setIsSubmitting(false);
    
    if (!error) {
      onSuccess();
    } else {
      alert("Failed to update company profile.");
      console.error(error);
    }
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
      <div className="card p-0" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-color)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden' }}>
        
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', background: 'var(--card-bg)' }}>
          <h2 style={{ margin: 0 }}>Verify Company Profile</h2>
          <p className="text-secondary text-sm" style={{ margin: '8px 0 0 0' }}>Please review the details provided by the administrator and complete your profile to continue.</p>
        </div>
        
        <div style={{ padding: '24px', overflowY: 'auto' }}>
          <form onSubmit={handleSubmit} className="flex-col gap-20">
            <div>
              <label>Company Name *</label>
              <input type="text" className="search-input w-full" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            
            {/* 🚨 LOCATION UPDATE: 3-Grid layout to match the Admin panel */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px' }}>Headquarters / Location *</label>
              <div className="form-grid-3">
                <div>
                  <input type="text" className="search-input w-full" placeholder="Country" value={country} onChange={e => setCountry(e.target.value)} required />
                </div>
                <div>
                  <input type="text" className="search-input w-full" placeholder="City" value={city} onChange={e => setCity(e.target.value)} required />
                </div>
                <div>
                  <input type="text" className="search-input w-full" placeholder="Postal Code" value={postalCode} onChange={e => setPostalCode(e.target.value.replace(/\D/g, ''))} />
                </div>
              </div>
            </div>
            
            <div className="form-grid-2">
              <div>
                <label>Industry *</label>
                <input type="text" className="search-input w-full" placeholder="e.g. Technology" value={industry} onChange={e => setIndustry(e.target.value)} required />
              </div>
              <div>
                <label>Year Founded</label>
                <input type="text" className="search-input w-full" placeholder="e.g. 2020" value={founded} onChange={e => setFounded(e.target.value)} />
              </div>
            </div>

            <div>
              <label>Website</label>
              <input type="url" className="search-input w-full" placeholder="https://" value={website} onChange={e => setWebsite(e.target.value)} />
            </div>

            <div>
              <label>About the Company</label>
              <textarea className="search-input w-full" value={description} onChange={e => setDescription(e.target.value)} style={{ height: '120px', resize: 'vertical' }} placeholder="Brief description of what your company does..." />
            </div>
            
            <div style={{ marginTop: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
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