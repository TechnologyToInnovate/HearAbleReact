import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Admins() {
  const navigate = useNavigate();
  const { role } = useAuth(); 

  // --- PASSWORD STATE ---
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passMsg, setPassMsg] = useState({ type: '', text: '' });

  // --- ADMIN LIST STATE ---
  const [adminsList, setAdminsList] = useState([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const [adminMsg, setAdminMsg] = useState({ type: '', text: '' });
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(true);

  // --- ANNOUNCEMENT STATE ---
  const [annTitle, setAnnTitle] = useState('');
  const [annMessage, setAnnMessage] = useState('');
  const [annLink, setAnnLink] = useState('');
  const [annTarget, setAnnTarget] = useState('all');
  const [isSending, setIsSending] = useState(false);
  const [annMsg, setAnnMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    if (role !== 'admin') {
      navigate('/');
      return;
    }
    fetchAdmins();
  }, [role, navigate]);

  async function fetchAdmins() {
    setIsLoadingAdmins(true);
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .order('email', { ascending: true });
      
    if (data) setAdminsList(data);
    if (error) console.error("Error fetching admins:", error);
    setIsLoadingAdmins(false);
  }

  async function handleUpdatePassword(e) {
    e.preventDefault();
    setPassMsg({ type: '', text: '' });

    if (newPassword !== confirmPassword) {
      setPassMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    if (newPassword.length < 6) {
      setPassMsg({ type: 'error', text: 'Password must be at least 6 characters long.' });
      return;
    }

    setIsUpdatingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setIsUpdatingPassword(false);

    if (error) {
      setPassMsg({ type: 'error', text: error.message });
    } else {
      setPassMsg({ type: 'success', text: 'Password updated successfully!' });
      setNewPassword('');
      setConfirmPassword('');
    }
  }

  async function handleAddAdmin(e) {
    e.preventDefault();
    setAdminMsg({ type: '', text: '' });
    if (!newAdminEmail.trim()) return;

    setIsAddingAdmin(true);
    const { error } = await supabase
      .from('admins')
      .insert([{ email: newAdminEmail.trim().toLowerCase() }]);
    
    setIsAddingAdmin(false);

    if (error) {
      setAdminMsg({ type: 'error', text: 'Failed to add. This email might already be an admin.' });
    } else {
      setAdminMsg({ type: 'success', text: 'Administrator added successfully!' });
      setNewAdminEmail('');
      fetchAdmins(); 
    }
  }

  async function handleRemoveAdmin(id, email) {
    if (!window.confirm(`Are you sure you want to revoke admin privileges for ${email}?`)) return;

    const { error } = await supabase.from('admins').delete().eq('id', id);
    if (!error) {
      setAdminsList(adminsList.filter(a => a.id !== id));
    } else {
      alert("Failed to remove admin: " + error.message);
    }
  }

  // 🚨 NEW: Function to trigger the Supabase broadcast logic
  async function handleSendAnnouncement(e) {
    e.preventDefault();
    if (!window.confirm(`Are you sure you want to send this announcement to ${annTarget === 'all' ? 'everyone' : annTarget}?`)) return;
    
    setIsSending(true);
    setAnnMsg({ type: '', text: '' });

    const { error } = await supabase.rpc('admin_create_announcement', {
      announcement_title: annTitle.trim(),
      announcement_message: annMessage.trim(),
      announcement_link: annLink.trim() || null,
      target_audience: annTarget
    });

    setIsSending(false);

    if (error) {
      setAnnMsg({ type: 'error', text: 'Failed to broadcast announcement: ' + error.message });
    } else {
      setAnnMsg({ type: 'success', text: 'Announcement successfully broadcasted! 🚀' });
      setAnnTitle('');
      setAnnMessage('');
      setAnnLink('');
      setAnnTarget('all');
    }
  }

  const renderMessage = (msgObj) => {
    if (!msgObj.text) return null;
    const isError = msgObj.type === 'error';
    return (
      <div style={{ 
        padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem',
        background: isError ? '#fef2f2' : '#f0fdf4', 
        color: isError ? '#991b1b' : '#166534', 
        border: `1px solid ${isError ? '#fecaca' : '#bbf7d0'}` 
      }}>
        {msgObj.text}
      </div>
    );
  };

  return (
    <div className="page-container" style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      <div className="flex-between">
        <h1 style={{ margin: 0 }}>System Administrators</h1>
        <button className="btn-outline btn-sm" onClick={() => navigate('/')}>← Back to Home</button>
      </div>

      {/* 🚨 NEW: BROADCAST ANNOUNCEMENTS SECTION */}
      <div className="card p-0" style={{ overflow: 'hidden', border: '1px solid var(--primary-color)' }}>
        <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border-color)', background: '#f8fafc' }}>
          <h2 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📢</span> Send Global Announcement
          </h2>
          <p className="text-secondary m-0">Push an alert directly to the notification inbox of specific user groups.</p>
        </div>

        <div style={{ padding: '32px' }}>
          {renderMessage(annMsg)}
          
          <form onSubmit={handleSendAnnouncement} className="flex-col gap-16">
            <div className="form-grid-2">
              <div>
                <label>Announcement Title *</label>
                <input 
                  type="text" 
                  className="search-input w-full" 
                  placeholder="e.g. Platform Update, New Features..." 
                  value={annTitle} 
                  onChange={e => setAnnTitle(e.target.value)} 
                  required
                />
              </div>
              <div>
                <label>Target Audience *</label>
                <select className="search-input w-full" value={annTarget} onChange={e => setAnnTarget(e.target.value)}>
                  <option value="all">Everyone (All Accounts)</option>
                  <option value="applicants">Applicants Only</option>
                  <option value="companies">Companies Only</option>
                </select>
              </div>
            </div>

            <div>
              <label>Message *</label>
              <textarea 
                className="search-input w-full" 
                placeholder="What do you want to tell them?" 
                value={annMessage} 
                onChange={e => setAnnMessage(e.target.value)} 
                style={{ height: '100px', resize: 'vertical' }}
                required
              />
            </div>

            <div>
              <label>Link (Optional)</label>
              <input 
                type="text" 
                className="search-input w-full" 
                placeholder="e.g. /jobs, /settings, or https://..." 
                value={annLink} 
                onChange={e => setAnnLink(e.target.value)} 
              />
              <span className="text-sm text-secondary block mt-4">If provided, users will be redirected here when they click the notification.</span>
            </div>
            
            <div className="mt-8">
              <button type="submit" className="btn-black" disabled={isSending}>
                {isSending ? 'Broadcasting...' : '🚀 Send Announcement'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* SECTION: CHANGE PASSWORD */}
      <div className="card p-32">
        <h2 style={{ margin: '0 0 8px 0' }}>Security</h2>
        <p className="text-secondary mb-24">Update the password for your current administrator account.</p>
        
        {renderMessage(passMsg)}

        <form onSubmit={handleUpdatePassword} className="flex-col gap-16" style={{ maxWidth: '400px' }}>
          <div>
            <label className="mb-8" style={{ display: 'block', fontWeight: '500' }}>New Password</label>
            <input 
              type="password" 
              className="search-input w-full" 
              value={newPassword} 
              onChange={e => setNewPassword(e.target.value)} 
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="mb-8" style={{ display: 'block', fontWeight: '500' }}>Confirm New Password</label>
            <input 
              type="password" 
              className="search-input w-full" 
              value={confirmPassword} 
              onChange={e => setConfirmPassword(e.target.value)} 
              required
              minLength={6}
            />
          </div>
          
          <button type="submit" className="btn-black mt-8" disabled={isUpdatingPassword} style={{ width: 'fit-content' }}>
            {isUpdatingPassword ? 'Updating...' : 'Change Password'}
          </button>
        </form>
      </div>

      {/* SECTION: MANAGE ADMINS */}
      <div className="card p-0" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border-color)', background: 'var(--card-bg)' }}>
          <h2 style={{ margin: '0 0 8px 0' }}>Manage Access</h2>
          <p className="text-secondary m-0">Grant administrator privileges by adding user email addresses below.</p>
        </div>

        <div style={{ padding: '32px' }}>
          {renderMessage(adminMsg)}
          
          <form onSubmit={handleAddAdmin} className="flex-row gap-16 align-center mb-32">
            <input 
              type="email" 
              className="search-input flex-grow" 
              placeholder="Enter email address (e.g., staff@hearable.com)" 
              value={newAdminEmail} 
              onChange={e => setNewAdminEmail(e.target.value)} 
              required
            />
            <button type="submit" className="btn-black" disabled={isAddingAdmin} style={{ whiteSpace: 'nowrap' }}>
              {isAddingAdmin ? 'Adding...' : '+ Add Admin'}
            </button>
          </form>

          <h3 className="mb-16">Current Administrators</h3>
          <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
            {isLoadingAdmins ? (
              <p className="text-secondary text-center p-24 m-0">Loading administrators...</p>
            ) : adminsList.length > 0 ? (
              <div className="flex-col">
                {adminsList.map((admin, index) => (
                  <div key={admin.id} className="flex-between align-center" style={{ padding: '16px 20px', borderBottom: index !== adminsList.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                    <div className="flex-row align-center gap-12">
                      <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '0.9rem', flexShrink: 0 }}>A</div>
                      <span style={{ fontWeight: '500' }}>{admin.email}</span>
                    </div>
                    
                    {admin.email !== 'admin@hearable.com' ? (
                      <button 
                        onClick={() => handleRemoveAdmin(admin.id, admin.email)}
                        style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontWeight: '500', fontSize: '0.9rem' }}
                      >
                        Revoke Access
                      </button>
                    ) : (
                      <span className="text-secondary text-sm" style={{ fontStyle: 'italic' }}>Master Admin</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-secondary text-center p-24 m-0">No other administrators found.</p>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}