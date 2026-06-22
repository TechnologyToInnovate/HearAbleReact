import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import './index.css';

import Home from './pages/Home';
import Jobs from './pages/Jobs';
import Companies from './pages/Companies';
import CompanyProfile from './pages/CompanyProfile';
import Applicants from './pages/Applicants';
import Users from './pages/Users'; // <--- UPDATED IMPORT
import UserProfile from './pages/UserProfile';
import Profile from './pages/Profile'; 

function Navigation({ role, setRole }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleMenuClick = (path) => {
    setIsDropdownOpen(false);
    navigate(path);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        
        <div className="brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <span className="brand-logo" style={{ background: 'var(--primary-color)' }}>H</span>
          <span className="brand-name">Hearable</span>
        </div>

        <ul className="nav-links">
          <li>
            <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>Dashboard</Link>
          </li>
          <li>
            <Link to="/jobs" className={`nav-link ${location.pathname === '/jobs' ? 'active' : ''}`}>Job Postings</Link>
          </li>
          
          {role === 'user' && (
            <li>
              <Link to="/companies" className={`nav-link ${location.pathname.includes('/company') ? 'active' : ''}`}>Companies</Link>
            </li>
          )}
          
          {role === 'company' && (
            <li>
              <Link to="/applicants" className={`nav-link ${location.pathname === '/applicants' ? 'active' : ''}`}>Applicants</Link>
            </li>
          )}

          {role === 'admin' && (
            <>
              <li>
                {/* UPDATED PATH TO /users */}
                <Link to="/users" className={`nav-link ${location.pathname === '/users' ? 'active' : ''}`}>Manage Users</Link>
              </li>
              <li>
                <Link to="/companies" className={`nav-link ${location.pathname.includes('/company') ? 'active' : ''}`}>Manage Companies</Link>
              </li>
            </>
          )}
        </ul>

        <div className="user-profile" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fef3c7', padding: '4px 8px', borderRadius: '4px', border: '1px solid #f59e0b' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#d97706', textTransform: 'uppercase' }}>Test As:</span>
            <select 
              value={role} 
              onChange={(e) => setRole(e.target.value)}
              style={{ padding: '2px 4px', borderRadius: '4px', border: 'none', background: 'transparent', color: '#92400e', fontWeight: '500', outline: 'none', cursor: 'pointer' }}
            >
              <option value="user">User</option>
              <option value="company">Company</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          
          <div style={{ position: 'relative' }}>
            <div 
              className="avatar" 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              style={{ cursor: 'pointer', userSelect: 'none' }}
            >
              {role === 'company' ? 'TI' : role === 'admin' ? 'AD' : 'JU'}
            </div>

            {isDropdownOpen && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 12px)',
                right: '0',
                width: '220px',
                backgroundColor: 'var(--bg-color)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}>
                <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>
                  <p style={{ margin: 0, fontWeight: '600', color: 'var(--text-color)' }}>
                    {role === 'company' ? 'Tech Innovators Inc.' : role === 'admin' ? 'System Admin' : 'John User'}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--secondary-text)' }}>
                    {role === 'company' ? 'jane@techinnovators.com' : role === 'admin' ? 'admin@hearable.com' : 'user@domain.edu'}
                  </p>
                </div>
                
                <button 
                  onClick={() => handleMenuClick(role === 'company' ? '/company/1' : '/user/1')} 
                  style={{ width: '100%', textAlign: 'left', padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-color)' }}
                >
                  {role === 'company' ? '🏢 View Company Profile' : '👤 View Public Profile'}
                </button>
                
                <button 
                  onClick={() => handleMenuClick(role === 'company' ? '/company/1' : '/edit-profile')} 
                  style={{ width: '100%', textAlign: 'left', padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-color)' }}
                >
                  ⚙️ Edit Profile Settings
                </button>
                
                <div style={{ borderTop: '1px solid var(--border-color)' }}>
                  <button 
                    onClick={() => { setIsDropdownOpen(false); alert('Sign out feature coming soon!'); }} 
                    style={{ width: '100%', textAlign: 'left', padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}
                  >
                    🚪 Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}

export default function App() {
  const [currentRole, setCurrentRole] = useState('admin');

  return (
    <BrowserRouter>
      <div className="app-container">
        <Navigation role={currentRole} setRole={setCurrentRole} />

        <main className="main-content" style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
          <Routes>
            <Route path="/" element={<Home role={currentRole} />} />
            <Route path="/jobs" element={<Jobs role={currentRole} />} />
            <Route path="/companies" element={<Companies role={currentRole} />} />
            <Route path="/company/:id" element={<CompanyProfile role={currentRole} />} />
            <Route path="/applicants" element={<Applicants role={currentRole} />} />
            
            {/* UPDATED ROUTE TO /users AND COMPONENT TO <Users /> */}
            <Route path="/users" element={<Users role={currentRole} />} />
            
            <Route path="/user/:id" element={<UserProfile role={currentRole} />} />
            <Route path="/edit-profile" element={<Profile />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}