import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext'; 

// Shared UI and Feature Components
import JobCard from '../components/jobs/JobCard';
import JobFormModal from '../components/modals/JobFormModal';
import JobDetailsPane from '../components/jobs/JobDetailsPane';
import SearchBar from '../components/common/SearchBar';
import JobFilters from '../components/common/JobFilters';
import StatusBadge from '../components/common/StatusBadge';

export default function MyJobs() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: currentUser, role } = useAuth(); 

  // Core data and loading state
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [companyProfile, setCompanyProfile] = useState(null);
  
  // Tracks which job is currently selected for the right-hand details pane
  const [selectedJobId, setSelectedJobId] = useState(null);
  
  // 🚨 UPDATED: State initializes from localStorage to remember the last visited tab
  const [companyTab, setCompanyTab] = useState(() => {
    return localStorage.getItem('companyTab') || 'Active';
  });

  // UI filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModality, setFilterModality] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [filterDate, setFilterDate] = useState('All');

  // Modal and submission states
  const [showAddForm, setShowAddForm] = useState(false);
  const [isEditingJob, setIsEditingJob] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Derived state: find the full job object for the currently selected ID
  const selectedJob = jobs.find(job => job.id === selectedJobId);

  // 🚨 NEW: Effect to save the active tab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('companyTab', companyTab);
  }, [companyTab]);

  // Protect the route: ensure only authenticated companies can access this dashboard
  useEffect(() => {
    if (role !== 'company') { 
      navigate('/'); 
      return; 
    }
    fetchMyJobs();
    
    // Automatically select a job if navigated here with a specific job ID in state
    if (location.state?.selectedJobId) {
      setSelectedJobId(location.state.selectedJobId);
    }
  }, [role, navigate, location.state]);

  // Fetches the company's job postings and aggregates related data (location, skills, applicant counts)
  async function fetchMyJobs() {
    setIsLoading(true);
    if (!currentUser) { 
      setIsLoading(false); 
      return; 
    }
    
    // Fetch the company's base profile, their jobs (with locations and skills), and all relevant applications
    const { data: companyData } = await supabase.from('companies').select('*').eq('id', currentUser.id).single();
    const { data: jobsData } = await supabase.from('jobs').select('*, locations(city, country), job_skills(skills(id, name))').eq('company_id', currentUser.id).order('created_at', { ascending: false });
    const { data: appsData } = await supabase.from('applications').select('job_id');

    if (companyData) {
      setCompanyProfile(companyData);
    }

    if (jobsData && companyData) {
      // Map the relational database structure into a flat, UI-friendly format
      const mappedJobs = jobsData.map(job => {
        // Calculate total applicants for this specific job
        const applicantCount = appsData ? appsData.filter(app => app.job_id === job.id).length : 0;
        const formattedSkills = job.job_skills ? job.job_skills.map(js => ({ id: js.skills.id, name: js.skills.name })) : [];

        return {
          ...job,
          location: job.locations?.city ? job.locations.city : '',
          skills: formattedSkills,
          company: companyData.name,
          is_deaf_accessible: companyData.is_deaf_accessible || false,
          applicantCount: applicantCount,
          date: new Date(job.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        };
      });
      setJobs(mappedJobs);
    }
    setIsLoading(false);
  }

  // Handles the creation of a new job posting, enforcing limits and managing relational data
  async function handlePostJob(formData) {
    if (!currentUser) return;
    
    // Limit increased to 5 postings
    if (jobs.length >= 5) return alert("You have reached the maximum limit of 5 job postings.");

    setIsSubmitting(true);
    const { skills, location: jobLocationString, ...jobDetails } = formData;
    
    // 1. Create a new location record in the database if a location was provided
    let locationId = null;
    if (jobLocationString && jobLocationString.trim() !== '') {
        const { data: locData, error: locError } = await supabase
          .from('locations')
          .insert([{ 
            city: jobLocationString.trim(), 
            country: 'Not specified' 
          }])
          .select()
          .single();
          
        if (locData) {
            locationId = locData.id;
        } else {
             console.error("Location saving error", locError);
        }
    }

    // 2. Insert the main job record using the generated location_id
    const { data: newJob, error: jobError } = await supabase
      .from('jobs')
      .insert([{ ...jobDetails, location_id: locationId, company_id: currentUser.id, status: 'Pending' }])
      .select()
      .single();
    
    if (jobError) {
      alert("Failed to post job: " + jobError.message);
      setIsSubmitting(false);
      return;
    }

    // 3. Map the selected skills to the new job in the junction table
    if (skills && skills.length > 0) {
      await supabase.from('job_skills').insert(skills.map(skill => ({ job_id: newJob.id, skill_id: skill.id })));
    }
    
    setShowAddForm(false); 
    fetchMyJobs(); 
    alert("Job posted successfully! It is now pending admin approval.");
    setIsSubmitting(false);
  }

  // Handles modifying an existing job posting, tracking edit limits to prevent abuse
  async function handleUpdateJob(formData) {
    setIsSubmitting(true);
    const currentEditCount = selectedJob.edit_count || 0;
    
    // Platform limitation: restrict the number of times a single job post can be heavily edited
    if (currentEditCount >= 3) {
      alert("This job post has already reached its edit limit.");
      setIsSubmitting(false);
      return;
    }

    const { skills, location: jobLocationString, ...jobDetails } = formData;
    
    let locationId = selectedJob.location_id; 

    // Only create a new location database record if the string was actually changed, avoiding bloat
    if (jobLocationString && jobLocationString.trim() !== selectedJob.location) {
        const { data: locData } = await supabase
          .from('locations')
          .insert([{ 
            city: jobLocationString.trim(), 
            country: 'Not specified' 
          }])
          .select()
          .single();
          
        if (locData) {
            locationId = locData.id;
        }
    }

    // 1. Update the core job record and increment the edit counter
    const { error: jobError } = await supabase
      .from('jobs')
      .update({ ...jobDetails, location_id: locationId, edit_count: currentEditCount + 1 })
      .eq('id', selectedJob.id);
    
    if (jobError) {
      alert("Failed to update job: " + jobError.message);
      setIsSubmitting(false);
      return;
    }

    // 2. Overwrite the job's skills by clearing out old ones and inserting the new selection
    await supabase.from('job_skills').delete().eq('job_id', selectedJob.id);
    if (skills && skills.length > 0) {
      await supabase.from('job_skills').insert(skills.map(skill => ({ job_id: selectedJob.id, skill_id: skill.id })));
    }

    setIsEditingJob(false); 
    fetchMyJobs(); 
    setIsSubmitting(false);
  }

  // Permanently deletes a job posting from the database
  async function handleDeleteJob() {
    if (!window.confirm("Are you sure you want to delete this job posting? This action cannot be undone.")) return;
    const { error } = await supabase.from('jobs').delete().eq('id', selectedJob.id);
    
    if (!error) { 
      setJobs(jobs.filter(job => job.id !== selectedJob.id)); 
      setSelectedJobId(null); 
    } else {
      alert("Failed to delete job.");
    }
  }

  // Master filtering logic for the job list view
  const filteredJobs = jobs.filter(job => {
    // Calculate if the job's deadline has passed
    const isDeadlinePassed = job.closing_date 
      ? new Date(job.closing_date) < new Date(new Date().setHours(0,0,0,0)) 
      : false;

    // Filter jobs based on Active, Archived, or All tabs
    if (companyTab === 'Active') {
      if (isDeadlinePassed || job.status === 'Rejected' || job.status === 'Archived') return false; 
    } else if (companyTab === 'Archived') {
      if (!isDeadlinePassed && job.status !== 'Rejected' && job.status !== 'Archived') return false;
    }
    // If companyTab === 'All', we don't return false for any status/deadline

    const matchesSearch = (job.title || '').toLowerCase().includes(searchQuery.toLowerCase());
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

  return (
    <div className="page-container-wide">
      
      {/* --- MODALS --- */}
      <JobFormModal isOpen={showAddForm} onClose={() => setShowAddForm(false)} onSubmit={handlePostJob} isSubmitting={isSubmitting} />
      <JobFormModal isOpen={isEditingJob} onClose={() => setIsEditingJob(false)} onSubmit={handleUpdateJob} initialData={selectedJob} isEditing={true} isSubmitting={isSubmitting} />

      {/* --- HEADER & FILTERS --- */}
      <div className="flex-between align-center mb-24">
        <h1 className="m-0">My Postings</h1>
      </div>

      {/* Company Tabs for All, Active, and Archived */}
      <div className="flex-row gap-8 mb-24" style={{ overflowX: 'auto', borderBottom: '1px solid var(--border-color)' }}>
        {['All', 'Active', 'Archived'].map(tab => (
          <button
            key={tab} 
            onClick={() => { setCompanyTab(tab); setSelectedJobId(null); }}
            style={{
              padding: '8px 20px', border: 'none', background: 'none',
              borderBottom: companyTab === tab ? '2px solid var(--primary-color)' : '2px solid transparent',
              color: companyTab === tab ? 'var(--primary-color)' : 'var(--secondary-text)',
              fontWeight: companyTab === tab ? '600' : '400', cursor: 'pointer', fontSize: '1rem',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="mb-16">
        <SearchBar value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search your job titles..." />
      </div>
      
      <div className="flex-between align-center mb-32">
        <JobFilters 
          filterModality={filterModality} setFilterModality={setFilterModality}
          filterType={filterType} setFilterType={setFilterType}
          filterDate={filterDate} setFilterDate={setFilterDate}
        />
        
        {/* Job Posting Limit Indicator increased to 5 */}
        {!isLoading && (
          <div className="flex-col" style={{ alignItems: 'flex-end' }}>
            <button 
              className="btn-black" 
              onClick={() => setShowAddForm(true)}
              disabled={jobs.length >= 5}
              style={{ opacity: jobs.length >= 5 ? 0.5 : 1, cursor: jobs.length >= 5 ? 'not-allowed' : 'pointer' }}
            >
              + Post a Job
            </button>
            <span className="text-sm text-secondary mt-4 font-bold">
              {jobs.length}/5 Posts Used
            </span>
          </div>
        )}
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      {!selectedJobId ? (
        // VIEW MODE 1: Standard List View (No job selected)
        <div>
          {isLoading ? (
            <p className="text-center text-secondary p-20">Loading your postings...</p>
          ) : filteredJobs.length > 0 ? (
            <div className="flex-col gap-16">
              {filteredJobs.map(job => (
                <div key={job.id} style={{ position: 'relative' }}>
                  
                  {/* Overlay Badges for List View */}
                  <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 2, display: 'flex', gap: '8px', pointerEvents: 'none' }}>
                    <StatusBadge status={job.status || 'Pending'} />
                    {job.applicantCount > 0 && (
                      <div className="badge badge-primary">
                        {job.applicantCount} {job.applicantCount === 1 ? 'Applicant' : 'Applicants'}
                      </div>
                    )}
                  </div>

                  <JobCard job={job} companyData={companyProfile} isSelected={false} onClick={() => setSelectedJobId(job.id)} />
                </div>
              ))}
            </div>
          ) : (
            <div className="card text-center text-secondary p-32">
              <h3 className="mb-8">No jobs found</h3><p>You haven't posted any jobs that match this search.</p>
            </div>
          )}
        </div>
      ) : (
        // VIEW MODE 2: Split-Pane Detail View (A job is selected)
        <div className="jobs-split-layout active-split">
          
          {/* Left Column: Narrow scrollable job list */}
          <div className="jobs-list-column">
            <div className="flex-col gap-12">
              {filteredJobs.length > 0 ? filteredJobs.map(job => (
                <div key={job.id} style={{ position: 'relative' }}>
                  
                  {/* Overlay Badges for Split View */}
                  <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 2, display: 'flex', gap: '8px', pointerEvents: 'none' }}>
                    {job.id !== selectedJobId && (
                      <StatusBadge status={job.status || 'Pending'} />
                    )}
                    {job.applicantCount > 0 && job.id !== selectedJobId && (
                      <div className="badge badge-primary">{job.applicantCount}</div>
                    )}
                  </div>

                  <JobCard job={job} companyData={companyProfile} isSelected={job.id === selectedJobId} onClick={() => setSelectedJobId(job.id)} />
                </div>
              )) : <p className="text-center text-secondary p-20">No matching jobs.</p>}
            </div>
          </div>

          {/* Right Column: Full job details and management actions */}
          <div className="job-details-column">
            <JobDetailsPane
              selectedJob={selectedJob}
              selectedCompany={companyProfile}
              role={role}
              currentUser={currentUser}
              handleDeleteJob={handleDeleteJob}
              setIsEditingJob={setIsEditingJob}
              navigate={navigate}
              handleClose={() => setSelectedJobId(null)} 
            />
          </div>
        </div>
      )}
    </div>
  );
}