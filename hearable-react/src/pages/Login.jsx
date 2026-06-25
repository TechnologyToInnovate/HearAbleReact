import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Check for a remembered email when the page loads
  useEffect(() => {
    const savedEmail = localStorage.getItem('hearable_remembered_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    if (isLogin) {
      // --- SIGN IN ---
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        // 2. Save or clear the email based on the checkbox
        if (rememberMe) {
          localStorage.setItem('hearable_remembered_email', email.trim());
        } else {
          localStorage.removeItem('hearable_remembered_email');
        }
        navigate('/');
      }
    } else {
      // --- SIGN UP ---
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        if (rememberMe) {
          localStorage.setItem('hearable_remembered_email', email.trim());
        }
        alert("Success! Your account has been created. You can now log in.");
        setIsLogin(true); // Switch back to login view
        setPassword('');
      }
    }
    
    setIsLoading(false);
  };

  return (
    <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <div className="card p-32" style={{ width: '100%', maxWidth: '450px' }}>
        
        <div className="text-center mb-32">
          <div className="brand-logo mx-auto mb-16" style={{ margin: '0 auto 16px auto', width: '48px', height: '48px', fontSize: '1.5rem' }}>H</div>
          <h1 style={{ margin: 0 }}>{isLogin ? 'Welcome Back' : 'Create an Account'}</h1>
          <p className="text-secondary mt-8">{isLogin ? 'Sign in to your Hearable account' : 'Join the Hearable platform'}</p>
        </div>

        {errorMsg && (
          <div style={{ background: '#fef2f2', color: '#991b1b', padding: '12px', borderRadius: '8px', marginBottom: '24px', fontSize: '0.9rem', border: '1px solid #fecaca' }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-col gap-20">
          <div>
            <label className="mb-8" style={{ display: 'block', fontWeight: '500' }}>Email Address</label>
            <input 
              type="email" 
              className="search-input w-full" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>

          <div>
            <label className="mb-8" style={{ display: 'block', fontWeight: '500' }}>Password</label>
            <input 
              type="password" 
              className="search-input w-full" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              minLength={6}
            />
          </div>

          {/* REMEMBER ME CHECKBOX */}
          <div className="flex-between align-center" style={{ marginTop: '-4px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', cursor: 'pointer', color: 'var(--text-color)' }}>
              <input 
                type="checkbox" 
                checked={rememberMe} 
                onChange={(e) => setRememberMe(e.target.checked)} 
                style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--primary-color)' }}
              />
              Remember me
            </label>
          </div>

          <button type="submit" className="btn-black w-full mt-8" disabled={isLoading} style={{ padding: '12px' }}>
            {isLoading ? 'Processing...' : isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <div className="text-center mt-24 pt-24" style={{ borderTop: '1px solid var(--border-color)' }}>
          <p className="text-secondary text-sm">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              type="button"
              onClick={() => { setIsLogin(!isLogin); setErrorMsg(''); }} 
              style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontWeight: '600', cursor: 'pointer', padding: 0 }}
            >
              {isLogin ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}