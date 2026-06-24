import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

import StatCard from '../components/StatCard';
import TagList from '../components/TagList';
import OnboardingModal from '../components/OnboardingModal'; 

export default function Home({ role }) {
  const navigate = useNavigate();
  
  const [recentJobs, setRecentJobs] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [companyProfile, setCompanyProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Expanded stats state to hold the new Admin metrics
  const [stats, setStats] = useState({ stat1: 0, stat2: 0, stat3: 0, stat4: 0 });
  
  const [showOnboarding, setShowOnboarding] = useState(false); 

  useEffect(() => {
    setShowOnboarding(false); 
    fetchDashboardData();
  }, [role]); 

  async function fetchDashboardData() {
    setIsLoading(true);

    if (role === 'pending_user' || role === 'rejected_user') {
      setIsLoading(false);
      return;
    }
    
    const { data: jobsData } = await supabase
      .from('jobs')
      .select('*')
      .order('id', { ascending: false })
      .limit(4);

    if (jobsData) setRecentJobs(jobsData);

    if (role === 'guest') {
      const { count: jobCount } = await supabase.from('jobs').select('*', { count: 'exact', head: true });
      const { count: companyCount } = await supabase.from('companies').select('*', { count: 'exact', head: true });
      setStats({ stat1: jobCount || 0, stat2: companyCount || 0, stat3: 0, stat4: 0 });
      setIsLoading(false);
      return;
    }

    // --- NEW: Admin Data Fetching ---
    if (role === 'admin') {
      const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { count: pendingCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'Pending');
      const { count: companyCount } = await supabase.from('companies').select('*', { count: 'exact', head: true });
      const { count: jobsCount } = await supabase.from('jobs').select('*', { count: 'exact', head: true });
      
      setStats({ 
        stat1: usersCount || 0, 
        stat2: companyCount || 0,
        stat3: pendingCount || 0,
        stat4: jobsCount || 0
      });
      setIsLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setIsLoading(false); return; }
    
    const activeId = user.id;

    if (role === 'company') {
      const { data: compData } = await supabase.from('companies').select('*').eq('id', activeId).maybeSingle();
      
      if (compData) {
        setCompanyProfile(compData);
        const { count: jobCount } = await supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('company', compData.name);
        const { count: appCount } = await supabase.from('applications').select('*', { count: 'exact', head: true }).eq('company', compData.name);
        setStats({ stat1: jobCount || 0, stat2: appCount || 0, stat3: 0, stat4: 0 });
      }

    } else if (role === 'user') {
      const { data: userData } = await supabase.from('profiles').select('*').eq('id', activeId).maybeSingle();
      
      if (userData) {
        setUserProfile(userData);
        if (userData.name === 'New User' || !userData.major) {
          setShowOnboarding(true);
        }
        const { count: appCount } = await supabase.from('applications').select('*', { count: 'exact', head: true }).eq('applicant_id', userData.id);
        const { count: totalJobsCount } = await supabase.from('jobs').select('*', { count: 'exact', head: true });
        setStats({ stat1: appCount || 0, stat2: totalJobsCount || 0, stat3: 0, stat4: 0 });
      }
    }

    setIsLoading(false);
  }

  function handleOnboardingComplete() {
    setShowOnboarding(false);
    fetchDashboardData();
  }

  if (role === 'pending_user') {
    return (
      <div className="card text-center p-20 mt-32" style={{ maxWidth: '600px', margin: '64px auto', padding: '48px 24px' }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⏳</div>
        <h2 className="mb-16">Account Under Review</h2>
        <p className="text-secondary mb-24" style={{ lineHeight: '1.6' }}>
          Your registration has been successfully received, but it is currently waiting for administrator approval. You will gain full access to job postings and companies once approved.
        </p>
        <p className="text-sm" style={{ color: 'var(--primary-color)' }}>Please check back later.</p>
      </div>
    );
  }

  if (role === 'rejected_user') {
    return (
      <div className="card text-center p-20 mt-32" style={{ maxWidth: '600px', margin: '64px auto', padding: '48px 24px', borderColor: '#fecaca', background: '#fef2f2' }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>❌</div>
        <h2 className="mb-16" style={{ color: '#991b1b' }}>Registration Declined</h2>
        <p style={{ color: '#7f1d1d', lineHeight: '1.6' }}>
          Unfortunately, your account registration was not approved by the administration. You do not have access to the platform.
        </p>
      </div>
    );
  }

  return (
    <div className="page-container-wide">

      <OnboardingModal 
        isOpen={showOnboarding} 
        userId={userProfile?.id} 
        onSuccess={handleOnboardingComplete} 
      />

      {role === 'guest' && (
        <div className="card text-center mb-32" style={{ padding: '64px 20px', background: 'var(--primary-color)', color: 'white', border: 'none' }}>
          <h1 style={{ fontSize: '2.5rem', margin: '0 0 16px 0', color: 'white' }}>Discover Your Next Opportunity</h1>
          <p style={{ fontSize: '1.2rem', margin: '0 0 32px 0', opacity: 0.9 }}>
            Connect with top companies and find the perfect role for your skills.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
            <button className="btn-black" style={{ background: 'white', color: 'var(--primary-color)' }} onClick={() => navigate('/jobs')}>Browse Jobs</button>
            <button className="btn-outline" style={{ color: 'white', borderColor: 'white' }} onClick={() => navigate('/companies')}>Explore Companies</button>
          </div>
        </div>
      )}

      {/* Conditionally apply the split dashboard layout vs a full-width column layout for Admin */}
      <div className={role === 'admin' ? "flex-col" : "dashboard-layout"} style={{ gap: '32px' }}>
        
        <div style={{ width: '100%' }}>
          
          {/* --- NEW: Admin Statistics Grid --- */}
          {role === 'admin' && (
            <div className="mb-32">
              <h2 className="mb-24">Platform Overview</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
                <StatCard value={stats.stat1} label="Total Users" isLoading={isLoading} />
                <StatCard value={stats.stat3} label="Pending Approvals" isLoading={isLoading} />
                <StatCard value={stats.stat2} label="Registered Companies" isLoading={isLoading} />
                <StatCard value={stats.stat4} label="Active Job Postings" isLoading={isLoading} />
              </div>
            </div>
          )}

          <div className="card">
            <div className="flex-between mb-16" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0 }}>Recently Posted Jobs</h3>
              <button className="btn-outline btn-sm" onClick={() => navigate('/jobs')}>View All Jobs</button>
            </div>

            {isLoading ? (
              <p className="text-secondary text-center p-20">Loading recent jobs...</p>
            ) : recentJobs.length > 0 ? (
              <div className="flex-col" style={{ gap: 0 }}>
                {recentJobs.map((job, index) => (
                  <div key={job.id} className="flex-between" style={{ padding: '20px 0', borderBottom: index !== recentJobs.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                    <div>
                      <h4 className="text-lg mb-8" style={{ margin: 0 }}>{job.title}</h4>
                      <p className="text-sm text-secondary mb-16" style={{ margin: '4px 0 12px 0' }}>
                        🏢 {job.company} &nbsp;•&nbsp; 📍 {job.location}
                      </p>
                      <TagList tags={[job.work_model || 'On-site', job.type]} />
                    </div>
                    <button className="btn-outline" onClick={() => navigate('/jobs', { state: { selectedJobId: job.id } })}>View Job</button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-secondary text-center p-20">No recent jobs found.</p>
            )}
          </div>
        </div>

        {/* --- Hide the entire right sidebar if the user is an Admin --- */}
        {role !== 'admin' && (
          <div className="flex-col-lg" style={{ position: 'sticky', top: '24px' }}>
            
            {role === 'guest' ? (
              <div className="card text-center p-20">
                <div className="avatar-lg mb-16" style={{ width: '80px', height: '80px', fontSize: '2rem', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--text-color)', color: 'white', borderRadius: '50%' }}>👤</div>
                <h3 className="mb-8">Join Hearable</h3>
                <p className="text-sm text-secondary mb-24">Create an account to apply to jobs and get noticed by companies.</p>
                <button className="btn-black w-full" onClick={() => navigate('/login')}>Sign Up Now</button>
              </div>
            ) : role === 'company' ? (
              <div className="card text-center p-20">
                <div className="avatar-lg mb-16" style={{ width: '80px', height: '80px', fontSize: '2rem', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--primary-color)', color: 'white', borderRadius: '16px' }}>
                  {companyProfile?.name ? companyProfile.name.charAt(0).toUpperCase() : 'C'}
                </div>
                <h3 className="mb-8">{companyProfile?.name}</h3>
                <p className="text-sm text-secondary mb-24">📍 {companyProfile?.address}</p>
                <button className="btn-black w-full" disabled={!companyProfile?.id} onClick={() => navigate(`/company/${companyProfile?.id}`)}>
                  {companyProfile?.id ? 'View Company Profile' : 'No Profile Found'}
                </button>
              </div>
            ) : (
              <div className="card text-center p-20">
                <div className="avatar-lg mb-16" style={{ width: '80px', height: '80px', fontSize: '2rem', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--primary-color)', color: 'white', borderRadius: '50%' }}>
                  {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : 'T'}
                </div>
                <h3 className="mb-8">{userProfile?.name}</h3>
                <p className="text-sm text-secondary mb-24">{userProfile?.major}</p>
                <button className="btn-black w-full" disabled={!userProfile?.id} onClick={() => navigate(`/user/${userProfile?.id}`)}>
                  {userProfile?.id ? 'View Profile' : 'No Profile Found'}
                </button>
              </div>
            )}

            <div className="flex-col">
              <StatCard value={stats.stat1} label={role === 'company' ? 'Active Job Postings' : role === 'guest' ? 'Total Open Jobs' : 'Applications Sent'} isLoading={isLoading} />
              <StatCard value={stats.stat2} label={role === 'company' ? 'Total Applicants' : role === 'guest' ? 'Companies Hiring' : 'Open Jobs'} isLoading={isLoading} />
            </div>

          </div>
        )}

      </div>

    </div>
  );
}