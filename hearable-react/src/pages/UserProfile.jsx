import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import EditProfileModal from '../components/EditProfileModal';
import { useAuth } from '../context/AuthContext';
import SkillBadge from '../components/SkillBadge'; // 🚨 IMPORT ADDED

export default function UserProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const { user: currentUser } = useAuth();
  
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchUser();
  }, [id]);

  async function fetchUser() {
    setIsLoading(true);
    
    const { data } = await supabase
      .from('profiles')
      .select(`
        *,
        degrees ( name, abbreviation ),
        batches ( batch_number ),
        profile_skills (
          skills ( name )
        )
      `)
      .eq('id', id)
      .maybeSingle();
    
    if (data) {
      const formattedUser = {
        ...data,
        skills: data.profile_skills ? data.profile_skills.map(ps => ps.skills.name) : []
      };
      setUser(formattedUser);
    }
    setIsLoading(false);
  }

  if (isLoading) {
    return <div className="page-container-wide text-center mt-32"><p className="text-secondary">Loading profile...</p></div>;
  }

  if (!user) {
    return (
      <div className="page-container-wide text-center mt-32">
        <h2>👤</h2>
        <p className="text-secondary">User not found.</p>
        <button className="btn-outline mt-16" onClick={() => navigate('/')}>Go Home</button>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === user.id;
  const locationText = [user.city, user.country].filter(Boolean).join(', ');
  
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Incomplete Profile';
  const avatarInitial = user.first_name ? user.first_name.charAt(0).toUpperCase() : 'U';

  return (
    <div className="page-container-wide">
      
      <EditProfileModal 
        isOpen={showEditModal} 
        onClose={() => setShowEditModal(false)} 
        userId={user.id}
        onSuccess={fetchUser} 
      />

      <div className="card p-0 mb-32" style={{ overflow: 'hidden' }}>
        <div style={{ height: '120px', backgroundColor: 'var(--primary-color)', opacity: 0.9 }}></div>
        
        <div style={{ padding: '0 32px 32px 32px', position: 'relative' }}>
          <div className="flex-between-start" style={{ marginTop: '-40px' }}>
            
            <div className="flex-row gap-24 align-center">
              <div className="avatar-lg" style={{ width: '100px', height: '100px', border: '4px solid var(--card-bg)', borderRadius: '50%', background: 'var(--primary-color)', color: 'white', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3.5rem', flexShrink: 0 }}>
                {avatarInitial}
              </div>

              <div style={{ marginTop: '40px' }}>
                <h1 style={{ margin: '0 0 8px 0', fontSize: '2rem' }}>{fullName}</h1>
                <p className="text-lg text-primary m-0" style={{ fontWeight: '600' }}>
                  {user.headline || 'Talent Profile'}
                </p>
              </div>
            </div>

            {isOwnProfile && (
              <div style={{ marginTop: '56px' }}>
                <button className="btn-outline" onClick={() => setShowEditModal(true)}>
                  Edit Profile
                </button>
              </div>
            )}

          </div>
        </div>
      </div>

      <div className="dashboard-layout">
        <div className="flex-col gap-32">
          <div className="card p-24">
            <h3 className="mb-16 m-0">Skills & Expertise</h3>
            {user.skills && user.skills.length > 0 ? (
              <div className="flex-row-wrap gap-12">
                {user.skills.map((skill, index) => (
                  // 🚨 INTEGRATION: Using SkillBadge instead of a hardcoded span
                  <SkillBadge key={index} skill={skill} />
                ))}
              </div>
            ) : (
              <p className="text-secondary m-0" style={{ lineHeight: '1.7' }}>
                No skills added yet.
              </p>
            )}
          </div>
        </div>

        <div style={{ position: 'sticky', top: '90px' }}>
          <div className="card p-24">
            <h3 className="mb-16 m-0">Details</h3>
            <div className="flex-col gap-16">
              
              <div style={{ paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                <span className="text-sm text-secondary" style={{ display: 'block', marginBottom: '4px' }}>Education</span>
                <strong style={{ fontSize: '1rem', display: 'block' }}>
                  {user.degrees?.name ? (user.degrees?.abbreviation ? `${user.degrees.abbreviation} - ${user.degrees.name}` : user.degrees.name) : 'Degree not specified'}
                </strong>
                {user.batches?.batch_number && (
                  <span className="badge badge-neutral mt-8" style={{ display: 'inline-block' }}>
                    Batch {user.batches.batch_number}
                  </span>
                )}
              </div>

              <div style={{ paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                <span className="text-sm text-secondary" style={{ display: 'block', marginBottom: '4px' }}>Location</span>
                <strong style={{ fontSize: '1rem', display: 'block' }}>
                  {locationText || 'Not specified'}
                </strong>
              </div>

              <div>
                <span className="text-sm text-secondary" style={{ display: 'block', marginBottom: '4px' }}>Contact Number</span>
                <strong style={{ fontSize: '1rem', display: 'block' }}>
                  {user.contact_number || 'Not specified'}
                </strong>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}