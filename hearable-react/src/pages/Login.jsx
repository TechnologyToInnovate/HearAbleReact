import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, useLocation, Link } from 'react-router-dom';

export default function Login({ setRole }) {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine initial view based on navigation state (defaulting to Sign In)
  const [isLogin, setIsLogin] = useState(!location.state?.isSignUp);
  
  // Form and UI state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Clear messages when switching between Sign In and Sign Up tabs
  useEffect(() => {
    setErrorMsg('');
    setSuccessMsg('');
  }, [isLogin]);

  // Handles both Sign In and Sign Up flows
  async function handleAuth(e) {
    e.preventDefault();
    setLoading(true); 
    setErrorMsg(''); 
    setSuccessMsg('');

    try {
      if (isLogin) {
        // --- SIGN IN FLOW ---
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await routeUserAfterLogin(data.user);
      } else {
        // --- SIGN UP FLOW ---
        // Check if the email belongs to an admin or a pre-approved company before registering
        const { data: adminData } = await supabase.from('admins').select('email').eq('email', email.toLowerCase()).maybeSingle();
        const { data: preApprovedData } = await supabase.from('pre_approved_companies').select('*').eq('email', email.toLowerCase()).maybeSingle();

        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;

        if (adminData || email.toLowerCase() === 'admin@hearable.com') {
          // Automatically grant admin role and redirect
          setRole('admin'); 
          navigate('/');
        } else if (preApprovedData) {
          // Automatically create a full company profile using the pre-approved data (including the linked location_id)
          await supabase.from('companies').insert([{
            id: data.user.id, 
            name: preApprovedData.name, 
            location_id: preApprovedData.location_id, 
            industry: preApprovedData.industry, 
            founded_year: preApprovedData.founded_year,  
            website: preApprovedData.website, 
            description: preApprovedData.description,    
            status: 'Approved'
          }]);
          setRole('company'); 
          navigate('/');
        } else {
          // Standard users must complete the onboarding flow to set up their profile
          setRole('needs_onboarding'); 
          navigate('/onboarding');
        }
      }
    } catch (err) { 
      setErrorMsg(err.message); 
    } finally { 
      setLoading(false); 
    }
  }

  // Triggers a password reset email via Supabase Auth
  async function handleForgotPassword() {
    if (!email) return setErrorMsg('Please enter your email address in the field above first.');
    
    setLoading(true); 
    setErrorMsg(''); 
    setSuccessMsg('');
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/settings`,
    });
    
    setLoading(false);
    if (error) setErrorMsg(error.message);
    else setSuccessMsg('Password reset link sent! Please check your email inbox.');
  }

  // Resolves the correct role for a returning user based on which table their ID/email exists in
  async function routeUserAfterLogin(user) {
    try {
      // Check for Admin privileges
      const { data: adminData } = await supabase.from('admins').select('email').eq('email', user.email).maybeSingle();
      if (adminData || user.email === 'admin@hearable.com') { 
        setRole('admin'); 
        navigate('/'); 
        return; 
      }

      // Check if the user is a registered Company
      const { data: companyData } = await supabase.from('companies').select('id').eq('id', user.id).maybeSingle();
      if (companyData) { 
        setRole('company'); 
        navigate('/'); 
        return; 
      }

      // Check Standard User profile status
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      
      if (!profileData || !profileData.first_name || !profileData.degree_id) {
        setRole('needs_onboarding'); 
        navigate('/onboarding');
      } else if (profileData.status === 'Pending') {
        setRole('pending_user'); 
        navigate('/');
      } else if (profileData.status === 'Rejected') {
        setRole('rejected_user'); 
        navigate('/');
      } else {
        setRole('user'); 
        navigate('/');
      }
    } catch (error) { 
      console.error("Routing error:", error); 
    }
  }

  return (
    <div className="page-container flex-col align-center" style={{ justifyContent: 'center', minHeight: '80vh' }}>
      <div className="card p-0 w-full" style={{ maxWidth: '400px', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
        
        {/* View Toggle Tabs */}
        <div className="flex-row" style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--card-bg)' }}>
          <button 
            onClick={() => setIsLogin(true)} 
            style={{ flex: 1, padding: '16px', border: 'none', background: 'none', fontSize: '1rem', fontWeight: isLogin ? '600' : '400', color: isLogin ? 'var(--primary-color)' : 'var(--secondary-text)', borderBottom: isLogin ? '2px solid var(--primary-color)' : '2px solid transparent', cursor: 'pointer' }}
          >
            Sign In
          </button>
          <button 
            onClick={() => setIsLogin(false)} 
            style={{ flex: 1, padding: '16px', border: 'none', background: 'none', fontSize: '1rem', fontWeight: !isLogin ? '600' : '400', color: !isLogin ? 'var(--primary-color)' : 'var(--secondary-text)', borderBottom: !isLogin ? '2px solid var(--primary-color)' : '2px solid transparent', cursor: 'pointer' }}
          >
            Sign Up
          </button>
        </div>

        <div className="p-32">
          <div className="text-center mb-24">
            <h2 className="m-0 mb-8">{isLogin ? 'Welcome Back' : 'Create an Account'}</h2>
            <p className="text-secondary text-sm m-0">
              {isLogin ? 'Enter your details to access your account.' : 'Join the Hearable network today.'}
            </p>
          </div>

          {/* Status Messages */}
          {errorMsg && <div className="mb-16" style={{ background: '#fef2f2', color: '#dc2626', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', border: '1px solid #fecaca' }}>{errorMsg}</div>}
          {successMsg && <div className="mb-16" style={{ background: '#f0fdf4', color: '#166534', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', border: '1px solid #bbf7d0' }}>{successMsg}</div>}

          {/* Authentication Form */}
          <form onSubmit={handleAuth} className="flex-col gap-16">
            <div>
              <label className="block mb-8 text-sm font-bold">Email Address</label>
              <input type="email" className="search-input w-full" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            
            <div>
              <div className="flex-between align-center mb-8">
                <label className="m-0 text-sm font-bold">Password</label>
                {isLogin && (
                  <button type="button" onClick={handleForgotPassword} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontSize: '0.8rem', cursor: 'pointer', padding: 0, fontWeight: '500' }}>
                    Forgot Password?
                  </button>
                )}
              </div>
              <input type="password" className="search-input w-full" value={password} onChange={(e) => setPassword(e.target.value)} required minLength="6" />
              {!isLogin && <p className="text-secondary mt-8" style={{ fontSize: '0.75rem' }}>Must be at least 6 characters.</p>}
            </div>

            <button type="submit" className="btn-black w-full mt-16" disabled={loading} style={{ padding: '12px' }}>
              {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          {/* --- THE NEW DISCLAIMER TEXT --- */}
          <div className="text-center mt-24">
            <p className="text-secondary m-0" style={{ fontSize: '0.8rem', lineHeight: '1.5' }}>
              By continuing, you agree to HearAble's{' '}
              <Link to="/terms" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: '600' }}>
                User Agreement
              </Link>
              ,{' '}
              <Link to="/privacy-policy" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: '600' }}>
                Privacy Policy
              </Link>
              , and{' '}
              <Link to="/cookies" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: '600' }}>
                Cookie Policy
              </Link>.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}