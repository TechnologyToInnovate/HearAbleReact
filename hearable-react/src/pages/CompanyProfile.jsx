import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

// Import our new component!
import ProfileHeader from '../components/ProfileHeader';

export default function CompanyProfile({ role }) {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [company, setCompany] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchCompany() {
      setIsLoading(true);
      const { data } = await supabase.from('companies').select('*').eq('id', id).single();
      if (data) setCompany(data);
      setIsLoading(false);
    }
    fetchCompany();
  }, [id]);

  if (isLoading) return <p className="text-center p-20">Loading...</p>;
  if (!company) return <p className="text-center p-20">Company not found.</p>;

  return (
    <div className="page-container">
      
      {/* Back button */}
      <button onClick={() => navigate(-1)} className="mb-24" style={{ background: 'none', border: 'none', color: 'var(--secondary-text)', cursor: 'pointer' }}>
        ← Back
      </button>

      <div className="card p-20">
        {/* REFACTORED: The messy header is now just this one component */}
        <ProfileHeader name={company.name} type="company">
          {company.address && <span>📍 {company.address}</span>}
          {company.website && (
            <span>
              🌐 <a href={company.website} target="_blank" rel="noreferrer" className="text-primary">
                {company.website.replace(/^https?:\/\//, '')}
              </a>
            </span>
          )}
        </ProfileHeader>

        <div className="profile-split-layout">
          <div>
            <h3 className="mb-16">About {company.name}</h3>
            <p className="text-secondary" style={{ lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
              {company.description || "No description provided."}
            </p>
          </div>

          <div>
            <div className="card p-20" style={{ background: 'var(--bg-color)', border: '1px solid var(--border-color)' }}>
              <h4 className="mb-16">Company Details</h4>
              <div className="flex-col" style={{ gap: '12px' }}>
                <p className="text-sm"><strong>Industry:</strong> {company.industry || 'N/A'}</p>
                <p className="text-sm"><strong>Founded:</strong> {company.founded || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}