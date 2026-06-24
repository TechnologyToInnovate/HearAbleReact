import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function Login({ setRole }) {
  const navigate = useNavigate();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [idNumber, setIdNumber] = useState(''); 
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  async function handleAuth(e) {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      if (isLogin) {
        // ==========================================
        // 1. SIGN IN FLOW
        // ==========================================
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        const user = data.user;
        
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
        
        setRole('user'); 
        navigate('/');

      } else {
        // ==========================================
        // 2. SMART REGISTER FLOW
        // ==========================================
        const lowerEmail = email.toLowerCase().trim();

        // --- PRE-FLIGHT CHECK ---
        const { data: adminData } = await supabase.from('admins').select('email').eq('email', lowerEmail).maybeSingle();
        const isAdmin = adminData || lowerEmail === 'admin@hearable.com';

        const { data: companyRoster } = await supabase.from('pre_approved_companies').select('*').eq('email', lowerEmail).maybeSingle();

        // If they aren't an Admin and aren't on the Company roster, they MUST be Talent.
        if (!isAdmin && !companyRoster) {
          if (!idNumber || !/^\d{8}$/.test(idNumber)) {
            // UPDATED ERROR MESSAGE HERE
            throw new Error("Your profile does not currently exist or you forgot to add your ID.");
          }
        }

        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;

        const user = data.user;

        if (user) {
          if (isAdmin) {
            setRole('admin'); 
            navigate('/'); 
            return;
          }

          if (companyRoster) {
            const { error: insertErr } = await supabase.from('companies').insert([{ 
              id: user.id, 
              name: companyRoster.name, 
              address: companyRoster.address, 
              status: 'Approved' 
            }]);
            if (insertErr) throw insertErr;
            
            await supabase.from('pre_approved_companies').delete().eq('email', companyRoster.email);
            setRole('company'); 
            navigate('/'); 
            return;
          }

          const { data: userRoster } = await supabase.from('pre_approved_users').select('*').eq('email', lowerEmail).maybeSingle();

          if (userRoster) {
            const { error: insertErr } = await supabase.from('profiles').insert([{ 
              id: user.id, 
              name: userRoster.name, 
              id_number: userRoster.id_number, 
              major: userRoster.major, 
              status: 'Approved' 
            }]);
            if (insertErr) throw insertErr;
            await supabase.from('pre_approved_users').delete().eq('email', userRoster.email);
          } else {
            const { error: insertErr } = await supabase.from('profiles').insert([{ 
              id: user.id, 
              name: 'New User', 
              id_number: idNumber, 
              status: 'Pending' 
            }]);
            if (insertErr) throw insertErr;
          }
          
          setRole('user'); 
          navigate('/'); 
        }
      }
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="card p-20" style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
        
        <div className="mb-24 flex-col" style={{ alignItems: 'center', gap: '12px' }}>
          <div className="avatar-lg" style={{ width: '64px', height: '64px', background: 'var(--primary-color)', color: 'white', fontSize: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>H</div>
          <h2 style={{ margin: 0 }}>{isLogin ? 'Welcome Back' : 'Join Hearable'}</h2>
          <p className="text-secondary text-sm" style={{ margin: 0 }}>{isLogin ? 'Sign in to your account' : 'Create an account to get started'}</p>
        </div>

        {errorMessage && <div className="mb-16" style={{ background: '#fee2e2', color: '#dc2626', padding: '12px', borderRadius: '8px', fontSize: '0.9rem', border: '1px solid #fecaca', textAlign: 'left' }}><strong>Error:</strong> {errorMessage}</div>}

        <form onSubmit={handleAuth} className="flex-col">
          <div style={{ textAlign: 'left' }}><label>Email Address</label><input type="email" className="search-input" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
          <div style={{ textAlign: 'left' }}><label>Password</label><input type="password" className="search-input" value={password} onChange={(e) => setPassword(e.target.value)} required minLength="6" /></div>

          {!isLogin && (
            <div style={{ textAlign: 'left', marginTop: '8px' }}>
              <label>ID Number (8 Digits)</label>
              <input 
                type="text" 
                className="search-input" 
                value={idNumber} 
                onChange={(e) => setIdNumber(e.target.value)} 
                maxLength="8" 
                placeholder="For alumni users only (e.g. 11812345)" 
              />
            </div>
          )}

          <button type="submit" className="btn-black w-full mt-24" disabled={isLoading} style={{ padding: '12px' }}>
            {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="mt-24" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
          <p className="text-sm text-secondary">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button type="button" onClick={() => { setIsLogin(!isLogin); setErrorMessage(null); setIdNumber(''); }} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontWeight: '600', cursor: 'pointer' }}>
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}