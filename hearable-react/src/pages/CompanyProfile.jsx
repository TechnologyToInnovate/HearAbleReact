import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import EditCompanyModal from '../components/EditCompanyModal';
import JobCard from '../components/JobCard';
import { useAuth } from '../context/AuthContext'; // 🚨 Global Auth

export default function CompanyProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // 🚨 Replaced manual checkCurrentUser with instant context user
  const { user: currentUser } = useAuth(); 
  
  const [company, setCompany] = useState(null);
  const [companyJobs, setCompanyJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isEditing, setIsEditing] = useState(false);
  const [refreshData, setRefreshData] = useState(0);

  useEffect(() => {
    async function fetchCompanyData() {
      setIsLoading(true);

      const { data: companyData } = await supabase.from('companies').select('*').eq('id', id).single();
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
            date: new Date(job.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
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
  const locationText = [company.city, company.country].filter(Boolean).join(', ');

  return (
    <div className="page-container-wide">

      {isEditing && (
        <EditCompanyModal 
          companyId={company.id}
          onClose={() => {
            setIsEditing(false);
            setRefreshData(prev => prev + 1);
          }} 
        />
      )}

      {/* --- HERO SECTION --- */}
      <div className="card p-0 mb-32" style={{ overflow: 'hidden' }}>
        <div style={{ height: '120px', backgroundColor: 'var(--primary-color)', opacity: 0.9 }}></div>
        
        <div style={{ padding: '0 32px 32px 32px', position: 'relative' }}>
          <div className="flex-between-start" style={{ marginTop: '-40px' }}>
            
            <div className="flex-row gap-24 align-center">
              {/* Restored exact original layout for the avatar to prevent clipping issues */}
              <div className="avatar-lg" style={{ width: '100px', height: '100px', border: '4px solid var(--card-bg)', borderRadius: '16px', background: 'var(--bg-color)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {company.logo_url ? (
                  <img src={company.logo_url} alt={`${company.name} logo`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <img src="https://placehold.co/200x200/e5e7eb/6b7280?text=🏢" alt="Default Company" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
              </div>

              <div style={{ marginTop: '40px' }}>
                <h1 style={{ margin: '0 0 8px 0', fontSize: '2rem' }}>{company.name}</h1>
                <div className="flex-row-wrap gap-16 text-secondary text-sm">
                  {(locationText || company.address) && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>📍 {locationText || company.address}</span>}
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
                <button className="btn-outline" onClick={() => setIsEditing(true)}>
                  ⚙️ Edit Profile
                </button>
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
                  <JobCard 
                    key={job.id} 
                    job={job} 
                    isSelected={false} 
                    onClick={() => navigate('/jobs', { state: { selectedJobId: job.id } })} 
                  />
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
              {/* Restored proper block styling so titles and data don't collapse together */}
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
                <strong style={{ fontSize: '1rem' }}>{locationText || company.address || 'Not specified'}</strong>
              </div>
            </div>
          </div>

          {/* --- CONTACT PERSON CARD --- */}
          {(company.contact_person_name || company.contact_person_email || company.contact_person_number) && (
            <div className="card p-24" style={{ marginTop: '24px' }}>
              <h3 className="mb-16 m-0">Representative</h3>
              <div className="flex-row gap-16 align-center">
                {/* Restored the specific 56px sizing for this card */}
                <div className="avatar" style={{ width: '56px', height: '56px', border: '1px solid var(--border-color)', borderRadius: '50%', background: 'var(--primary-color)', color: 'white', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {company.contact_person_pic ? (
                    <img src={company.contact_person_pic} alt={company.contact_person_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                      {company.contact_person_name ? company.contact_person_name.charAt(0).toUpperCase() : '👤'}
                    </span>
                  )}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <strong style={{ display: 'block', fontSize: '1.05rem', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {company.contact_person_name || 'Contact Person'}
                  </strong>
                  {company.contact_person_email && (
                    <span className="text-sm text-secondary" style={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '2px' }}>
                      ✉️ {company.contact_person_email}
                    </span>
                  )}
                  {company.contact_person_number && (
                    <span className="text-sm text-secondary" style={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      📞 {company.contact_person_number}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}