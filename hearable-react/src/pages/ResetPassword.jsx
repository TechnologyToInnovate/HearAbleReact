import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [message, setMessage] = useState('');

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }

    setIsUpdatingPassword(true);
    setMessage('');
    
    // Updates the password for the currently authenticated user session
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    
    setIsUpdatingPassword(false);

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      alert("Success! Your password has been updated.");
      // Redirect the user to the home page or login after success
      navigate('/'); 
    }
  };

  return (
    <div className="page-container flex-col align-center" style={{ justifyContent: 'center', minHeight: '80vh' }}>
      <div className="card p-32 w-full" style={{ maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
        <h2 className="mb-8 text-center m-0">Reset Your Password</h2>
        <p className="text-secondary text-sm text-center mb-24 m-0">
          Please enter your new secure password below.
        </p>

        {message && (
          <div className="mb-16 p-12" style={{ background: message.includes('Error') ? '#fef2f2' : '#f0fdf4', color: message.includes('Error') ? '#dc2626' : '#166534', borderRadius: '8px', fontSize: '0.85rem', border: `1px solid ${message.includes('Error') ? '#fecaca' : '#bbf7d0'}` }}>
            {message}
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="flex-col gap-16">
          <div>
            <label className="block mb-8 text-sm font-bold">New Password</label>
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
          <button type="submit" className="btn-black w-full mt-8" disabled={isUpdatingPassword} style={{ padding: '12px' }}>
            {isUpdatingPassword ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}