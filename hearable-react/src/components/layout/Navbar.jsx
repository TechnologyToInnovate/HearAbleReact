import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient'; 
import { useAuth } from '../../context/AuthContext';
import Avatar from '../common/Avatar';
import './Navbar.css';

export default function Navbar() {
  const { role, user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); 
  const [hasUnread, setHasUnread] = useState(false); 
  
  const [profileName, setProfileName] = useState('');
  const [profilePic, setProfilePic] = useState(null);
  
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
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!user || role === 'guest') return;
    async function checkUnread() {
      const { count, error } = await supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_read', false);
      if (!error) setHasUnread(count > 0);
    }
    checkUnread();
  }, [user, role, location.pathname]); 

  useEffect(() => {
    async function fetchProfileDetails() {
      if (!user) {
        setProfileName('');
        setProfilePic(null);
        return;
      }
      
      if (['user', 'pending_user', 'rejected_user'].includes(role)) {
        const { data } = await supabase.from('profiles').select('first_name, last_name, profile_pic').eq('id', user.id).maybeSingle();
        if (data && (data.first_name || data.last_name)) {
          setProfileName(`${data.first_name || ''} ${data.last_name || ''}`.trim());
          setProfilePic(data.profile_pic);
        } else {
          setProfileName('User');
          setProfilePic(null);
        }
      } else if (role === 'company') {
        const { data } = await supabase.from('companies').select('name, logo_url').eq('id', user.id).maybeSingle();
        if (data && data.name) {
          setProfileName(data.name);
          setProfilePic(data.logo_url);
        }
      } else if (role === 'admin') {
        setProfileName('Admin Account');
        setProfilePic(null);
      }
    }
    
    fetchProfileDetails();
  }, [user, role]);

  const handleMenuClick = (path) => { 
    setIsDropdownOpen(false); 
    setIsMobileMenuOpen(false);
    navigate(path); 
  };
  
  const handleSignOut = async () => { 
    setIsDropdownOpen(false); 
    setIsMobileMenuOpen(false);
    await signOut(); 
    navigate('/'); 
  };

  const DropdownIcon = ({ path }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '12px', opacity: 0.8 }}><path d={path} /></svg>
  );

  const NavLinksList = () => (
    <ul className="nav-links">
      <li><Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>Home</Link></li>
      
      <li>
        <Link to="/jobs" className={`nav-link ${location.pathname === '/jobs' ? 'active' : ''}`}>
          {role === 'admin' ? 'Manage Jobs' : 'Job Postings'}
        </Link>
      </li>

      {['user', 'pending_user', 'rejected_user', 'guest'].includes(role) && (
        <li><Link to="/companies" className={`nav-link ${location.pathname.includes('/compan') ? 'active' : ''}`}>Companies</Link></li>
      )}
      
      {['user', 'pending_user', 'rejected_user'].includes(role) && (
        <>
          <li><Link to="/user-jobs" className={`nav-link ${location.pathname === '/user-jobs' ? 'active' : ''}`}>Applications</Link></li>
          <li><Link to="/resumes" className={`nav-link ${location.pathname === '/resumes' ? 'active' : ''}`}>Resumes</Link></li>
          <li><Link to="/feedback" className={`nav-link ${location.pathname === '/feedback' ? 'active' : ''}`}>Feedback</Link></li>
        </>
      )}

      {role === 'company' && (
        <>
          <li><Link to="/my-jobs" className={`nav-link ${location.pathname === '/my-jobs' ? 'active' : ''}`}>Postings</Link></li>
          <li><Link to="/applicants" className={`nav-link ${location.pathname === '/applicants' ? 'active' : ''}`}>Applicants</Link></li>
        </>
      )}
      
      {role === 'admin' && (
        <>
          <li><Link to="/users" className={`nav-link ${['/users', '/degrees', '/skills', '/batches'].includes(location.pathname) ? 'active' : ''}`}>Manage Users</Link></li>
          <li><Link to="/companies" className={`nav-link ${location.pathname.includes('/compan') ? 'active' : ''}`}>Manage Companies</Link></li>
          <li><Link to="/feedback" className={`nav-link ${location.pathname === '/feedback' ? 'active' : ''}`}>Manage Feedbacks</Link></li>
        </>
      )}
    </ul>
  );

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="brand" onClick={() => isOnboarding ? handleSignOut() : navigate('/')} style={{ cursor: 'pointer' }}>
          <span className="brand-logo">H</span><span className="brand-name">Hearable</span>
        </div>

        {!isMinimalNav && (
          <div className="desktop-nav-links">
            <NavLinksList />
          </div>
        )}

        {!isMinimalNav && (
          <div className="user-profile desktop-user-profile flex-row align-center gap-16">
            <div className="flex-row align-center gap-4">
              
              {role !== 'guest' && (
                <button onClick={() => navigate('/notifications')} className="nav-icon-btn" title="Notifications" style={{ position: 'relative' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                  {hasUnread && <span style={{ position: 'absolute', top: '6px', right: '8px', width: '8px', height: '8px', backgroundColor: '#ef4444', borderRadius: '50%', border: '2px solid var(--bg-color)' }}></span>}
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
                <div onClick={() => setIsDropdownOpen(!isDropdownOpen)} style={{ cursor: 'pointer', userSelect: 'none', marginLeft: '8px' }}>
                  <Avatar src={profilePic} fallbackName={profileName || (role === 'company' ? 'Company' : role === 'admin' ? 'Admin' : 'User')} size="sm" type={role === 'company' ? 'company' : 'user'} />
                </div>

                {isDropdownOpen && (
                  <div className="card p-0" style={{ position: 'absolute', top: 'calc(100% + 12px)', right: '0', width: '280px', zIndex: 1000, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                    <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)' }}>
                      <p className="m-0 font-bold" style={{ fontSize: '1.1rem' }}>My Account</p>
                      <p className="m-0 text-sm text-secondary mt-4" style={{ textTransform: 'capitalize' }}>Status: {role.replace('_', ' ')}</p>
                    </div>
                    {!isOnboarding && role === 'company' && (
                      <button className="dropdown-btn" onClick={() => handleMenuClick(`/company/${user?.id}`)}><DropdownIcon path="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4M9 7h6M9 11h6" />View Company Profile</button>
                    )}
                    {!isOnboarding && ['user', 'pending_user', 'rejected_user'].includes(role) && (
                      <button className="dropdown-btn" onClick={() => handleMenuClick(`/user/${user?.id}`)}><DropdownIcon path="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />View Public Profile</button>
                    )}
                    {!isOnboarding && role === 'admin' && (
                      <button className="dropdown-btn" onClick={() => handleMenuClick('/admins')}><DropdownIcon path="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />Manage Admins</button>
                    )}
                    <div style={{ borderTop: '1px solid var(--border-color)' }}>
                      <button className="dropdown-btn" onClick={() => handleMenuClick('/settings')}><DropdownIcon path="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />Settings</button>
                      <button className="dropdown-btn text-danger" onClick={handleSignOut}><DropdownIcon path="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />Sign Out</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {!isMinimalNav && (
          <button 
            className="mobile-menu-btn" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {isMobileMenuOpen ? (
                <><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></>
              ) : (
                <><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></>
              )}
            </svg>
          </button>
        )}
      </div>

      {isMobileMenuOpen && !isMinimalNav && (
        <div className="mobile-nav-dropdown">
          <NavLinksList />
          
          {user && role !== 'guest' && !isOnboarding && (
            <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '16px', marginTop: '-8px' }}>
              {role === 'company' && (
                <button className="dropdown-btn" onClick={() => handleMenuClick(`/company/${user?.id}`)} style={{ padding: '12px 0' }}>
                  <DropdownIcon path="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4M9 7h6M9 11h6" />
                  View Company Profile
                </button>
              )}
              {['user', 'pending_user', 'rejected_user'].includes(role) && (
                <button className="dropdown-btn" onClick={() => handleMenuClick(`/user/${user?.id}`)} style={{ padding: '12px 0' }}>
                  <DropdownIcon path="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
                  View Public Profile
                </button>
              )}
              {role === 'admin' && (
                <button className="dropdown-btn" onClick={() => handleMenuClick('/admins')} style={{ padding: '12px 0' }}>
                  <DropdownIcon path="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  Manage Admins
                </button>
              )}
            </div>
          )}

          <div className="user-profile-mobile">
            {role === 'guest' ? (
              <div className="flex-row gap-12 w-full justify-center">
                <button className="btn-outline" style={{flex: 1}} onClick={() => handleMenuClick('/login')}>Sign In</button>
                <button className="btn-black" style={{flex: 1}} onClick={() => handleMenuClick('/login', { state: { isSignUp: true } })}>Sign Up</button>
              </div>
            ) : (
              <>
                <div className="flex-row align-center gap-12">
                  <Avatar src={profilePic} fallbackName={profileName || 'User'} size="sm" type={role === 'company' ? 'company' : 'user'} />
                  <div className="flex-col">
                    <span className="font-bold">{profileName || 'User'}</span>
                    <span className="text-sm text-secondary" style={{textTransform: 'capitalize'}}>{role.replace('_', ' ')}</span>
                  </div>
                </div>
                <div className="flex-row gap-8">
                  <button onClick={() => handleMenuClick('/settings')} className="nav-icon-btn"><DropdownIcon path="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" /></button>
                  <button onClick={handleSignOut} className="nav-icon-btn text-danger" style={{color: '#dc2626'}}><DropdownIcon path="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}