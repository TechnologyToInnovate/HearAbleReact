import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import JobCard from '../components/JobCard';
import JobFormModal from '../components/JobFormModal';
import JobDetailsPane from '../components/JobDetailsPane';
import { useAuth } from '../context/AuthContext'; 

export default function MyJobs() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: currentUser, role } = useAuth(); 

  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModality, setFilterModality] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [filterDate, setFilterDate] = useState('All');

  const [showAddForm, setShowAddForm] = useState(false);
  const [isEditingJob, setIsEditingJob] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedJob = jobs.find(job => job.id === selectedJobId);

  useEffect(() => {
    if (role !== 'company') { navigate('/'); return; }
    fetchMyJobs();
    if (location.state && location.state.selectedJobId) {
      setSelectedJobId(location.state.selectedJobId);
    }
  }, [role, navigate, location.state]);

  async function fetchMyJobs() {
    setIsLoading(true);
    if (!currentUser) { setIsLoading(false); return; }
    
    const { data: companyData } = await supabase.from('companies').select('*').eq('id', currentUser.id).single();
    const { data: jobsData } = await supabase.from('jobs').select('*').eq('company_id', currentUser.id).order('created_at', { ascending: false });
    const { data: appsData } = await supabase.from('applications').select('job_id');

    if (jobsData && companyData) {
      const mappedJobs = jobsData.map(job => {
        const applicantCount = appsData ? appsData.filter(app => app.job_id === job.id).length : 0;
        return {
          ...job,
          company: companyData.name,
          applicantCount: applicantCount,
          date: new Date(job.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        };
      });
      setJobs(mappedJobs);
    }
    setIsLoading(false);
  }

  async function handlePostJob(formData) {
    if (!currentUser) return;
    
    if (jobs.length >= 3) {
      alert("You have reached the maximum limit of 3 active job postings.");
      return;
    }

    setIsSubmitting(true);
    
    const { error } = await supabase.from('jobs').insert([{ 
      ...formData, 
      company_id: currentUser.id, 
      skills: formData.skills || [],
      status: 'Pending' 
    }]);
    
    if (!error) { 
      setShowAddForm(false); 
      fetchMyJobs(); 
      alert("Job posted successfully! It is now pending admin approval.");
    } else {
      alert("Failed to post job.");
    }
    setIsSubmitting(false);
  }

  async function handleUpdateJob(formData) {
    setIsSubmitting(true);
    
    const currentEditCount = selectedJob.edit_count || 0;
    if (currentEditCount >= 1) {
      alert("This job post has already reached its edit limit.");
      setIsSubmitting(false);
      return;
    }

    const { error } = await supabase.from('jobs').update({
      ...formData,
      edit_count: currentEditCount + 1
    }).eq('id', selectedJob.id);
    
    if (!error) { setIsEditingJob(false); fetchMyJobs(); } 
    else alert("Failed to update job.");
    setIsSubmitting(false);
  }

  async function handleDeleteJob() {
    if (!window.confirm("Are you sure you want to delete this job posting? This action cannot be undone.")) return;
    const { error } = await supabase.from('jobs').delete().eq('id', selectedJob.id);
    if (!error) { setJobs(jobs.filter(job => job.id !== selectedJob.id)); setSelectedJobId(null); } 
    else alert("Failed to delete job.");
  }

  const filteredJobs = jobs.filter(job => {
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
      
      <JobFormModal isOpen={showAddForm} onClose={() => setShowAddForm(false)} onSubmit={handlePostJob} isSubmitting={isSubmitting} />
      <JobFormModal isOpen={isEditingJob} onClose={() => setIsEditingJob(false)} onSubmit={handleUpdateJob} initialData={selectedJob} isEditing={true} isSubmitting={isSubmitting} />

      <div className="search-box-wrapper mb-16 w-full">
        <span className="search-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        </span>
        <input type="text" placeholder="Search your job titles..." className="search-input" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
      </div>
      
      <div className="flex-between align-center mb-32">
        <div className="flex-row-wrap gap-8">
          <select className="search-input text-sm" style={{ width: 'auto' }} value={filterModality} onChange={(e) => setFilterModality(e.target.value)}>
            <option value="All">Modalities</option><option value="On-site">On-site</option><option value="Hybrid">Hybrid</option><option value="Remote">Remote</option>
          </select>
          <select className="search-input text-sm" style={{ width: 'auto' }} value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="All">Types</option><option value="Full-time">Full-time</option><option value="Part-time">Part-time</option><option value="Contract">Contract</option>
          </select>
          <select className="search-input text-sm" style={{ width: 'auto' }} value={filterDate} onChange={(e) => setFilterDate(e.target.value)}>
            <option value="All">Any Time</option><option value="24h">Past 24 Hours</option><option value="7d">Past Week</option><option value="30d">Past Month</option>
          </select>
        </div>
        
        {!isLoading && (
          <div className="flex-col" style={{ alignItems: 'flex-end' }}>
            <button 
              className="btn-black" 
              onClick={() => setShowAddForm(true)}
              disabled={jobs.length >= 3}
              style={{ 
                opacity: jobs.length >= 3 ? 0.5 : 1, 
                cursor: jobs.length >= 3 ? 'not-allowed' : 'pointer' 
              }}
            >
              + Post a Job
            </button>
            <span className="text-sm text-secondary mt-4 font-bold">
              {jobs.length}/3 Posts Used
            </span>
          </div>
        )}
      </div>

      {!selectedJobId ? (
        <div>
          {isLoading ? (
            <p className="text-center text-secondary p-20">Loading your postings...</p>
          ) : filteredJobs.length > 0 ? (
            <div className="flex-col gap-16">
              {filteredJobs.map(job => (
                <div key={job.id} style={{ position: 'relative' }}>
                  
                  <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 2, display: 'flex', gap: '8px', pointerEvents: 'none' }}>
                    <span style={{
                      padding: '4px 8px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold', background: 'var(--card-bg)',
                      border: `1px solid ${job.status === 'Approved' ? '#22c55e' : job.status === 'Rejected' ? '#ef4444' : '#eab308'}`,
                      color: job.status === 'Approved' ? '#16a34a' : job.status === 'Rejected' ? '#dc2626' : '#ca8a04'
                    }}>
                      {job.status || 'Pending'}
                    </span>
                    {job.applicantCount > 0 && (
                      <div className="badge badge-primary">
                        {job.applicantCount} {job.applicantCount === 1 ? 'Applicant' : 'Applicants'}
                      </div>
                    )}
                  </div>

                  <JobCard job={job} isSelected={false} onClick={() => setSelectedJobId(job.id)} />
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
        <div className="jobs-split-layout active-split">
          <div className="jobs-list-column">
            <div className="flex-col gap-12">
              {filteredJobs.length > 0 ? filteredJobs.map(job => (
                <div key={job.id} style={{ position: 'relative' }}>
                  
                  <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 2, display: 'flex', gap: '8px', pointerEvents: 'none' }}>
                    {job.id !== selectedJobId && (
                      <span style={{
                        padding: '2px 6px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 'bold', background: 'var(--card-bg)',
                        border: `1px solid ${job.status === 'Approved' ? '#22c55e' : job.status === 'Rejected' ? '#ef4444' : '#eab308'}`,
                        color: job.status === 'Approved' ? '#16a34a' : job.status === 'Rejected' ? '#dc2626' : '#ca8a04'
                      }}>
                        {job.status === 'Approved' ? 'Appr.' : job.status === 'Rejected' ? 'Rej.' : 'Pend.'}
                      </span>
                    )}
                    {job.applicantCount > 0 && job.id !== selectedJobId && (
                      <div className="badge badge-primary">{job.applicantCount}</div>
                    )}
                  </div>

                  <JobCard job={job} isSelected={job.id === selectedJobId} onClick={() => setSelectedJobId(job.id)} />
                </div>
              )) : <p className="text-center text-secondary p-20">No matching jobs.</p>}
            </div>
          </div>

          <div className="job-details-column">
            <JobDetailsPane
              selectedJob={selectedJob}
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