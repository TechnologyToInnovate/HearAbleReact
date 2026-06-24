import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import ProfileHeader from '../components/ProfileHeader';

// Import our new Modal
import EditCompanyModal from '../components/EditCompanyModal';

export default function CompanyProfile({ role }) {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [company, setCompany] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal control & user verification
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [refreshData, setRefreshData] = useState(0);

  useEffect(() => {
    async function fetchCompany() {
      setIsLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setCurrentUserId(session.user.id);
      }

      const { data } = await supabase.from('companies').select('*').eq('id', id).single();
      if (data) setCompany(data);
      
      setIsLoading(false);
    }
    fetchCompany();
  }, [id, refreshData]); // Refreshes when modal closes

  if (isLoading) return <p className="text-center p-20">Loading...</p>;
  if (!company) return <p className="text-center p-20">Company not found.</p>;

  const isOwnProfile = currentUserId === id;

  return (
    <div className="page-container">

      {/* RENDER THE EDIT MODAL OVERLAY */}
      {isEditing && (
        <EditCompanyModal 
          companyId={company.id}
          onClose={() => {
            setIsEditing(false);
            setRefreshData(prev => prev + 1);
          }} 
        />
      )}

      <div className="card p-20">
        
        <div className="flex-between-start">
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

          {isOwnProfile && (
            <button className="btn-outline" onClick={() => setIsEditing(true)}>
              ⚙️ Edit Profile
            </button>
          )}
        </div>

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