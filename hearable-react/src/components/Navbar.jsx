import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient'; 

export default function Navbar() {
  const { role, user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false); 
  
  const dropdownRef = useRef(null);

  const isAuthPage = location.pathname === '/login';
  const isOnboarding = location.pathname === '/onboarding';
  const isMinimalNav = isAuthPage || isOnboarding;

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!user || role === 'guest') return;
    
    async function checkUnread() {
      const { count, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      
      if (!error) setHasUnread(count > 0);
    }
    checkUnread();
  }, [user, role, location.pathname]); 

  const handleMenuClick = (path) => {
    setIsDropdownOpen(false);
    navigate(path);
  };

  const handleSignOut = async () => {
    setIsDropdownOpen(false);
    await signOut();
    navigate('/');
  };

  const DropdownIcon = ({ path }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '12px', opacity: 0.8 }}>
      <path d={path} />
    </svg>
  );

  return (
    <nav className="navbar">
      <div className="navbar-container">
        
        <div className="brand" onClick={() => isOnboarding ? handleSignOut() : navigate('/')} style={{ cursor: 'pointer' }}>
          <span className="brand-logo">H</span>
          <span className="brand-name">Hearable</span>
        </div>

        {!isMinimalNav && (
          <ul className="nav-links">
            <li><Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>Home</Link></li>
            <li><Link to="/jobs" className={`nav-link ${location.pathname === '/jobs' ? 'active' : ''}`}>Job Postings</Link></li>

            {['user', 'pending_user', 'rejected_user', 'guest'].includes(role) && (
              <li><Link to="/companies" className={`nav-link ${location.pathname.includes('/compan') ? 'active' : ''}`}>Companies</Link></li>
            )}

            {role === 'company' && (
              <>
                <li><Link to="/my-jobs" className={`nav-link ${location.pathname === '/my-jobs' ? 'active' : ''}`}>My Postings</Link></li>
                <li><Link to="/applicants" className={`nav-link ${location.pathname === '/applicants' ? 'active' : ''}`}>Applicants</Link></li>
              </>
            )}

            {role === 'admin' && (
              <>
                <li><Link to="/users" className={`nav-link ${['/users', '/degrees', '/batches'].includes(location.pathname) ? 'active' : ''}`}>Manage Users</Link></li>
                <li><Link to="/companies" className={`nav-link ${location.pathname.includes('/compan') ? 'active' : ''}`}>Manage Companies</Link></li>
              </>
            )}
          </ul>
        )}

        {!isMinimalNav && (
          <div className="user-profile flex-row align-center gap-16">
            
            <div className="flex-row align-center gap-4">
              {['user', 'pending_user', 'rejected_user'].includes(role) && (
                <>
                  {/* 🚨 NEW: Resumes Button (Left of My Applications) */}
                  <button 
                    onClick={() => navigate('/resumes')} 
                    className="nav-icon-btn" 
                    title="My Resumes"
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="9" y1="15" x2="15" y2="15"></line>
                    </svg>
                  </button>

                  <button 
                    onClick={() => navigate('/user-jobs')} 
                    className="nav-icon-btn" 
                    title="My Applications"
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                  </button>
                </>
              )}

              {role !== 'guest' && (
                <button 
                  onClick={() => navigate('/notifications')}
                  className="nav-icon-btn" 
                  title="Notifications"
                  style={{ position: 'relative' }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                  </svg>
                  {hasUnread && (
                    <span style={{ position: 'absolute', top: '6px', right: '8px', width: '8px', height: '8px', backgroundColor: '#ef4444', borderRadius: '50%', border: '2px solid var(--bg-color)' }}></span>
                  )}
                </button>
              )}
            </div>

            {role === 'guest' ? (
              <div className="flex-row gap-12 ml-8">
                <button className="btn-outline btn-sm" onClick={() => navigate('/login')}>Sign In</button>
                <button className="btn-black btn-sm" onClick={() => navigate('/login', { state: { isSignUp: true } })}>Sign Up</button>
              </div>
            ) : (
              <div style={{ position: 'relative' }} ref={dropdownRef}>
                <div className="avatar ml-8" onClick={() => setIsDropdownOpen(!isDropdownOpen)} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  {role === 'company' ? 'C' : role === 'admin' ? 'A' : 'U'}
                </div>

                {isDropdownOpen && (
                  <div className="card p-0" style={{ position: 'absolute', top: 'calc(100% + 12px)', right: '0', width: '280px', zIndex: 1000, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                    
                    <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)' }}>
                      <p className="m-0 font-bold" style={{ fontSize: '1.1rem' }}>My Account</p>
                      <p className="m-0 text-sm text-secondary mt-4" style={{ textTransform: 'capitalize' }}>
                        Status: {role.replace('_', ' ')}
                      </p>
                    </div>

                    {!isOnboarding && role === 'company' && (
                      <button className="dropdown-btn" onClick={() => handleMenuClick(`/company/${user?.id}`)}>
                        <DropdownIcon path="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4M9 7h6M9 11h6" />
                        View Company Profile
                      </button>
                    )}
                    
                    {!isOnboarding && ['user', 'pending_user', 'rejected_user'].includes(role) && (
                      <button className="dropdown-btn" onClick={() => handleMenuClick(`/user/${user?.id}`)}>
                        <DropdownIcon path="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
                        View Public Profile
                      </button>
                    )}

                    {!isOnboarding && role === 'admin' && (
                      <button className="dropdown-btn" onClick={() => handleMenuClick('/admins')}>
                        <DropdownIcon path="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        Manage Admins
                      </button>
                    )}

                    <div style={{ borderTop: '1px solid var(--border-color)' }}>
                      <button className="dropdown-btn" onClick={() => handleMenuClick('/settings')}>
                        <DropdownIcon path="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                        Settings
                      </button>

                      {/* 🚨 NEW: Feedback Link (Available for Admins & Users) */}
                      {!isOnboarding && ['user', 'pending_user', 'rejected_user', 'admin'].includes(role) && (
                        <button className="dropdown-btn" onClick={() => handleMenuClick('/feedbacks')}>
                          <DropdownIcon path="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                          Feedback
                        </button>
                      )}
                      
                      <button className="dropdown-btn text-danger" onClick={handleSignOut}>
                        <DropdownIcon path="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                        Sign Out
                      </button>
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