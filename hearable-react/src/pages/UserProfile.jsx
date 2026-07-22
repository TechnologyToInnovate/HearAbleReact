import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

import EditProfileModal from '../components/modals/EditProfileModal';
import AddSkillModal from '../components/modals/AddSkillModal';
import SkillBadge from '../components/common/SkillBadge';
import StatusBadge from '../components/common/StatusBadge'; 
import BackButton from '../components/common/BackButton'; // 🚨 NEW
import ProfileBanner from '../components/profile/ProfileBanner'; // 🚨 NEW
import { formatFullName, formatLocation } from '../utils/formatUtils';

import JobPreferencesWidget from '../components/profile/JobPreferencesWidget';

export default function UserProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user: currentUser, role } = useAuth(); 
  
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  
  const [isUpdatingSkills, setIsUpdatingSkills] = useState(false);
  const [showAddSkillPopup, setShowAddSkillPopup] = useState(false);

  useEffect(() => {
    fetchUser();
  }, [id]);

  useEffect(() => {
    if (location.state?.openAddSkill && currentUser?.id === id) {
      setShowAddSkillPopup(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state, currentUser, id]);

  async function fetchUser() {
    setIsLoading(true);
    
    const { data } = await supabase
      .from('profiles')
      .select(`*, degrees ( name, abbreviation ), batches ( batch_number ), profile_skills ( skills ( name ) ), locations ( city, country )`)
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

  async function handleUpdateStatus(newStatus) {
    if (role !== 'admin') return;
    const updatePayload = { 
      status: newStatus,
      ...(newStatus === 'Approved' ? { approved_at: new Date().toISOString() } : {})
    };

    const { error } = await supabase.from('profiles').update(updatePayload).eq('id', user.id);

    if (!error) {
      setUser({ ...user, status: newStatus });
      if (newStatus === 'Approved') {
        await supabase.from('notifications').insert([{
          user_id: user.id, title: 'Account Approved!', 
          message: 'An administrator has approved your account.', link: '/jobs'
        }]);
      }
    } else {
      alert("Failed to update user status.");
    }
  }

  async function handleArchiveUser() {
    if (role !== 'admin') return;
    if (!window.confirm(`Are you sure you want to archive ${formatFullName(user.first_name, user.last_name)}?`)) return;

    const { error } = await supabase.from('profiles').update({ status: 'Archived' }).eq('id', user.id);

    if (!error) {
      setUser({ ...user, status: 'Archived' });
    } else {
      alert("Failed to archive user.");
    }
  }

  async function handleUnarchiveUser() {
    if (role !== 'admin') return;
    if (!window.confirm(`Are you sure you want to unarchive ${formatFullName(user.first_name, user.last_name)}? This will reset their status to Pending.`)) return;

    const { error } = await supabase.from('profiles').update({ status: 'Pending' }).eq('id', user.id);

    if (!error) {
      setUser({ ...user, status: 'Pending' });
    } else {
      alert("Failed to unarchive user.");
    }
  }

  async function handleAddSkill(skillObj) {
    if (!skillObj || !user || !currentUser) return;
    setIsUpdatingSkills(true);
    try {
      const { error: linkError } = await supabase.from('profile_skills').insert([{ profile_id: currentUser.id, skill_id: skillObj.id }]);
      if (linkError && linkError.code !== '23505') throw linkError;
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

  async function handleRemoveSkill(skillToRemove) {
    if (!user || !currentUser) return;
    setIsUpdatingSkills(true);
    try {
      const { data: skillData } = await supabase.from('skills').select('id').eq('name', skillToRemove).single();
      if (skillData) {
        await supabase.from('profile_skills').delete().match({ profile_id: currentUser.id, skill_id: skillData.id });
      }
      setUser({ ...user, skills: user.skills.filter(skill => skill !== skillToRemove) });
    } catch (error) {
      console.error("Error removing skill:", error);
    } finally {
      setIsUpdatingSkills(false);
    }
  }

  if (isLoading) return <div className="page-container-wide text-center mt-32"><p className="text-secondary">Loading profile...</p></div>;
  if (!user) return (
    <div className="page-container-wide text-center mt-32">
      <h2>Profile Not Found</h2>
      <p className="text-secondary">User not found.</p>
      <button className="btn-outline mt-16" onClick={() => navigate('/')}>Go Home</button>
    </div>
  );

  const isOwnProfile = currentUser?.id === user.id;
  const isAdmin = role === 'admin';
  const locationText = formatLocation(user.locations?.city, user.locations?.country, '');
  const fullName = formatFullName(user.first_name, user.last_name);

  return (
    <div className="page-container-wide">
      
      {/* 🚨 REFACTORED: Back Button */}
      <BackButton />

      <EditProfileModal isOpen={showEditModal} onClose={() => setShowEditModal(false)} userId={user.id} onSuccess={fetchUser} />
      <AddSkillModal isOpen={showAddSkillPopup} onClose={() => setShowAddSkillPopup(false)} onAddSkill={handleAddSkill} existingSkills={user.skills} isUpdating={isUpdatingSkills} />

      {/* 🚨 REFACTORED: Profile Banner */}
      <ProfileBanner 
        avatarSrc={user.profile_pic}
        fallbackName={user.first_name}
        avatarType="user"
        title={fullName}
        subtitle={<span className="text-primary" style={{ fontWeight: '600' }}>{user.headline || 'Talent Profile'}</span>}
        actionButton={
          isOwnProfile ? (
            <button className="btn-outline" onClick={() => setShowEditModal(true)}>Edit Profile</button>
          ) : null
        }
      />

      {isAdmin && (
        <div className="card p-16 mb-32 flex-between align-center" style={{ border: '1px solid var(--primary-color)', background: 'var(--card-bg)' }}>
          <div className="flex-row gap-12 align-center">
            <strong style={{ color: 'var(--primary-color)' }}>Admin Controls:</strong>
            <StatusBadge status={user.status} />
          </div>
          <div className="flex-row gap-8 flex-wrap">
            {user.status !== 'Approved' && <button className="btn-outline btn-sm" onClick={() => handleUpdateStatus('Approved')} style={{ borderColor: '#34d399', color: '#065f46', background: '#ecfdf5' }}>Approve</button>}
            {user.status !== 'Rejected' && <button className="btn-outline btn-sm" onClick={() => handleUpdateStatus('Rejected')} style={{ borderColor: '#f87171', color: '#991b1b', background: '#fef2f2' }}>Reject</button>}
            {user.status !== 'Archived' && <button className="btn-outline btn-sm" onClick={handleArchiveUser} style={{ borderColor: '#fde68a', color: '#b45309', background: '#fffbeb' }}>Archive</button>}
            {user.status === 'Archived' && <button className="btn-outline btn-sm" onClick={handleUnarchiveUser} style={{ borderColor: '#9ca3af', color: '#4b5563', background: '#f3f4f6' }}>Unarchive</button>}
          </div>
        </div>
      )}

      <div className="dashboard-layout">
        <div className="flex-col gap-32">
          
          <div className="card p-24">
            <div className="flex-between align-center mb-16 gap-16 flex-wrap">
              <h3 className="m-0">Skills & Expertise</h3>
              {isOwnProfile && (
                <button className="btn-outline btn-sm" onClick={() => setShowAddSkillPopup(true)} style={{ padding: '6px 12px' }}>
                  + Add Skill
                </button>
              )}
            </div>
            
            <div className="flex-row-wrap gap-12">
              {user.skills && user.skills.length > 0 ? (
                user.skills.map((skill, index) => (
                  <span key={index} className="badge badge-neutral flex-row align-center gap-8" style={{ padding: '6px 12px', fontSize: '0.95rem', display: 'inline-flex' }}>
                    {skill}
                    {isOwnProfile && (
                      <button onClick={() => handleRemoveSkill(skill)} disabled={isUpdatingSkills} style={{ background: 'none', border: 'none', color: 'var(--secondary-text)', cursor: isUpdatingSkills ? 'not-allowed' : 'pointer', padding: '0 0 0 4px', fontSize: '1.1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center' }} title="Remove skill">
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

        <div style={{ position: 'sticky', top: '90px' }}>
          
          <div className="card p-24 mb-24">
            <h3 className="mb-16 m-0">Details</h3>
            <div className="flex-col gap-16">
              
              {(isAdmin || isOwnProfile) && (
                <div style={{ paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                  <span className="text-sm text-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    Education
                    <span style={{ fontSize: '0.75rem', fontStyle: 'italic', opacity: 0.7 }}>(Not visible to companies)</span>
                  </span>
                  <strong style={{ fontSize: '1rem', display: 'block' }}>
                    {user.degrees?.name ? (user.degrees?.abbreviation ? `${user.degrees.abbreviation} - ${user.degrees.name}` : user.degrees.name) : 'Degree not specified'}
                  </strong>
                  {user.batches?.batch_number && (
                    <span className="badge badge-neutral mt-8" style={{ display: 'inline-block' }}>Batch {user.batches.batch_number}</span>
                  )}
                </div>
              )}
              
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

          <JobPreferencesWidget user={user} isOwnProfile={isOwnProfile} onUpdate={fetchUser} />

        </div>
      </div>
      
    </div>
  );
}