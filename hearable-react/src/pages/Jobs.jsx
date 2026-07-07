import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

import { useJobs } from '../hooks/useJobs';
import JobCard from '../components/jobs/JobCard';
import JobDetailsPane from '../components/jobs/JobDetailsPane';
import SearchBar from '../components/common/SearchBar';
import JobFilters from '../components/common/JobFilters';
import './Jobs.css'; 

export default function Jobs() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: currentUser, role } = useAuth();

  // Fetch the global list of jobs and companies using a custom hook
  const { jobs, companies, isLoading, setJobs } = useJobs();

  // --- INTERACTION STATE ---
  // Tracks which job is currently selected for the right-hand details pane
  const [selectedJobId, setSelectedJobId] = useState(null);
  
  // Tracks user-specific job interactions
  const [savedJobs, setSavedJobs] = useState([]);
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  // --- FILTERING STATE ---
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModality, setFilterModality] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [filterDate, setFilterDate] = useState('All');
  
  // Admins have an additional filter to view jobs by approval status
  const [adminStatusFilter, setAdminStatusFilter] = useState('Approved'); 

  // Load user data on mount and handle incoming navigation state (e.g., linking directly to a job)
  useEffect(() => {
    if (currentUser) fetchUserData();
    if (location.state?.selectedJobId) setSelectedJobId(location.state.selectedJobId);
  }, [currentUser, location.state]);

  // Auto-select the first job in the list on desktop views if none is selected
  useEffect(() => {
    if (!isLoading && (jobs || []).length > 0 && !selectedJobId && window.innerWidth > 768) {
      const firstVisible = filteredJobs[0];
      if (firstVisible) setSelectedJobId(firstVisible.id);
    }
  }, [isLoading, jobs, selectedJobId, adminStatusFilter]);

  // Retrieves the IDs of jobs the current user has saved or applied to
  async function fetchUserData() {
    // Only standard users need this data; skip for guests, companies, and admins
    if (['guest', 'company', 'admin'].includes(role)) return;
    
    const { data: saved } = await supabase.from('saved_jobs').select('job_id').eq('user_id', currentUser.id);
    const { data: applied } = await supabase.from('applications').select('job_id').eq('applicant_id', currentUser.id);
    
    if (saved) setSavedJobs(saved.map(s => s.job_id));
    if (applied) setAppliedJobs(applied.map(a => a.job_id));
  }

  // Handles submitting a job application
  async function handleApply() {
    if (!currentUser) return navigate('/login');
    if (role !== 'user') return alert("Only approved standard users can apply for jobs.");
    
    setIsApplying(true);
    const { error } = await supabase.from('applications').insert([{ applicant_id: currentUser.id, job_id: selectedJobId }]);

    if (!error) {
      setAppliedJobs([...appliedJobs, selectedJobId]);
      alert("Application sent successfully!");
    } else {
      console.error("Application error:", error);
      alert("Failed to send application. Please try again.");
    }
    setIsApplying(false);
  }

  // Toggles a job in the user's saved jobs list
  async function handleSaveJob() {
    if (!currentUser) return navigate('/login');
    if (!['user', 'pending_user', 'rejected_user'].includes(role)) return;
    
    setIsSaving(true);
    const isCurrentlySaved = savedJobs.includes(selectedJobId);

    if (isCurrentlySaved) {
      // Remove from saved jobs
      const { error } = await supabase.from('saved_jobs').delete().match({ user_id: currentUser.id, job_id: selectedJobId });
      if (!error) setSavedJobs(savedJobs.filter(id => id !== selectedJobId));
    } else {
      // Add to saved jobs
      const { error } = await supabase.from('saved_jobs').insert([{ user_id: currentUser.id, job_id: selectedJobId }]);
      if (!error) setSavedJobs([...savedJobs, selectedJobId]);
    }
    setIsSaving(false);
  }

  // Admin function to approve, reject, or pending a job posting
  async function handleUpdateJobStatus(jobId, newStatus) {
    if (role !== 'admin') return;
    const { error } = await supabase.from('jobs').update({ status: newStatus }).eq('id', jobId);
    
    if (!error) {
      // Optimistically update the local state
      setJobs(jobs?.map(j => j.id === jobId ? { ...j, status: newStatus } : j));
      
      // Clear the selection if the admin just rejected a job from the pending queue
      if (newStatus === 'Rejected' && adminStatusFilter === 'Pending') setSelectedJobId(null);
    } else {
      alert("Failed to update job status.");
    }
  }

  // Admin function to completely remove a job from the database
  async function handleDeleteJob() {
    if (role !== 'admin') return;
    if (!window.confirm("Are you sure you want to delete this job posting?")) return;
    
    const { error } = await supabase.from('jobs').delete().eq('id', selectedJobId);
    if (!error) { 
      setJobs(jobs?.filter(job => job.id !== selectedJobId)); 
      setSelectedJobId(null); 
    } else {
      alert("Failed to delete job.");
    }
  }

  // Master filtering logic combining search query, UI dropdowns, and role-based access rules
  const filteredJobs = (jobs || []).filter(job => {
    // Non-admins only see approved jobs
    if (role !== 'admin' && job.status !== 'Approved') return false; 
    
    // Admins can filter by specific statuses (Pending, Approved, Rejected)
    if (role === 'admin' && adminStatusFilter !== 'All' && job.status !== adminStatusFilter) return false;

    // Apply text search
    const matchesSearch = (job.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (job.company || '').toLowerCase().includes(searchQuery.toLowerCase());
                          
    // Apply dropdown filters
    const matchesModality = filterModality === 'All' || job.work_model === filterModality;
    const matchesType = filterType === 'All' || job.type === filterType;
    let matchesDate = true;
    
    if (filterDate !== 'All' && job.created_at) {
      const jobDate = new Date(job.created_at);
      const diffDays = Math.ceil(Math.abs(new Date() - jobDate) / (1000 * 60 * 60 * 24));
      if (filterDate === '24h') matchesDate = diffDays <= 1;
      else if (filterDate === '7d') matchesDate = diffDays <= 7;
      else if (filterDate === '30d') matchesDate = diffDays <= 30;
    }
    
    return matchesSearch && matchesModality && matchesType && matchesDate;
  });

  // Extract the full data objects for the currently selected job and its parent company
  const selectedJobData = jobs?.find(j => j.id === selectedJobId);
  const selectedCompanyData = selectedJobData ? companies?.find(c => c.id === selectedJobData.company_id) : null;

  // Helper function to render the left-hand scrollable list of job cards
  const renderJobList = (jobList) => (
    <div className="flex-col gap-12">
      {jobList.map(job => (
        <div key={job.id} style={{ position: 'relative' }}>
          {/* Admin badge showing how many applicants a job has */}
          {role === 'admin' && job.applicantCount > 0 && (
            <div className="badge badge-primary" style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 2, pointerEvents: 'none' }}>
              {job.applicantCount} {job.applicantCount === 1 ? 'Applicant' : 'Applicants'}
            </div>
          )}
          <JobCard 
            job={job} 
            isSelected={job.id === selectedJobId} 
            onClick={() => {
              setSelectedJobId(job.id);
              // On mobile, automatically scroll to the top to see the opened details pane
              if (window.innerWidth <= 768) window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            hideMatchScore={true}
          />
        </div>
      ))}
    </div>
  );

  return (
    <div className="page-container-wide" style={{ paddingBottom: '24px' }}>
      
      {/* --- PAGE HEADER & CONTROLS --- */}
      <div>
        {role === 'admin' && (
          <>
            <div className="flex-between align-center mb-8" style={{ flexWrap: 'wrap', gap: '16px' }}>
              <h1 className="m-0">Manage Jobs</h1>
            </div>
            
            {/* Admin Navigation: Switch between Jobs and Applicants */}
            <div className="flex-row gap-8 mb-24" style={{ overflowX: 'auto', paddingBottom: '4px', borderBottom: '1px solid var(--border-color)' }}>
              <button
                onClick={() => navigate('/jobs')}
                style={{
                  padding: '8px 20px', border: 'none', background: 'none',
                  borderBottom: '2px solid var(--primary-color)',
                  color: 'var(--primary-color)',
                  fontWeight: '600', cursor: 'pointer', fontSize: '1rem',
                }}
              >
                Job Postings
              </button>
              <button
                onClick={() => navigate('/applicants')}
                style={{
                  padding: '8px 20px', border: 'none', background: 'none',
                  borderBottom: '2px solid transparent',
                  color: 'var(--secondary-text)',
                  fontWeight: '400', cursor: 'pointer', fontSize: '1rem',
                }}
              >
                Applicants
              </button>
            </div>

            {/* Admin Status Filter (Pending/Approved/Rejected) */}
            <div className="flex-row gap-8 mb-16" style={{ background: 'var(--bg-color)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color)', width: 'fit-content' }}>
              {['Pending', 'Approved', 'Rejected', 'All'].map(tab => (
                <button
                  key={tab} onClick={() => { setAdminStatusFilter(tab); setSelectedJobId(null); }}
                  style={{
                    padding: '6px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600',
                    background: adminStatusFilter === tab ? 'var(--card-bg)' : 'transparent',
                    color: adminStatusFilter === tab ? 'var(--text-color)' : 'var(--secondary-text)',
                    boxShadow: adminStatusFilter === tab ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
          </>
        )}
        
        {/* Search Bar */}
        <div className="mb-16">
          <SearchBar 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            placeholder="Search by job title or company..." 
          />
        </div>
        
        {/* Dropdown Filters */}
        <div className="mb-24">
          <JobFilters 
            filterModality={filterModality} setFilterModality={setFilterModality}
            filterType={filterType} setFilterType={setFilterType}
            filterDate={filterDate} setFilterDate={setFilterDate}
          />
        </div>
      </div>

      {/* --- SPLIT PANE LAYOUT --- */}
      <div className={`jobs-split-layout ${selectedJobId ? 'active-split' : ''}`}>
        
        {/* Left Column: Scrollable Job List */}
        <div className="jobs-list-column">
          {isLoading ? (
            <p className="text-center text-secondary p-20">Loading opportunities...</p>
          ) : filteredJobs.length > 0 ? (
            <div className="flex-col gap-24">
              {renderJobList(filteredJobs)}
            </div>
          ) : (
            <div className="card text-center text-secondary p-32">
              <h3 className="m-0 mb-8">{role === 'admin' && adminStatusFilter === 'Pending' ? 'All caught up!' : 'No jobs found'}</h3>
              <p className="m-0">{role === 'admin' && adminStatusFilter === 'Pending' ? 'There are no pending jobs requiring approval.' : 'Try adjusting your search or filters to find what you\'re looking for.'}</p>
            </div>
          )}
        </div>

        {/* Right Column: Job Details View */}
        <div className="job-details-column">
          {selectedJobId && selectedJobData ? (
            <JobDetailsPane
              selectedJob={selectedJobData}
              selectedCompany={selectedCompanyData}
              role={role}
              currentUser={currentUser}
              isApplying={isApplying}
              hasApplied={appliedJobs.includes(selectedJobId)}
              isSaved={savedJobs.includes(selectedJobId)}
              isSaving={isSaving}
              handleApply={handleApply}
              handleSaveJob={handleSaveJob}
              handleDeleteJob={handleDeleteJob} 
              handleUpdateJobStatus={handleUpdateJobStatus}
              navigate={navigate}
              handleClose={() => setSelectedJobId(null)} 
            />
          ) : (
            <div className="card h-full flex-col align-center justify-center text-center text-secondary p-32" style={{ display: window.innerWidth > 768 ? 'flex' : 'none' }}>
              <h3 className="m-0 mb-8" style={{ fontSize: '1.5rem' }}>Select a job</h3>
              <p className="m-0 text-sm">Click on any job posting in the list to view its full details here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}