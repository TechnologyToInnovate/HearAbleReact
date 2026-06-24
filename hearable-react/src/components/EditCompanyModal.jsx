import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function EditCompanyModal({ onClose, companyId }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Company Form State
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [industry, setIndustry] = useState('');
  const [founded, setFounded] = useState('');
  const [website, setWebsite] = useState('');

  useEffect(() => {
    async function fetchCompany() {
      setIsLoading(true);
      const { data } = await supabase.from('companies').select('*').eq('id', companyId).single();
      
      if (data) {
        setName(data.name || '');
        setAddress(data.address || '');
        setDescription(data.description || '');
        setIndustry(data.industry || '');
        setFounded(data.founded || '');
        setWebsite(data.website || '');
      }
      setIsLoading(false);
    }
    
    if (companyId) fetchCompany();
  }, [companyId]);

  async function handleSave(e) {
    e.preventDefault();
    setIsSaving(true);
    
    const updates = { 
      name, 
      address, 
      description, 
      industry, 
      founded, 
      website 
    };

    const { error } = await supabase.from('companies').update(updates).eq('id', companyId);

    setIsSaving(false);

    if (!error) {
      if (onClose) onClose();
    } else {
      alert('Error saving company profile. Check console.');
      console.error(error);
    }
  }

  return (
    <div style={{ 
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', 
      zIndex: 9999, padding: '20px' 
    }}>
      <div className="card p-0" style={{ 
        width: '100%', maxWidth: '800px', maxHeight: '90vh', 
        display: 'flex', flexDirection: 'column',
        background: 'var(--bg-color)', 
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden' 
      }}>
        
        {/* Sticky Header */}
        <div className="flex-between" style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', background: 'var(--card-bg)' }}>
          <h2 style={{ margin: 0 }}>Edit Company Profile</h2>
          <button 
            onClick={onClose} 
            style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-color)' }}
          >
            ✕
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div style={{ padding: '24px', overflowY: 'auto' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--secondary-text)' }}>Loading settings...</div>
          ) : (
            <form onSubmit={handleSave} className="flex-col gap-20">
              
              <div className="form-grid-2">
                <div><label>Company Name *</label><input type="text" className="search-input" value={name} onChange={(e) => setName(e.target.value)} required /></div>
                <div><label>Location / HQ *</label><input type="text" className="search-input" value={address} onChange={(e) => setAddress(e.target.value)} required /></div>
              </div>

              <div>
                <label>Company Overview / Description</label>
                <textarea className="search-input" style={{ height: '120px', resize: 'vertical' }} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does your company do?" />
              </div>

              <div className="form-grid-3">
                <div><label>Industry</label><input type="text" className="search-input" value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g. Technology" /></div>
                <div><label>Year Founded</label><input type="text" className="search-input" value={founded} onChange={(e) => setFounded(e.target.value)} placeholder="e.g. 2015" /></div>
                <div><label>Website URL</label><input type="url" className="search-input" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" /></div>
              </div>

              <div style={{ marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
                <button type="submit" className="btn-black w-full" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Company Details'}
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}