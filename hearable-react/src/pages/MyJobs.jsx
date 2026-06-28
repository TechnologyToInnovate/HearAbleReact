import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import JobCard from '../components/JobCard';
import TagList from '../components/TagList';
import JobFormModal from '../components/JobFormModal';
import { useAuth } from '../context/AuthContext'; // 🚨 NEW: Global Auth!

export default function MyJobs() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 🚨 1. Pull auth instantly
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
    
    if (!currentUser) {
      setIsLoading(false);
      return;
    }
    
    // 🚨 2. We already have currentUser, skip fetching the session!
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
    setIsSubmitting(true);
    const { error } = await supabase.from('jobs').insert([{ ...formData, company_id: currentUser.id, skills: [] }]);
    
    if (!error) {
      setShowAddForm(false);
      fetchMyJobs(); 
    } else alert("Failed to post job.");
    setIsSubmitting(false);
  }

  async function handleUpdateJob(formData) {
    setIsSubmitting(true);
    const { error } = await supabase.from('jobs').update(formData).eq('id', selectedJob.id);
    
    if (!error) {
      setIsEditingJob(false);
      fetchMyJobs(); 
    } else alert("Failed to update job.");
    setIsSubmitting(false);
  }

  async function handleDeleteJob() {
    if (!window.confirm("Are you sure you want to delete this job posting? This action cannot be undone.")) return;
    const { error } = await supabase.from('jobs').delete().eq('id', selectedJob.id);
    if (!error) { setJobs(jobs.filter(job => job.id !== selectedJob.id)); setSelectedJobId(null); } else alert("Failed to delete job.");
  }

  const filteredJobs = jobs.filter(job => {
    // 🚨 3. Restored crash fix: Safely fallback to an empty string if job.title is missing
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

      {!selectedJobId ? (
        <div>
          <h1 className="mb-16 m-0">My Postings</h1>
          <div className="search-box-wrapper mb-16 w-full">
            <span className="search-icon">🔍</span>
            <input type="text" placeholder="Search your job titles..." className="search-input" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          
          <div className="flex-between align-center mb-32">
            <div className="flex-row-wrap gap-8">
              <select className="search-input text-sm" style={{ width: 'auto' }} value={filterModality} onChange={(e) => setFilterModality(e.target.value)}>
                <option value="All">🏢 All Modalities</option><option value="On-site">On-site</option><option value="Hybrid">Hybrid</option><option value="Remote">Remote</option>
              </select>
              <select className="search-input text-sm" style={{ width: 'auto' }} value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                <option value="All">💼 All Job Types</option><option value="Full-time">Full-time</option><option value="Part-time">Part-time</option><option value="Contract">Contract</option><option value="Internship">Internship</option>
              </select>
              <select className="search-input text-sm" style={{ width: 'auto' }} value={filterDate} onChange={(e) => setFilterDate(e.target.value)}>
                <option value="All">📅 Any Time</option><option value="24h">Past 24 Hours</option><option value="7d">Past Week</option><option value="30d">Past Month</option>
              </select>
            </div>
            <button className="btn-black" onClick={() => setShowAddForm(true)}>+ Post a Job</button>
          </div>
          
          {isLoading ? (
            <p className="text-center text-secondary p-20">Loading your postings...</p>
          ) : filteredJobs.length > 0 ? (
            <div className="flex-col gap-16">
              {filteredJobs.map(job => (
                <div key={job.id} style={{ position: 'relative' }}>
                  {/* 🚨 4. Removed inline badge styling, using global classes */}
                  {job.applicantCount > 0 && (
                    <div className="badge badge-primary" style={{ position: 'absolute', top: '24px', right: '24px', zIndex: 2, pointerEvents: 'none' }}>
                      {job.applicantCount} {job.applicantCount === 1 ? 'Applicant' : 'Applicants'}
                    </div>
                  )}
                  <JobCard job={job} isSelected={false} onClick={() => setSelectedJobId(job.id)} />
                </div>
              ))}
            </div>
          ) : (
            <div className="card text-center text-secondary p-32">
              <div className="text-3xl mb-16">📭</div><h3 className="mb-8">No jobs found</h3><p>You haven't posted any jobs that match this search.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="jobs-split-layout active-split">
          <div className="jobs-list-column">
            <h2 className="mb-16 m-0">My Postings</h2>

            <div className="search-box-wrapper mb-16 w-full">
              <span className="search-icon">🔍</span>
              <input type="text" placeholder="Search your jobs..." className="search-input" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>

            <div className="flex-between align-center mb-24">
              <div className="flex-row gap-8 flex-wrap">
                <select className="search-input text-sm" style={{ width: 'auto' }} value={filterModality} onChange={(e) => setFilterModality(e.target.value)}>
                  <option value="All">🏢 Modalities</option><option value="On-site">On-site</option><option value="Hybrid">Hybrid</option><option value="Remote">Remote</option>
                </select>
                <select className="search-input text-sm" style={{ width: 'auto' }} value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                  <option value="All">💼 Types</option><option value="Full-time">Full-time</option><option value="Part-time">Part-time</option><option value="Contract">Contract</option>
                </select>
              </div>
              <button className="btn-black btn-sm" onClick={() => setShowAddForm(true)}>+ Post</button>
            </div>

            <div className="flex-col gap-12">
              {filteredJobs.length > 0 ? filteredJobs.map(job => (
                <div key={job.id} style={{ position: 'relative' }}>
                  {job.applicantCount > 0 && job.id !== selectedJobId && (
                    <div className="badge badge-primary" style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 2, pointerEvents: 'none' }}>
                      {job.applicantCount}
                    </div>
                  )}
                  <JobCard job={job} isSelected={job.id === selectedJobId} onClick={() => setSelectedJobId(job.id)} />
                </div>
              )) : <p className="text-center text-secondary p-20">No matching jobs.</p>}
            </div>
          </div>

          <div className="job-details-column">
            {selectedJob && (
              <>
                <div className="flex-between mb-8">
                  <div className="flex-row gap-8">
                    <button onClick={() => setIsEditingJob(true)} className="btn-outline btn-sm">⚙️ Edit</button>
                    {/* 🚨 5. Replaced inline red style with your btn-danger class */}
                    <button onClick={handleDeleteJob} className="btn-danger btn-sm">🗑️ Delete</button>
                  </div>
                  {/* 🚨 6. Replaced inline close button style with your close-btn class */}
                  <button onClick={() => setSelectedJobId(null)} className="close-btn">✕</button>
                </div>
                
                <div className="card p-24">
                  <div className="flex-between-start mb-16">
                    <h2 className="m-0">{selectedJob.title}</h2><TagList tags={[selectedJob.work_model || 'On-site', selectedJob.type]} />
                  </div>
                  
                  <div className="flex-row-wrap text-secondary mb-24 gap-12 align-center">
                    {selectedJob.location && <span>📍 {selectedJob.location}</span>}
                    {/* 🚨 7. Swapped inline badge styles for global badge classes */}
                    <span className="badge-neutral">📅 Posted: {selectedJob.date}</span>
                    <span className="badge badge-info">
                      👥 {selectedJob.applicantCount} {selectedJob.applicantCount === 1 ? 'Applicant' : 'Applicants'}
                    </span>
                  </div>
                  
                  <h4 className="mb-8">Job Description</h4>
                  <p style={{ lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{selectedJob.description}</p>
                  
                  {/* 🚨 8. Replaced manual border top with your global divider class */}
                  <div className="divider m-0 mt-32">
                    <button className="btn-black w-full" onClick={() => navigate('/applicants', { state: { filterJobId: selectedJob.id } })} disabled={selectedJob.applicantCount === 0} style={{ opacity: selectedJob.applicantCount === 0 ? 0.5 : 1 }}>
                      {selectedJob.applicantCount === 0 ? 'No Applicants Yet' : `Review ${selectedJob.applicantCount} Applicants`}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}