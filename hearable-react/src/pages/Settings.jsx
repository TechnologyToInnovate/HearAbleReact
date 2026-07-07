import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; 

export default function Settings() {
  const navigate = useNavigate();
  // Access current user session, role, and logout function globally
  const { user, role, signOut } = useAuth(); 

  // State for security updates and UI theme
  const [newPassword, setNewPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  
  // Initialize dark mode state based on the presence of the class on the document body
  const [isDarkMode, setIsDarkMode] = useState(document.body.classList.contains('dark-theme'));

  // Toggles the platform theme and persists the user's preference in local storage
  const toggleDarkMode = () => {
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    
    if (nextMode) {
      document.body.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
    }
  };

  // Validates and submits a new password to Supabase Auth
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    setIsUpdatingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setIsUpdatingPassword(false);

    if (error) {
      alert(error.message);
    } else {
      alert("Success! Your password has been updated.");
      setNewPassword('');
    }
  };

  // Soft-deletes the user's account by changing their status to 'Archived' 
  // instead of permanently wiping records, maintaining database integrity.
  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm(
      "WARNING: Are you sure you want to delete your account? Your profile and data will be permanently hidden from the network."
    );
    if (!confirmDelete || !user) return;

    // Archive logic branches depending on whether the user is a company or a standard talent profile
    if (role === 'company') {
      await supabase.from('companies').update({ status: 'Archived' }).eq('id', user.id);
    } else if (['user', 'pending_user', 'rejected_user'].includes(role)) {
      await supabase.from('profiles').update({ status: 'Archived' }).eq('id', user.id);
    }

    // Terminate the active session and redirect to the landing page
    await signOut();
    navigate('/');
    alert("Your account has been deactivated and removed from the network.");
  };

  return (
    <div className="page-container" style={{ maxWidth: '700px' }}>
      <h1 className="mb-32">Account Settings</h1>

      {/* --- APPEARANCE SECTION --- */}
      <div className="card p-24 mb-24">
        <h3 className="mb-16 m-0 pb-12" style={{ borderBottom: '1px solid var(--border-color)' }}>
          Appearance
        </h3>
        <div className="flex-between align-center">
          <div>
            <strong style={{ display: 'block', fontSize: '1.05rem', marginBottom: '4px' }}>Dark Mode</strong>
            <span className="text-sm text-secondary">Switch the platform theme to darker colors.</span>
          </div>
          <button 
            onClick={toggleDarkMode} 
            className="btn-outline"
            style={{ 
              background: isDarkMode ? 'var(--text-color)' : 'var(--bg-color)', 
              color: isDarkMode ? 'var(--bg-color)' : 'var(--text-color)' 
            }}
          >
            {isDarkMode ? '🌙 Dark Mode On' : '☀️ Light Mode On'}
          </button>
        </div>
      </div>

      {/* --- SECURITY SECTION --- */}
      <div className="card p-24 mb-24">
        <h3 className="mb-16 m-0 pb-12" style={{ borderBottom: '1px solid var(--border-color)' }}>
          Security
        </h3>
        <form onSubmit={handleUpdatePassword} className="flex-col gap-16">
          <div className="flex-col gap-8">
            <label style={{ fontWeight: '600' }}>Change Password</label>
            <input 
              type="password" 
              className="search-input w-full" 
              placeholder="Enter new password" 
              value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)} 
              minLength="6"
              required 
            />
          </div>
          <button type="submit" className="btn-black" style={{ width: 'fit-content' }} disabled={isUpdatingPassword}>
            {isUpdatingPassword ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* --- DANGER ZONE --- */}
      <div className="card p-24" style={{ border: '1px solid #fecaca', background: '#fff1f2' }}>
        <h3 className="mb-16 m-0 pb-12" style={{ borderBottom: '1px solid #fecaca', color: '#dc2626' }}>
          Danger Zone
        </h3>
        <div className="flex-between align-center flex-wrap gap-16">
          <div style={{ maxWidth: '400px' }}>
            <strong style={{ display: 'block', fontSize: '1.05rem', marginBottom: '4px', color: '#dc2626' }}>Delete Account</strong>
            <span className="text-sm" style={{ color: '#991b1b' }}>
              Once you delete your account, your profile and all related data will be archived and hidden from the platform immediately.
            </span>
          </div>
          <button 
            onClick={handleDeleteAccount} 
            className="btn-danger"
            style={{ padding: '10px 20px', fontWeight: '600' }}
          >
            Delete Account
          </button>
        </div>
      </div>

    </div>
  );
}