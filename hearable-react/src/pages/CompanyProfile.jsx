import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

import EditCompanyModal from '../components/modals/EditCompanyModal';
import JobCard from '../components/jobs/JobCard';
import Avatar from '../components/common/Avatar';
import DeafAccessibleBadge from '../components/common/DeafAccessibleBadge';
import { formatLocation } from '../utils/formatUtils';
import { formatStandardDate } from '../utils/dateUtils';

export default function CompanyProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth(); 
  
  const [company, setCompany] = useState(null);
  const [companyJobs, setCompanyJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [refreshData, setRefreshData] = useState(0);

  useEffect(() => {
    async function fetchCompanyData() {
      setIsLoading(true);

      // 🚨 FIX 1: Added `locations(*)` and `company_contacts(*)` to the select query
      const { data: companyData } = await supabase
        .from('companies')
        .select('*, locations(*), company_contacts(*)')
        .eq('id', id)
        .single();
        
      if (companyData) setCompany(companyData);
      
      if (companyData) {
        const { data: jobsData } = await supabase
          .from('jobs')
          .select('*')
          .eq('company_id', id)
          .order('created_at', { ascending: false });

        if (jobsData) {
          const mappedJobs = jobsData.map(job => ({
            ...job,
            company: companyData.name,
            date: formatStandardDate(job.created_at)
          }));
          setCompanyJobs(mappedJobs);
        }
      }
      setIsLoading(false);
    }
    fetchCompanyData();
  }, [id, refreshData]); 

  if (isLoading) return <div className="page-container-wide text-center mt-32"><p className="text-secondary">Loading company profile...</p></div>;
  if (!company) return <div className="page-container-wide text-center mt-32"><h2>🏢</h2><p className="text-secondary">Company not found.</p></div>;

  const isOwnProfile = currentUser?.id === id;
  
  // 🚨 FIX 2: Safely extract location data from the joined locations table
  const loc = company.locations || {};
  const locationText = formatLocation(loc.city, loc.country, '');
  
  // 🚨 FIX 3: Safely extract contact person data from the joined company_contacts table (array)
  const contact = company.company_contacts && company.company_contacts.length > 0 ? company.company_contacts[0] : {};
  const hasContact = contact.name || contact.email || contact.contact_number;

  return (
    <div className="page-container-wide">
      {isEditing && (
        <EditCompanyModal 
          companyId={company.id}
          onClose={() => { setIsEditing(false); setRefreshData(prev => prev + 1); }} 
        />
      )}

      {/* --- HERO SECTION --- */}
      <div className="card p-0 mb-32" style={{ overflow: 'hidden' }}>
        <div style={{ height: '120px', backgroundColor: 'var(--primary-color)', opacity: 0.9 }}></div>
        
        <div style={{ padding: '0 32px 32px 32px', position: 'relative' }}>
          <div className="flex-between-start" style={{ marginTop: '-40px' }}>
            
            <div className="flex-row gap-24 align-center">
              <Avatar src={company.logo_url} fallbackName={company.name} size="lg" type="company" />

              <div style={{ marginTop: '40px' }}>
                <h1 style={{ margin: '0 0 8px 0', fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  {company.name}
                  {company.is_deaf_accessible && <DeafAccessibleBadge size="lg" showText={true} />}
                </h1>
                
                <div className="flex-row-wrap gap-16 text-secondary text-sm">
                  {/* 🚨 Removed company.address fallback since it was normalized out */}
                  {locationText && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>📍 {locationText}</span>}
                  {company.website && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      🌐 <a href={company.website} target="_blank" rel="noreferrer" className="text-primary" style={{ color: 'var(--primary-color)', fontWeight: '500' }}>
                        {company.website.replace(/^https?:\/\//, '')}
                      </a>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {isOwnProfile && (
              <div style={{ marginTop: '56px' }}>
                <button className="btn-outline" onClick={() => setIsEditing(true)}>⚙️ Edit Profile</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- PROFILE BODY --- */}
      <div className="dashboard-layout">
        <div className="flex-col gap-32">
          <div className="card p-24">
            <h3 className="mb-16 m-0">About Us</h3>
            <p className="text-secondary" style={{ lineHeight: '1.7', whiteSpace: 'pre-wrap', margin: 0 }}>
              {company.description || "This company hasn't added a description yet."}
            </p>
          </div>

          <div>
            <h3 className="mb-16 m-0">Active Job Postings</h3>
            {companyJobs.length > 0 ? (
              <div className="flex-col gap-16">
                {companyJobs.map(job => (
                  <JobCard key={job.id} job={job} isSelected={false} onClick={() => navigate('/jobs', { state: { selectedJobId: job.id } })} />
                ))}
              </div>
            ) : (
              <div className="card text-center p-32">
                <p className="text-secondary m-0">No active job postings at the moment.</p>
              </div>
            )}
          </div>
        </div>

        <div style={{ position: 'sticky', top: '90px' }}>
          <div className="card p-24">
            <h3 className="mb-16 m-0">Company Details</h3>
            <div className="flex-col gap-16">
              <div style={{ paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                <span className="text-sm text-secondary" style={{ display: 'block', marginBottom: '4px' }}>Industry</span>
                <strong style={{ fontSize: '1rem' }}>{company.industry || 'Not specified'}</strong>
              </div>
              <div style={{ paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                <span className="text-sm text-secondary" style={{ display: 'block', marginBottom: '4px' }}>Founded</span>
                <strong style={{ fontSize: '1rem' }}>{company.founded_year || 'Not specified'}</strong>
              </div>
              <div>
                <span className="text-sm text-secondary" style={{ display: 'block', marginBottom: '4px' }}>Headquarters</span>
                {/* 🚨 Removed company.address fallback */}
                <strong style={{ fontSize: '1rem' }}>{locationText || 'Not specified'}</strong>
              </div>
            </div>
          </div>

          {/* --- CONTACT PERSON CARD --- */}
          {hasContact && (
            <div className="card p-24" style={{ marginTop: '24px' }}>
              <h3 className="mb-16 m-0">Representative</h3>
              <div className="flex-row gap-16 align-center">
                {/* 🚨 Updated UI references to use the extracted 'contact' object */}
                <Avatar src={contact.profile_pic_url} fallbackName={contact.name} size="md" type="user" />
                <div style={{ overflow: 'hidden' }}>
                  <strong style={{ display: 'block', fontSize: '1.05rem', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {contact.name || 'Contact Person'}
                  </strong>
                  {contact.email && <span className="text-sm text-secondary" style={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '2px' }}>✉️ {contact.email}</span>}
                  {contact.contact_number && <span className="text-sm text-secondary" style={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>📞 {contact.contact_number}</span>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}