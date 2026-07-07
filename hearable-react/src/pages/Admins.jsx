import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function Admins({ role }) {
  const navigate = useNavigate();

  // --- PASSWORD MANAGEMENT STATE ---
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passMsg, setPassMsg] = useState({ type: '', text: '' });

  // --- ADMIN LIST MANAGEMENT STATE ---
  const [adminsList, setAdminsList] = useState([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const [adminMsg, setAdminMsg] = useState({ type: '', text: '' });
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(true);

  // Protect the route: ensure only admins can access this page
  useEffect(() => {
    if (role !== 'admin') { 
      navigate('/'); 
      return; 
    }
    fetchAdmins();
  }, [role, navigate]);

  // Fetch the list of all registered administrators from the database
  async function fetchAdmins() {
    setIsLoadingAdmins(true);
    const { data, error } = await supabase.from('admins').select('*').order('email', { ascending: true });
    
    if (data) setAdminsList(data);
    if (error) console.error("Error fetching admins:", error);
    
    setIsLoadingAdmins(false);
  }

  // Handles updating the currently logged-in admin's password via Supabase Auth
  async function handleUpdatePassword(e) {
    e.preventDefault();
    setPassMsg({ type: '', text: '' });

    // Validate password length and match before submitting
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

  // Grants admin privileges to a new user by adding their email to the admins table
  async function handleAddAdmin(e) {
    e.preventDefault();
    setAdminMsg({ type: '', text: '' });
    if (!newAdminEmail.trim()) return;

    setIsAddingAdmin(true);
    const { error } = await supabase.from('admins').insert([{ email: newAdminEmail.trim().toLowerCase() }]);
    setIsAddingAdmin(false);

    if (error) {
      setAdminMsg({ type: 'error', text: 'Failed to add. This email might already be an admin.' });
    } else {
      setAdminMsg({ type: 'success', text: 'Administrator added successfully!' });
      setNewAdminEmail(''); 
      fetchAdmins(); 
    }
  }

  // Revokes admin privileges from a user
  async function handleRemoveAdmin(id, email) {
    if (!window.confirm(`Are you sure you want to revoke admin privileges for ${email}?`)) return;
    
    const { error } = await supabase.from('admins').delete().eq('id', id);
    if (!error) {
      setAdminsList(adminsList.filter(a => a.id !== id));
    } else {
      alert("Failed to remove admin: " + error.message);
    }
  }

  // Helper function to render success or error messages in the UI consistently
  const renderMessage = (msgObj) => {
    if (!msgObj.text) return null;
    const isError = msgObj.type === 'error';
    return (
      <div style={{ padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem', background: isError ? '#fef2f2' : '#f0fdf4', color: isError ? '#991b1b' : '#166534', border: `1px solid ${isError ? '#fecaca' : '#bbf7d0'}` }}>
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

      {/* --- Security Section: Update Current Admin Password --- */}
      <div className="card p-32">
        <h2 style={{ margin: '0 0 8px 0' }}>Security</h2>
        <p className="text-secondary mb-24">Update the password for your current administrator account.</p>
        {renderMessage(passMsg)}
        
        <form onSubmit={handleUpdatePassword} className="flex-col gap-16" style={{ maxWidth: '400px' }}>
          <div>
            <label className="mb-8" style={{ display: 'block', fontWeight: '500' }}>New Password</label>
            <input type="password" className="search-input w-full" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} />
          </div>
          <div>
            <label className="mb-8" style={{ display: 'block', fontWeight: '500' }}>Confirm New Password</label>
            <input type="password" className="search-input w-full" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={6} />
          </div>
          <button type="submit" className="btn-black mt-8" disabled={isUpdatingPassword} style={{ width: 'fit-content' }}>
            {isUpdatingPassword ? 'Updating...' : 'Change Password'}
          </button>
        </form>
      </div>

      {/* --- Access Management Section: Add or Remove Administrators --- */}
      <div className="card p-0" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border-color)', background: 'var(--card-bg)' }}>
          <h2 style={{ margin: '0 0 8px 0' }}>Manage Access</h2>
          <p className="text-secondary m-0">Grant administrator privileges by adding user email addresses below.</p>
        </div>
        
        <div style={{ padding: '32px' }}>
          {renderMessage(adminMsg)}
          
          <form onSubmit={handleAddAdmin} className="flex-row gap-16 align-center mb-32">
            <input type="email" className="search-input flex-grow" placeholder="Enter email address" value={newAdminEmail} onChange={e => setNewAdminEmail(e.target.value)} required />
            <button type="submit" className="btn-black" disabled={isAddingAdmin} style={{ whiteSpace: 'nowrap' }}>
              {isAddingAdmin ? 'Adding...' : '+ Add Admin'}
            </button>
          </form>

          <h3 className="mb-16">Current Administrators</h3>
          <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
            {isLoadingAdmins ? (
              <p className="text-secondary text-center p-24 m-0">Loading...</p>
            ) : adminsList.length > 0 ? (
              <div className="flex-col">
                {adminsList.map((admin, index) => (
                  <div key={admin.id} className="flex-between align-center" style={{ padding: '16px 20px', borderBottom: index !== adminsList.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                    <div className="flex-row align-center gap-12">
                      <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '0.9rem', flexShrink: 0 }}>A</div>
                      <span style={{ fontWeight: '500' }}>{admin.email}</span>
                    </div>
                    {/* Protect the master admin account from being removed via the UI */}
                    {admin.email !== 'admin@hearable.com' ? (
                      <button onClick={() => handleRemoveAdmin(admin.id, admin.email)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontWeight: '500', fontSize: '0.9rem' }}>
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