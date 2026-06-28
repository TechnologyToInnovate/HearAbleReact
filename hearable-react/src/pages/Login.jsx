import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Login({ setRole }) {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 🚨 THE FIX: Automatically sets to Sign Up if passed from Navbar, otherwise defaults to Sign In
  const [isLogin, setIsLogin] = useState(!location.state?.isSignUp);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Clear errors when toggling between Sign In and Sign Up
  useEffect(() => {
    setErrorMsg('');
  }, [isLogin]);

  async function handleAuth(e) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (isLogin) {
        // --- SIGN IN LOGIC ---
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
        await routeUserAfterLogin(data.user);
      } else {
        // --- SIGN UP LOGIC ---
        const { data: adminData } = await supabase.from('admins').select('email').eq('email', email.toLowerCase()).maybeSingle();
        const { data: preApprovedData } = await supabase.from('pre_approved_companies').select('*').eq('email', email.toLowerCase()).maybeSingle();

        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;

        if (adminData || email.toLowerCase() === 'admin@hearable.com') {
          // It's an admin signing up
          setRole('admin');
          navigate('/');
        } else if (preApprovedData) {
          // It's a pre-approved company signing up. Build their profile!
          await supabase.from('companies').insert([{
            id: data.user.id,
            name: preApprovedData.name,
            address: preApprovedData.address,
            country: preApprovedData.country,
            city: preApprovedData.city,
            postal_code: preApprovedData.postal_code,
            contact_person_name: preApprovedData.contact_person_name,
            contact_person_email: preApprovedData.contact_person_email,
            contact_person_number: preApprovedData.contact_person_number,
            status: 'Approved'
          }]);
          setRole('company');
          navigate('/');
        } else {
          // Standard user signing up
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

  async function routeUserAfterLogin(user) {
    try {
      const { data: adminData } = await supabase.from('admins').select('email').eq('email', user.email).maybeSingle();
      if (adminData || user.email === 'admin@hearable.com') {
        setRole('admin');
        navigate('/');
        return;
      }

      const { data: companyData } = await supabase.from('companies').select('id').eq('id', user.id).maybeSingle();
      if (companyData) {
        setRole('company');
        navigate('/');
        return;
      }

      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      if (!profileData || !profileData.name || profileData.name === 'New User' || !profileData.degree_id) {
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
    <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <div className="card p-0" style={{ width: '100%', maxWidth: '400px', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
        
        {/* Toggle Header */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', background: 'var(--card-bg)' }}>
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

        <div style={{ padding: '32px' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h2 style={{ margin: '0 0 8px 0' }}>{isLogin ? 'Welcome Back' : 'Create an Account'}</h2>
            <p className="text-secondary text-sm m-0">
              {isLogin ? 'Enter your details to access your account.' : 'Join the Hearable network today.'}
            </p>
          </div>

          {errorMsg && (
            <div style={{ background: '#fef2f2', color: '#dc2626', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '20px', border: '1px solid #fecaca' }}>
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleAuth} className="flex-col gap-16">
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '500' }}>Email Address</label>
              <input 
                type="email" 
                className="search-input w-full" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '500' }}>Password</label>
              <input 
                type="password" 
                className="search-input w-full" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                minLength="6"
              />
              {!isLogin && <p className="text-secondary" style={{ fontSize: '0.75rem', marginTop: '4px' }}>Must be at least 6 characters.</p>}
            </div>

            <button type="submit" className="btn-black w-full mt-8" disabled={loading} style={{ padding: '12px' }}>
              {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}