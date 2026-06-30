import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';

// GLOBAL CONTEXT & COMPONENTS
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar'; 

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

// --- ADMIN PAGES ---
import Degrees from './pages/Degrees';
import Batches from './pages/Batches';
import Admins from './pages/Admins';

// MAIN ROUTING LOGIC
function AppRoutes() {
  const { role, setRole } = useAuth();

  // DEFAULT THEME CONFIGURATION
  useEffect(() => {
    const applyTheme = (isDark) => {
      if (isDark) {
        document.body.classList.add('dark-theme');
      } else {
        document.body.classList.remove('dark-theme');
      }
    };

    const storedTheme = localStorage.getItem('theme');

    // Default to light mode if no theme is explicitly saved in local storage
    if (storedTheme) {
      applyTheme(storedTheme === 'dark');
    } else {
      applyTheme(false); 
    }
  }, []);

  return (
    <BrowserRouter>
      <div className="app-container">
        
        <Navbar />

        <main className="main-content" style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
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
            <Route path="/resumes" element={<Resumes />} />
            <Route path="/feedback" element={<Feedbacks />} />

            <Route path="/settings" element={role === 'guest' ? <Navigate to="/login" /> : <Settings role={role} setRole={setRole} />} />
            <Route path="/notifications" element={role === 'guest' ? <Navigate to="/login" /> : <Notifications />} />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

// APP ENTRY POINT (Wraps everything in AuthProvider)
export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}