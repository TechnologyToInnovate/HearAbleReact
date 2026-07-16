import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';

// GLOBAL CONTEXT & COMPONENTS
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from "./components/layout/Navbar";

import { useAutoLogout } from './hooks/useAutoLogout';

// --- MAIN PAGES ---
import Home from './pages/Home';
import Jobs from './pages/Jobs';
import MyJobs from './pages/MyJobs';
import UserJobs from './pages/UserJobs';
import Companies from './pages/Companies';
import CompanyProfile from './pages/CompanyProfile';
import Applicants from './pages/Applicants';
import Users from './pages/Users';
import UserProfile from './pages/UserProfile';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';
import Resumes from './pages/Resumes';
import Feedbacks from './pages/Feedbacks';
import ResetPassword from './pages/ResetPassword'; 

// --- ADMIN PAGES ---
import Degrees from './pages/Degrees';
import Batches from './pages/Batches';
import Admins from './pages/Admins';
import Skills from './pages/Skills';

// --- LEGAL PAGES ---
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsAndConditions from './pages/TermsAndConditions';

function AppRoutes() {
  const { role, setRole } = useAuth();

  // 🚨 This works perfectly now because AppRoutes is inside the Router!
  useAutoLogout(600000);

  useEffect(() => {
    const applyTheme = (isDark) => {
      if (isDark) {
        document.body.classList.add('dark-theme');
      } else {
        document.body.classList.remove('dark-theme');
      }
    };

    const storedTheme = localStorage.getItem('theme');

    if (storedTheme) {
      applyTheme(storedTheme === 'dark');
    } else {
      applyTheme(false); 
    }
  }, []);

  return (
    <div className="app-container">
      
      <Navbar />

      <main className="main-content" style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* --- GLOBAL ALERT BANNERS --- */}
        {role === 'pending_user' && (
          <div className="mb-32 p-16 flex-row align-center gap-12" style={{ background: '#fef9c3', color: '#854d0e', border: '1px solid #fde047', borderRadius: '8px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            <div>
              <strong className="block mb-4">Account Under Review</strong>
              <span className="text-sm">You can browse jobs and companies, but you will not have full access to apply until an administrator reviews your profile.</span>
            </div>
          </div>
        )}

        {role === 'rejected_user' && (
          <div className="mb-32 p-16 flex-row align-center gap-12" style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: '8px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
            <div>
              <strong className="block mb-4">Registration Declined</strong>
              <span className="text-sm">Your account was not approved by the administration. You can view listings but do not have application privileges.</span>
            </div>
          </div>
        )}

        <Routes>
          <Route path="/login" element={role === 'guest' ? <Login setRole={setRole} /> : <Navigate to="/" />} />

          <Route path="/" element={role === 'needs_onboarding' ? <Navigate to="/onboarding" /> : <Home role={role} />} />
          <Route path="/jobs" element={role === 'needs_onboarding' ? <Navigate to="/onboarding" /> : <Jobs />} />
          <Route path="/my-jobs" element={role === 'company' ? <MyJobs /> : <Navigate to="/" />} />

          <Route path="/user-jobs" element={['user', 'pending_user', 'rejected_user'].includes(role) ? <UserJobs /> : <Navigate to="/" />} />

          <Route path="/companies" element={role === 'needs_onboarding' ? <Navigate to="/onboarding" /> : <Companies role={role} />} />
          <Route path="/company/:id" element={<CompanyProfile />} />

          <Route path="/onboarding" element={role === 'guest' ? <Navigate to="/login" /> : <Onboarding />} />

          <Route path="/applicants" element={role === 'guest' ? <Navigate to="/login" /> : <Applicants />} />
          <Route path="/users" element={role === 'guest' ? <Navigate to="/login" /> : <Users role={role} />} />
          <Route path="/user/:id" element={role === 'guest' ? <Navigate to="/login" /> : <UserProfile />} />

          <Route path="/degrees" element={role === 'admin' ? <Degrees role={role} /> : <Navigate to="/" />} />
          <Route path="/batches" element={role === 'admin' ? <Batches role={role} /> : <Navigate to="/" />} />
          <Route path="/admins" element={role === 'admin' ? <Admins role={role} /> : <Navigate to="/" />} />
          <Route path="/skills" element={role === 'admin' ? <Skills /> : <Navigate to="/" />} />
          <Route path="/resumes" element={<Resumes />} />
          <Route path="/feedback" element={<Feedbacks />} />

          <Route path="/settings" element={role === 'guest' ? <Navigate to="/login" /> : <Settings role={role} setRole={setRole} />} />
          <Route path="/notifications" element={role === 'guest' ? <Navigate to="/login" /> : <Notifications />} />
          
          <Route path="/reset-password" element={<ResetPassword />} /> 

          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsAndConditions />} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    // 🚨 UPDATED: Moved BrowserRouter to the very top level so AppRoutes can access navigation hooks!
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}