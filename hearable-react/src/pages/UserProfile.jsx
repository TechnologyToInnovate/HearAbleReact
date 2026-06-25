import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import EditProfileModal from '../components/EditProfileModal';

export default function UserProfile({ role }) {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchUser();
    checkCurrentUser();
  }, [id]);

  async function checkCurrentUser() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setCurrentUserId(session.user.id);
    }
  }

  async function fetchUser() {
    setIsLoading(true);
    
    // 🚨 UPDATED QUERY: This tells Supabase to pull the joined data!
    const { data } = await supabase
      .from('profiles')
      .select(`
        *,
        degrees ( name, abbreviation ),
        batches ( batch_number )
      `)
      .eq('id', id)
      .maybeSingle();
    
    if (data) {
      setUser(data);
    }
    setIsLoading(false);
  }

  if (isLoading) {
    return (
      <div className="page-container text-center">
        <p className="text-secondary mt-32">Loading profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page-container text-center">
        <p className="text-secondary mt-32">User not found.</p>
        <button className="btn-outline mt-16" onClick={() => navigate('/')}>Go Home</button>
      </div>
    );
  }

  const isOwnProfile = currentUserId === user.id;

  return (
    <div className="page-container">
      
      <EditProfileModal 
        isOpen={showEditModal} 
        onClose={() => setShowEditModal(false)} 
        userId={user.id}
        onSuccess={fetchUser} 
      />

      <div className="card p-32 flex-col gap-32">
        
        <div className="flex-between-start">
          <div className="flex-row gap-24 align-center">
            <div className="avatar-lg" style={{ width: '80px', height: '80px', fontSize: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--primary-color)', color: 'white', borderRadius: '50%' }}>
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h1 style={{ margin: '0 0 8px 0' }}>{user.name}</h1>
              
              {user.headline && (
                <p className="text-lg" style={{ margin: '0 0 8px 0', color: 'var(--primary-color)', fontWeight: '600' }}>
                  {user.headline}
                </p>
              )}
              
              <div className="flex-row gap-16 align-center" style={{ margin: '4px 0 0 0' }}>
                <p className="text-secondary" style={{ margin: 0 }}>
                  {/* 🚨 UPDATED: Displays the joined degree name safely */}
                  🎓 {user.degrees?.name ? (user.degrees?.abbreviation ? `${user.degrees.abbreviation} - ${user.degrees.name}` : user.degrees.name) : 'Degree not specified'}
                </p>
                
                {/* 🚨 UPDATED: Displays the joined batch number */}
                {user.batches?.batch_number && (
                  <span style={{ background: '#f3f4f6', color: '#374151', padding: '2px 8px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                    Batch {user.batches.batch_number}
                  </span>
                )}
              </div>

              <div className="flex-row gap-16 mt-16" style={{ flexWrap: 'wrap' }}>
                {(user.city || user.country) && (
                  <span className="text-sm text-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    📍 {[user.city, user.country, user.postal_code].filter(Boolean).join(', ')}
                  </span>
                )}
                {user.contact_number && (
                  <span className="text-sm text-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    📞 {user.contact_number}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {isOwnProfile && (
            <button className="btn-outline" onClick={() => setShowEditModal(true)}>
              ✏️ Edit Profile
            </button>
          )}
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: 0 }} />

        <div>
          <h3 className="mb-16">Skills</h3>
          {user.skills && user.skills.length > 0 ? (
            <div className="flex-row-wrap gap-12">
              {user.skills.map((skill, index) => (
                <span key={index} className="badge-pill" style={{ padding: '8px 16px', fontSize: '0.95rem' }}>
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-secondary" style={{ margin: 0 }}>No skills added yet.</p>
          )}
        </div>

      </div>
    </div>
  );
}