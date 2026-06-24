import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import ProfileHeader from '../components/ProfileHeader';

// NEW: Import the Profile form so we can render it as a popup
import Profile from './Profile'; 

export default function UserProfile({ role }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Modal control & data refresh trigger
  const [isEditing, setIsEditing] = useState(false);
  const [refreshData, setRefreshData] = useState(0);

  useEffect(() => {
    async function fetchProfileData() {
      setIsLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setCurrentUserId(session.user.id);
      }

      const { data } = await supabase.from('profiles').select('*').eq('id', id).single();
      if (data) setProfile(data);
      
      setIsLoading(false);
    }
    fetchProfileData();
  }, [id, refreshData]); // <-- Refreshes whenever `refreshData` changes

  if (isLoading) return <p className="text-center p-20">Loading profile...</p>;
  if (!profile) return <div className="page-container-wide"><p className="text-center p-20">Profile not found.</p></div>;

  const isOwnProfile = currentUserId === id;

  return (
    <div className="page-container-wide">

      {/* RENDER THE EDIT MODAL OVERLAY */}
      {isEditing && (
        <Profile 
          onClose={() => {
            setIsEditing(false);
            setRefreshData(prev => prev + 1); // Refresh the profile data automatically!
          }} 
        />
      )}

      {/* TOP SECTION: Header & Bio */}
      <div className="card p-20 mb-24">
        <div className="flex-between-start">
          <ProfileHeader name={profile.name} type="user">
            {profile.major && <span>💼 {profile.major}</span>}
          </ProfileHeader>

          {isOwnProfile && (
            <button className="btn-outline" onClick={() => setIsEditing(true)}>
              ⚙️ Edit Profile
            </button>
          )}
        </div>
        
        <div className="mt-24" style={{ paddingTop: '24px', borderTop: '1px solid var(--border-color)' }}>
          <h2 className="mb-16" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Headline</h2>
          <p className="text-secondary" style={{ lineHeight: '1.7', whiteSpace: 'pre-wrap', margin: 0, fontSize: '1.05rem' }}>
            {profile.bio || "This user hasn't added a headline yet."}
          </p>
        </div>
      </div>

      {/* BOTTOM SECTION: Stacking Cards */}
      <div className="flex-col" style={{ gap: '24px' }}>
        
        <div className="card p-20">
          <h2 className="mb-16" style={{ margin: '0 0 16px 0', fontSize: '1.5rem', fontWeight: 'bold' }}>🎓 Education</h2>
          <div className="flex-col" style={{ gap: '12px' }}>
            {profile.education && profile.education.length > 0 ? (
              profile.education.map((ed, idx) => (
                <div key={idx} style={{ padding: '16px', background: 'var(--bg-color)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <p style={{ margin: '0 0 4px 0', fontWeight: '600', fontSize: '1.05rem' }}>{ed.name}</p>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--secondary-text)' }}>📍 {ed.location}</p>
                </div>
              ))
            ) : (
              <p className="text-secondary">No education listed.</p>
            )}
          </div>
        </div>

        <div className="card p-20">
          <h2 className="mb-16" style={{ margin: '0 0 16px 0', fontSize: '1.5rem', fontWeight: 'bold' }}>🛠 Skills</h2>
          <div className="flex-row-wrap gap-8">
            {profile.skills && profile.skills.length > 0 ? (
              profile.skills.map((skill, idx) => (
                skill.link ? (
                  <a key={idx} href={skill.link} target="_blank" rel="noreferrer" className="tag bg-white border" style={{ textDecoration: 'none', color: 'var(--primary-color)' }}>
                    {skill.name} 🔗
                  </a>
                ) : (
                  <span key={idx} className="tag bg-white border">{skill.name}</span>
                )
              ))
            ) : (
              <p className="text-secondary">No skills listed.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}