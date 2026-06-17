import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

// Import our shared components
import ProfileHeader from '../components/ProfileHeader';
import TagList from '../components/TagList';

export default function UserProfile({ role }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      setIsLoading(true);
      const { data } = await supabase.from('profiles').select('*').eq('id', id).single();
      if (data) setProfile(data);
      setIsLoading(false);
    }
    fetchProfile();
  }, [id]);

  if (isLoading) return <p className="text-center p-20">Loading profile...</p>;
  if (!profile) return <p className="text-center p-20">Profile not found.</p>;

  return (
    <div className="page-container">
      
      <button onClick={() => navigate(-1)} className="mb-24" style={{ background: 'none', border: 'none', color: 'var(--secondary-text)', cursor: 'pointer' }}>
        ← Back
      </button>

      <div className="card p-20">
        
        {/* Using the same ProfileHeader as CompanyProfile */}
        <ProfileHeader name={profile.name} type="user">
          {profile.major && <span>💼 {profile.major}</span>}
          {profile.university && <span>🎓 {profile.university}</span>}
        </ProfileHeader>
        
        <div className="profile-split-layout">
          <div>
            <h3 className="mb-16">About Me</h3>
            <p className="text-secondary" style={{ lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
              {profile.bio || "This user hasn't added a bio yet."}
            </p>
          </div>

          <div className="flex-col-lg">
            {/* Using our reusable TagList component */}
            <div className="card p-20" style={{ background: 'var(--bg-color)' }}>
              <h4 className="mb-16">🛠 Skills</h4>
              <TagList tags={profile.skills} emptyMessage="No skills listed." />
            </div>

            {profile.certifications && profile.certifications.length > 0 && (
              <div className="card p-20" style={{ background: 'var(--bg-color)' }}>
                <h4 className="mb-16">📜 Certifications</h4>
                <TagList tags={profile.certifications} emptyMessage="No certifications listed." />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}