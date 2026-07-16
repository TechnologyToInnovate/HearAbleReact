import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useJobs } from '../hooks/useJobs';

import StatCard from '../components/dashboard/StatCard';
import AdminOverview from '../components/dashboard/AdminOverview';
import RecentApplicantsCard from '../components/dashboard/RecentApplicantsCard';
import RecentJobsCard from '../components/jobs/RecentJobsCard'; 
import CompanyOnboardingModal from '../components/modals/CompanyOnboardingModal'; 
import MatchedJobsWidget from '../components/jobs/MatchedJobsWidget';

import Avatar from '../components/common/Avatar';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatFullName } from '../utils/formatUtils';

export default function Home() {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  
  // Hook to retrieve the global jobs list for the MatchedJobsWidget
  const { jobs: allJobs, isLoading: isJobsLoading } = useJobs(); 
  
  // Dashboard feed state
  const [recentJobs, setRecentJobs] = useState([]);
  const [recentApplicants, setRecentApplicants] = useState([]);
  
  // Profile state for displaying user/company specific sidebars
  const [userProfile, setUserProfile] = useState(null);
  const [companyProfile, setCompanyProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Statistics state used by the sidebar StatCards
  const [stats, setStats] = useState({ stat1: 0, stat2: 0, stat3: 0, stat4: 0 });
  const [adminStats, setAdminStats] = useState({ users: 0, pendingUsers: 0, companies: 0, activeJobs: 0, pendingJobs: 0 });
  
  // UI toggles
  const [showCompanyOnboarding, setShowCompanyOnboarding] = useState(false); 
  const [showPendingDropdown, setShowPendingDropdown] = useState(false);

  // Re-fetch dashboard data whenever the user or their role changes
  useEffect(() => {
    setShowCompanyOnboarding(false);
    fetchDashboardData();
  }, [role, user]); 

  // Core data fetching function that branches based on user role
  async function fetchDashboardData() {
    setIsLoading(true);
    setUserProfile(null);
    setCompanyProfile(null);
    
    const activeId = user?.id;

    // --- ADMIN DASHBOARD ---
    // Admins need system-wide aggregates for their overview panel
    if (role === 'admin') {
      const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { count: pendingUsersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'Pending');
      const { count: companyCount } = await supabase.from('companies').select('*', { count: 'exact', head: true });
      const { count: activeJobsCount } = await supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'Approved');
      const { count: pendingJobsCount } = await supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'Pending');
      
      setAdminStats({ 
        users: usersCount || 0, 
        pendingUsers: pendingUsersCount || 0,
        companies: companyCount || 0,
        activeJobs: activeJobsCount || 0,
        pendingJobs: pendingJobsCount || 0
      });
      setIsLoading(false);
      return;
    }

    // --- COMPANY DASHBOARD ---
    // Companies need to see their own job stats and recent applicants
    if (role === 'company' && activeId) {
      const { data: compData } = await supabase.from('companies').select('*').eq('id', activeId).maybeSingle();
      
      if (compData) {
        setCompanyProfile(compData);

        // Prompt the company to finish onboarding if their industry is missing
        if (!compData.industry) {
          setShowCompanyOnboarding(true);
        }

        // Aggregate statistics for the company's active jobs and total received applications
        const { count: jobCount } = await supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('company_id', compData.id);
        const { count: appCount } = await supabase.from('applications').select('job_id, jobs!inner(company_id)', { count: 'exact', head: true }).eq('jobs.company_id', compData.id);
        setStats({ stat1: jobCount || 0, stat2: appCount || 0, stat3: 0, stat4: 0 });

        // Fetch the 4 most recent applications sent to this company's job postings
        const { data: appsData } = await supabase
          .from('applications')
          .select(`
            id,
            created_at,
            status,
            profiles ( id, first_name, last_name, email ),
            jobs!inner ( id, title, company_id )
          `)
          .eq('jobs.company_id', compData.id)
          .order('created_at', { ascending: false })
          .limit(4);

        if (appsData) {
          const mappedApps = appsData.map(app => ({
            ...app,
            profiles: {
              ...app.profiles,
              name: formatFullName(app.profiles?.first_name, app.profiles?.last_name, 'Unknown User')
            }
          }));
          setRecentApplicants(mappedApps);
        }
      }
      setIsLoading(false);
      return;
    }

    // --- STANDARD USER & GUEST DASHBOARD ---
    
    // Fetch the 4 most recent active jobs for the public feed, including nested location/company data
    const { data: jobsData } = await supabase
      .from('jobs')
      .select(`
        *,
        locations ( city ),
        companies ( name, is_deaf_accessible, locations ( city ) )
      `)
      .eq('status', 'Approved')
      .order('created_at', { ascending: false })
      .limit(4);

    if (jobsData) {
      const formattedJobs = jobsData.map(job => ({
        ...job, 
        // Safely extract the city from the job's location, falling back to the company's default location
        location: job.locations?.city || job.companies?.locations?.city || 'Location not specified',
        company: job.companies?.name || 'Unknown Company',
        is_deaf_accessible: job.is_deaf_accessible || job.companies?.is_deaf_accessible
      }));
      setRecentJobs(formattedJobs);
    }

    // Guests see platform-wide stats (total jobs, total companies)
    if (role === 'guest') {
      const { count: jobCount } = await supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'Approved');
      const { count: companyCount } = await supabase.from('companies').select('*', { count: 'exact', head: true });
      setStats({ stat1: jobCount || 0, stat2: companyCount || 0, stat3: 0, stat4: 0 });
    } 
    // Logged-in users see their personal stats (applications sent, total available jobs)
    else if (['user', 'pending_user', 'rejected_user'].includes(role) && activeId) {
      const { data: userData } = await supabase.from('profiles').select('*').eq('id', activeId).maybeSingle();
      
      if (userData) {
        setUserProfile(userData);

        // Redirect incomplete user profiles to the onboarding flow
        if (!userData.first_name || !userData.degree_id) {
          navigate('/onboarding');
          return; 
        }

        const { count: appCount } = await supabase.from('applications').select('*', { count: 'exact', head: true }).eq('applicant_id', userData.id);
        const { count: totalJobsCount } = await supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'Approved');
        setStats({ stat1: appCount || 0, stat2: totalJobsCount || 0, stat3: 0, stat4: 0 });
      }
    }

    setIsLoading(false);
  }

  // Refreshes dashboard data after a company completes their initial profile setup
  function handleCompanyOnboardingComplete() {
    setShowCompanyOnboarding(false);
    fetchDashboardData();
  }

  // Navigates directly to a specific job's detail view
  const handleGoToJob = (jobId) => {
    navigate('/jobs', { state: { selectedJobId: jobId } });
  };

  if (isLoading && role === 'admin') {
     return <div className="page-container-wide mt-32"><LoadingSpinner message="Loading dashboard..." /></div>;
  }

return (
    <div className="page-container-wide">

      {/* Onboarding modal presented to newly registered companies */}
      <CompanyOnboardingModal 
        isOpen={showCompanyOnboarding}
        companyData={companyProfile}
        onSuccess={handleCompanyOnboardingComplete}
      />

      {/* Hero Banner for Unauthenticated Guests */}
      {role === 'guest' && (
        <div className="card text-center mb-32 p-32" style={{ backgroundColor: 'var(--primary-color)', color: 'var(--bg-color)', border: 'none' }}>
          <h1 className="text-3xl m-0 mb-16" style={{ color: 'var(--bg-color)' }}>
            Discover Your Next Opportunity
          </h1>
          <p className="text-lg m-0 mb-32" style={{ color: 'var(--bg-color)', opacity: 0.9 }}>
            Connect with top companies and find the perfect role for your skills.
          </p>
          
          {/* 🚨 UPDATED: Added mobile-action-group to stack buttons seamlessly on smaller screens */}
          <div className="flex-row gap-16 align-center mobile-action-group" style={{ justifyContent: 'center' }}>
            <button onClick={() => navigate('/jobs')} style={{ backgroundColor: 'var(--card-bg)', color: 'var(--primary-color)', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
              Browse Jobs
            </button>
            <button onClick={() => navigate('/companies')} style={{ backgroundColor: 'transparent', color: 'var(--bg-color)', border: '2px solid var(--bg-color)', padding: '10px 24px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
              Explore Companies
            </button>
          </div>
        </div>
      )}

      {/* Main Dashboard Layout structure */}
      <div className={role === 'admin' ? "flex-col" : "dashboard-layout"}>
        
        <div className="w-full">
          {/* Admin Dashboard View */}
          {role === 'admin' && (
            <AdminOverview 
              adminStats={adminStats}
              showPendingDropdown={showPendingDropdown}
              setShowPendingDropdown={setShowPendingDropdown}
              navigate={navigate}
              isLoading={isLoading}
            />
          )}

          {/* Standard User & Company Dashboard Views */}
          {role !== 'admin' && (
            <div className="flex-col gap-24">
              
              {/* Display personalized job matches for approved or pending users */}
              {(role === 'user' || role === 'pending_user') && !isJobsLoading && allJobs?.length > 0 && (
                <MatchedJobsWidget jobs={allJobs} onSelectJob={handleGoToJob} />
              )}

              <div className="card">
                {/* Companies see recent applicants; users/guests see recent job postings */}
                {role === 'company' ? (
                  <RecentApplicantsCard 
                    recentApplicants={recentApplicants} 
                    isLoading={isLoading} 
                    navigate={navigate} 
                  />
                ) : (
                  <RecentJobsCard 
                    recentJobs={recentJobs} 
                    isLoading={isLoading} 
                    navigate={navigate} 
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Component (Hidden for Admins) */}
        {role !== 'admin' && (
          <div className="dashboard-sidebar">
            
            {/* Sidebar Profile Summary Cards */}
            {role === 'guest' ? (
              <div className="card text-center p-24">
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                  <Avatar fallbackName="Guest" size="lg" type="user" />
                </div>
                <h3 className="m-0 mb-8">Join Hearable</h3>
                <p className="text-sm text-secondary m-0 mb-24">Create an account to apply to jobs and get noticed by companies.</p>
                <button className="btn-black w-full" onClick={() => navigate('/login')}>Sign Up Now</button>
              </div>
            ) : role === 'company' ? (
              <div className="card text-center p-24">
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                  <Avatar src={companyProfile?.logo_url} fallbackName={companyProfile?.name || 'Company'} size="lg" type="company" />
                </div>
                <h3 className="m-0 mb-8">{companyProfile?.name}</h3>
                <p className="text-sm text-secondary m-0 mb-24">{companyProfile?.address}</p>
                <button className="btn-black w-full" disabled={!companyProfile?.id} onClick={() => navigate(`/company/${companyProfile?.id}`)}>
                  {companyProfile?.id ? 'View Company Profile' : 'No Profile Found'}
                </button>
              </div>
            ) : (
              <div className="card text-center p-24">
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                  <Avatar 
                    src={userProfile?.profile_pic} 
                    fallbackName={formatFullName(userProfile?.first_name, userProfile?.last_name, 'User')} 
                    size="lg" 
                    type="user" 
                  />
                </div>
                <h3 className="m-0 mb-8">
                  {formatFullName(userProfile?.first_name, userProfile?.last_name, 'Incomplete Profile')}
                </h3>
                <p className="text-sm text-secondary m-0 mb-24">{userProfile?.headline || 'Talent Profile'}</p>
                <button className="btn-black w-full" disabled={!userProfile?.id} onClick={() => navigate(`/user/${userProfile?.id}`)}>
                  {userProfile?.id ? 'View Profile' : 'No Profile Found'}
                </button>
              </div>
            )}

            {/* Sidebar Quick Stats */}
            <div className="flex-col gap-16">
              <StatCard value={stats.stat1} label={role === 'company' ? 'Active Job Postings' : role === 'guest' ? 'Total Open Jobs' : 'Applications Sent'} isLoading={isLoading} />
              <StatCard value={stats.stat2} label={role === 'company' ? 'Total Applicants' : role === 'guest' ? 'Companies Hiring' : 'Open Jobs'} isLoading={isLoading} />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}