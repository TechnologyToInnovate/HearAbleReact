import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import './index.css';

// --- PAGES ---
import Home from './pages/Home';
import Jobs from './pages/Jobs';
import Companies from './pages/Companies';
import CompanyProfile from './pages/CompanyProfile';
import Applicants from './pages/Applicants';
import Users from './pages/Users';
import UserProfile from './pages/UserProfile';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';

// --- ADMIN PAGES ---
import Degrees from './pages/Degrees';
import Batches from './pages/Batches';
import Admins from './pages/Admins';

function Navigation({ role, setRole, currentUserId }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const isAuthPage = location.pathname === '/login';
  const isOnboarding = location.pathname === '/onboarding';

  // Minimal nav hides the links/buttons but keeps the logo
  const isMinimalNav = isAuthPage || isOnboarding;

  const handleMenuClick = (path) => {
    setIsDropdownOpen(false);
    navigate(path);
  };

  const handleSignOut = async () => {
    setIsDropdownOpen(false);
    await supabase.auth.signOut();
    setRole('guest');
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">

        {/* BRAND - Logs out if on Onboarding, otherwise navigates to Home */}
        <div
          className="brand"
          onClick={() => isOnboarding ? handleSignOut() : navigate('/')}
          style={{ cursor: 'pointer' }}
        >
          <span className="brand-logo" style={{ background: 'var(--primary-color)' }}>H</span>
          <span className="brand-name">Hearable</span>
        </div>

        {/* NAVIGATION LINKS - Hidden if minimal nav is active */}
        {!isMinimalNav && (
          <ul className="nav-links">
            <li><Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>Home</Link></li>
            <li><Link to="/jobs" className={`nav-link ${location.pathname === '/jobs' ? 'active' : ''}`}>Job Postings</Link></li>

            {['user', 'pending_user', 'rejected_user', 'guest'].includes(role) && (
              <li><Link to="/companies" className={`nav-link ${location.pathname.includes('/compan') ? 'active' : ''}`}>Companies</Link></li>
            )}

            {role === 'company' && <li><Link to="/applicants" className={`nav-link ${location.pathname === '/applicants' ? 'active' : ''}`}>Applicants</Link></li>}

            {/* Admin links kept in the main navbar */}
            {role === 'admin' && (
              <>
                <li><Link to="/users" className={`nav-link ${['/users', '/degrees', '/batches'].includes(location.pathname) ? 'active' : ''}`}>Manage Users</Link></li>
                <li><Link to="/companies" className={`nav-link ${location.pathname.includes('/compan') ? 'active' : ''}`}>Manage Companies</Link></li>
              </>
            )}
          </ul>
        )}

        {/* USER PROFILE / AUTH BUTTONS - Hidden if minimal nav is active */}
        {!isMinimalNav && (
          <div className="user-profile" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>

            {role === 'guest' ? (
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn-outline btn-sm" onClick={() => navigate('/login')}>Sign In</button>
                <button className="btn-black btn-sm" onClick={() => navigate('/login')}>Sign Up</button>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <div className="avatar" onClick={() => setIsDropdownOpen(!isDropdownOpen)} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  {role === 'company' ? 'C' : role === 'admin' ? 'A' : 'U'}
                </div>

                {isDropdownOpen && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 12px)', right: '0', width: '220px', backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 1000, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>
                      <p style={{ margin: 0, fontWeight: '600', color: 'var(--text-color)' }}>My Account</p>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--secondary-text)', textTransform: 'capitalize' }}>
                        Status: {role.replace('_', ' ')}
                      </p>
                    </div>

                    {!isOnboarding && role === 'company' && <button onClick={() => handleMenuClick(`/company/${currentUserId}`)} style={{ width: '100%', textAlign: 'left', padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-color)' }}>🏢 View Company Profile</button>}
                    {!isOnboarding && ['user', 'pending_user', 'rejected_user'].includes(role) && <button onClick={() => handleMenuClick(`/user/${currentUserId}`)} style={{ width: '100%', textAlign: 'left', padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-color)' }}>👤 View Public Profile</button>}

                    {!isOnboarding && role === 'admin' && (
                      <button onClick={() => handleMenuClick('/admins')} style={{ width: '100%', textAlign: 'left', padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-color)' }}>
                        🛡️ Manage Admins
                      </button>
                    )}

                    <div style={{ borderTop: '1px solid var(--border-color)' }}>
                      <button onClick={handleSignOut} style={{ width: '100%', textAlign: 'left', padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}>🚪 Sign Out</button>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        )}
      </div>
    </nav>
  );
}

export default function App() {
  const [currentRole, setCurrentRole] = useState('guest');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setCurrentUserId(session.user.id);
        restoreUserRole(session.user);
      } else {
        setIsInitializing(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setCurrentUserId(session.user.id);
        restoreUserRole(session.user);
      } else {
        setCurrentRole('guest');
        setCurrentUserId(null);
        setIsInitializing(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function restoreUserRole(user) {
    try {
      // 1. Check if the user is an Admin
      const { data: adminData } = await supabase.from('admins').select('email').eq('email', user.email).maybeSingle();
      if (adminData || user.email === 'admin@hearable.com') {
        setCurrentRole('admin');
        setIsInitializing(false);
        return;
      }

      // 2. Check if the user is a Company
      const { data: companyData } = await supabase.from('companies').select('id').eq('id', user.id).maybeSingle();
      if (companyData) {
        setCurrentRole('company');
        setIsInitializing(false);
        return;
      }

      // 3. Otherwise, check their standard User profile
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();

      // 🚨 THE FIX: This now correctly checks for degree_id instead of the old degree column!
      if (!profileData || !profileData.name || profileData.name === 'New User' || !profileData.degree_id) {
        setCurrentRole('needs_onboarding');
      } else if (profileData.status === 'Pending') {
        setCurrentRole('pending_user');
      } else if (profileData.status === 'Rejected') {
        setCurrentRole('rejected_user');
      } else {
        setCurrentRole('user');
      }

      setIsInitializing(false);
    } catch (error) {
      console.error("Auth error:", error);
      setIsInitializing(false);
    }
  }

  if (isInitializing) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading Hearable...</div>;
  }

  return (
    <BrowserRouter>
      <div className="app-container">
        <Navigation role={currentRole} setRole={setCurrentRole} currentUserId={currentUserId} />

        <main className="main-content" style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
          <Routes>
            <Route path="/login" element={currentRole === 'guest' ? <Login setRole={setCurrentRole} /> : <Navigate to="/" />} />

            <Route path="/" element={currentRole === 'needs_onboarding' ? <Navigate to="/onboarding" /> : <Home role={currentRole} />} />
            <Route path="/jobs" element={currentRole === 'needs_onboarding' ? <Navigate to="/onboarding" /> : <Jobs role={currentRole} />} />
            <Route path="/companies" element={currentRole === 'needs_onboarding' ? <Navigate to="/onboarding" /> : <Companies role={currentRole} />} />

            <Route path="/company/:id" element={<CompanyProfile role={currentRole} />} />

            <Route path="/onboarding" element={currentRole === 'guest' ? <Navigate to="/login" /> : <Onboarding />} />

            <Route path="/applicants" element={currentRole === 'guest' ? <Navigate to="/login" /> : <Applicants role={currentRole} />} />
            <Route path="/users" element={currentRole === 'guest' ? <Navigate to="/login" /> : <Users role={currentRole} />} />
            <Route path="/user/:id" element={currentRole === 'guest' ? <Navigate to="/login" /> : <UserProfile role={currentRole} />} />

            <Route path="/degrees" element={currentRole === 'admin' ? <Degrees role={currentRole} /> : <Navigate to="/" />} />
            <Route path="/batches" element={currentRole === 'admin' ? <Batches role={currentRole} /> : <Navigate to="/" />} />
            <Route path="/admins" element={currentRole === 'admin' ? <Admins role={currentRole} /> : <Navigate to="/" />} />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}