import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

import EditProfileModal from '../components/modals/EditProfileModal';
import AddSkillModal from '../components/modals/AddSkillModal';
import SkillBadge from '../components/common/SkillBadge';
import Avatar from '../components/common/Avatar';
import { formatFullName, formatLocation } from '../utils/formatUtils';

// External widget for displaying and managing the user's job search preferences
import JobPreferencesWidget from '../components/profile/JobPreferencesWidget';

export default function UserProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user: currentUser } = useAuth();
  
  // Core profile state
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // State for managing the user's skills and the skill-addition modal
  const [isUpdatingSkills, setIsUpdatingSkills] = useState(false);
  const [showAddSkillPopup, setShowAddSkillPopup] = useState(false);

  // Fetch the user's data whenever the profile ID in the URL changes
  useEffect(() => {
    fetchUser();
  }, [id]);

  // Handle auto-opening the add skill modal if the user was redirected here with that specific intent
  useEffect(() => {
    if (location.state?.openAddSkill && currentUser?.id === id) {
      setShowAddSkillPopup(true);
      // Clear the state so it doesn't reopen on subsequent re-renders
      window.history.replaceState({}, document.title);
    }
  }, [location.state, currentUser, id]);

  // Fetches the user's profile data along with relational data (degrees, batches, skills, and locations)
  async function fetchUser() {
    setIsLoading(true);
    
    const { data } = await supabase
      .from('profiles')
      .select(`*, degrees ( name, abbreviation ), batches ( batch_number ), profile_skills ( skills ( name ) ), locations ( city, country )`)
      .eq('id', id)
      .maybeSingle();
    
    if (data) {
      // Flatten the skills array from the many-to-many junction table to a simple array of strings
      const formattedUser = {
        ...data,
        skills: data.profile_skills ? data.profile_skills.map(ps => ps.skills.name) : []
      };
      setUser(formattedUser);
    }
    setIsLoading(false);
  }

  // Links a new skill to the user's profile via the profile_skills junction table
  async function handleAddSkill(skillObj) {
    if (!skillObj || !user || !currentUser) return;
    setIsUpdatingSkills(true);

    try {
      const { error: linkError } = await supabase
        .from('profile_skills')
        .insert([{ profile_id: currentUser.id, skill_id: skillObj.id }]);

      // Ignore uniqueness constraint errors in case the user rapidly double-clicks
      if (linkError && linkError.code !== '23505') throw linkError;

      // Optimistically update the local state to avoid a full data refetch
      if (!user.skills.includes(skillObj.name)) {
        setUser({ ...user, skills: [...user.skills, skillObj.name] });
      }
      
      setShowAddSkillPopup(false); 
      
    } catch (error) {
      console.error("Error adding skill:", error);
      alert("Failed to add skill. Please try again.");
    } finally {
      setIsUpdatingSkills(false);
    }
  }

  // Removes a skill from the user's profile by deleting the corresponding record in the junction table
  async function handleRemoveSkill(skillToRemove) {
    if (!user || !currentUser) return;
    setIsUpdatingSkills(true);

    try {
      // First, find the ID of the skill they want to remove based on its name
      const { data: skillData } = await supabase
        .from('skills')
        .select('id')
        .eq('name', skillToRemove)
        .single();

      if (skillData) {
        // Delete the relationship link
        await supabase
          .from('profile_skills')
          .delete()
          .match({ profile_id: currentUser.id, skill_id: skillData.id });
      }

      // Optimistically remove the skill from the local state
      setUser({
        ...user,
        skills: user.skills.filter(skill => skill !== skillToRemove)
      });
    } catch (error) {
      console.error("Error removing skill:", error);
    } finally {
      setIsUpdatingSkills(false);
    }
  }

  // Loading and error states
  if (isLoading) return <div className="page-container-wide text-center mt-32"><p className="text-secondary">Loading profile...</p></div>;
  if (!user) return (
    <div className="page-container-wide text-center mt-32">
      <h2>Profile Not Found</h2>
      <p className="text-secondary">User not found.</p>
      <button className="btn-outline mt-16" onClick={() => navigate('/')}>Go Home</button>
    </div>
  );

  // Determine if the current authenticated user is viewing their own profile
  const isOwnProfile = currentUser?.id === user.id;
  
  // Safely format the user's location based on the joined locations data
  const locationText = formatLocation(user.locations?.city, user.locations?.country, '');
  const fullName = formatFullName(user.first_name, user.last_name);

  return (
    <div className="page-container-wide">
      
      {/* --- MODALS --- */}
      <EditProfileModal isOpen={showEditModal} onClose={() => setShowEditModal(false)} userId={user.id} onSuccess={fetchUser} />

      <AddSkillModal 
        isOpen={showAddSkillPopup}
        onClose={() => setShowAddSkillPopup(false)}
        onAddSkill={handleAddSkill}
        existingSkills={user.skills}
        isUpdating={isUpdatingSkills}
      />

      {/* --- HERO SECTION --- */}
      <div className="card p-0 mb-32" style={{ overflow: 'hidden' }}>
        <div style={{ height: '120px', backgroundColor: 'var(--primary-color)', opacity: 0.9 }}></div>
        
        <div style={{ padding: '0 32px 32px 32px', position: 'relative' }}>
          <div className="flex-between-start" style={{ marginTop: '-40px' }}>
            
            <div className="flex-row gap-24 align-center">
              <Avatar src={user.profile_pic} fallbackName={user.first_name} size="lg" type="user" />

              <div style={{ marginTop: '40px' }}>
                <h1 style={{ margin: '0 0 8px 0', fontSize: '2rem' }}>{fullName}</h1>
                <p className="text-lg text-primary m-0" style={{ fontWeight: '600' }}>
                  {user.headline || 'Talent Profile'}
                </p>
              </div>
            </div>

            {/* Only allow editing if the user is viewing their own profile */}
            {isOwnProfile && (
              <div style={{ marginTop: '56px' }}>
                <button className="btn-outline" onClick={() => setShowEditModal(true)}>Edit Profile</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- PROFILE BODY --- */}
      <div className="dashboard-layout">
        
        {/* Main Content Column */}
        <div className="flex-col gap-32">
          
          <div className="card p-24">
            <div className="flex-between align-center mb-16 gap-16 flex-wrap">
              <h3 className="m-0">Skills & Expertise</h3>
              {isOwnProfile && (
                <button 
                  className="btn-outline btn-sm" 
                  onClick={() => setShowAddSkillPopup(true)}
                  style={{ padding: '6px 12px' }}
                >
                  + Add Skill
                </button>
              )}
            </div>
            
            <div className="flex-row-wrap gap-12">
              {user.skills && user.skills.length > 0 ? (
                user.skills.map((skill, index) => (
                  <span 
                    key={index} 
                    className="badge badge-neutral flex-row align-center gap-8"
                    style={{ padding: '6px 12px', fontSize: '0.95rem', display: 'inline-flex' }}
                  >
                    {skill}
                    {/* Render the delete (X) button if viewing their own profile */}
                    {isOwnProfile && (
                      <button 
                        onClick={() => handleRemoveSkill(skill)}
                        disabled={isUpdatingSkills}
                        style={{ 
                          background: 'none', 
                          border: 'none', 
                          color: 'var(--secondary-text)', 
                          cursor: isUpdatingSkills ? 'not-allowed' : 'pointer', 
                          padding: '0 0 0 4px',
                          fontSize: '1.1rem',
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        title="Remove skill"
                      >
                        ×
                      </button>
                    )}
                  </span>
                ))
              ) : (
                <p className="text-secondary m-0" style={{ lineHeight: '1.7' }}>No skills added yet.</p>
              )}
            </div>
          </div>
          
        </div>

        {/* Sidebar Details Column */}
        <div style={{ position: 'sticky', top: '90px' }}>
          
          <JobPreferencesWidget 
            user={user} 
            isOwnProfile={isOwnProfile} 
            onUpdate={fetchUser} 
          />

          <div className="card p-24">
            <h3 className="mb-16 m-0">Details</h3>
            <div className="flex-col gap-16">
              <div style={{ paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                <span className="text-sm text-secondary" style={{ display: 'block', marginBottom: '4px' }}>Education</span>
                <strong style={{ fontSize: '1rem', display: 'block' }}>
                  {user.degrees?.name ? (user.degrees?.abbreviation ? `${user.degrees.abbreviation} - ${user.degrees.name}` : user.degrees.name) : 'Degree not specified'}
                </strong>
                {user.batches?.batch_number && (
                  <span className="badge badge-neutral mt-8" style={{ display: 'inline-block' }}>Batch {user.batches.batch_number}</span>
                )}
              </div>
              <div style={{ paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                <span className="text-sm text-secondary" style={{ display: 'block', marginBottom: '4px' }}>Location</span>
                <strong style={{ fontSize: '1rem', display: 'block' }}>{locationText || 'Not specified'}</strong>
              </div>
              <div>
                <span className="text-sm text-secondary" style={{ display: 'block', marginBottom: '4px' }}>Contact Number</span>
                <strong style={{ fontSize: '1rem', display: 'block' }}>{user.contact_number || 'Not specified'}</strong>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}