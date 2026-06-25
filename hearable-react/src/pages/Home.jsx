import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

import StatCard from '../components/StatCard';
import TagList from '../components/TagList';
import CompanyOnboardingModal from '../components/CompanyOnboardingModal'; 

export default function Home({ role }) {
  const navigate = useNavigate();
  
  const [recentJobs, setRecentJobs] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [companyProfile, setCompanyProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [stats, setStats] = useState({ stat1: 0, stat2: 0, stat3: 0, stat4: 0 });
  
  const [showCompanyOnboarding, setShowCompanyOnboarding] = useState(false); 

  useEffect(() => {
    setShowCompanyOnboarding(false);
    fetchDashboardData();
  }, [role]); 

  async function fetchDashboardData() {
    setIsLoading(true);
    setUserProfile(null);
    setCompanyProfile(null);
    
    // Fetch Recent Jobs (everyone sees this)
    const { data: jobsData } = await supabase
      .from('jobs')
      .select('*')
      .order('id', { ascending: false })
      .limit(4);

    if (jobsData) setRecentJobs(jobsData);

    // 1. GUEST DATA
    if (role === 'guest') {
      const { count: jobCount } = await supabase.from('jobs').select('*', { count: 'exact', head: true });
      const { count: companyCount } = await supabase.from('companies').select('*', { count: 'exact', head: true });
      setStats({ stat1: jobCount || 0, stat2: companyCount || 0, stat3: 0, stat4: 0 });
      setIsLoading(false);
      return;
    }

    // 2. ADMIN DATA
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

    // 3. COMPANY DATA
    if (role === 'company') {
      const { data: compData } = await supabase.from('companies').select('*').eq('id', activeId).maybeSingle();
      
      if (compData) {
        setCompanyProfile(compData);

        if (!compData.industry) {
          setShowCompanyOnboarding(true);
        }

        const { count: jobCount } = await supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('company_id', compData.id);
        const { count: appCount } = await supabase.from('applications').select('job_id, jobs!inner(company_id)', { count: 'exact', head: true }).eq('jobs.company_id', compData.id);
        setStats({ stat1: jobCount || 0, stat2: appCount || 0, stat3: 0, stat4: 0 });
      }

    // 4. USER DATA
    } else if (['user', 'pending_user', 'rejected_user'].includes(role)) {
      const { data: userData } = await supabase.from('profiles').select('*').eq('id', activeId).maybeSingle();
      
      if (userData) {
        setUserProfile(userData);

        // 🚨 THE FIX: Check for degree_id instead of major! No more infinite loop!
        if (userData.name === 'New User' || !userData.degree_id) {
          navigate('/onboarding');
          return; 
        }

        const { count: appCount } = await supabase.from('applications').select('*', { count: 'exact', head: true }).eq('applicant_id', userData.id);
        const { count: totalJobsCount } = await supabase.from('jobs').select('*', { count: 'exact', head: true });
        setStats({ stat1: appCount || 0, stat2: totalJobsCount || 0, stat3: 0, stat4: 0 });
      }
    }

    setIsLoading(false);
  }

  function handleCompanyOnboardingComplete() {
    setShowCompanyOnboarding(false);
    fetchDashboardData();
  }

  return (
    <div className="page-container-wide">

      <CompanyOnboardingModal 
        isOpen={showCompanyOnboarding}
        companyData={companyProfile}
        onSuccess={handleCompanyOnboardingComplete}
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

      {role === 'pending_user' && (
        <div className="mb-24 p-16" style={{ background: '#fef9c3', color: '#854d0e', border: '1px solid #fde047', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '1.5rem' }}>⏳</span>
          <div>
            <strong style={{ display: 'block', marginBottom: '4px' }}>Account Under Review</strong>
            <span style={{ fontSize: '0.9rem' }}>You can browse jobs and companies, but you will not have full access to apply until an administrator reviews your profile.</span>
          </div>
        </div>
      )}

      {role === 'rejected_user' && (
        <div className="mb-24 p-16" style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '1.5rem' }}>❌</span>
          <div>
            <strong style={{ display: 'block', marginBottom: '4px' }}>Registration Declined</strong>
            <span style={{ fontSize: '0.9rem' }}>Your account was not approved by the administration. You can view listings but do not have application privileges.</span>
          </div>
        </div>
      )}

      <div className={role === 'admin' ? "flex-col" : "dashboard-layout"} style={{ gap: '32px' }}>
        
        <div style={{ width: '100%' }}>
          
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
                        📍 {job.location}
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
                <p className="text-sm text-secondary mb-24">{userProfile?.headline || 'Talent Profile'}</p>
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