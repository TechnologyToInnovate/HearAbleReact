import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import JobCard from '../components/JobCard';
import JobFormModal from '../components/JobFormModal';
import JobDetailsPane from '../components/JobDetailsPane'; // 🚨 NEW IMPORT

export default function Jobs() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: currentUser, role } = useAuth(); 

  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null); 
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModality, setFilterModality] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [filterDate, setFilterDate] = useState('All');
  
  const [isApplying, setIsApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [isEditingJob, setIsEditingJob] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedJob = jobs.find(job => job.id === selectedJobId);

  useEffect(() => {
    fetchJobs();
    if (location.state && location.state.selectedJobId) {
      setSelectedJobId(location.state.selectedJobId);
    }
  }, [location.state, currentUser, role]);

  async function fetchJobs() {
    setIsLoading(true);
    const { data } = await supabase.from('jobs').select('*, companies(name)').order('created_at', { ascending: false });
      
    if (data) {
      let mappedJobs = data.map(job => ({
        ...job,
        company: job.companies?.name || 'Unknown Company',
        date: new Date(job.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      }));

      if (currentUser && ['user', 'pending_user', 'rejected_user'].includes(role)) {
        const { data: matchData } = await supabase.rpc('get_job_matches', { target_user_id: currentUser.id });
        
        if (matchData) {
          const matchMap = {};
          matchData.forEach(m => matchMap[m.job_id] = m.match_percentage);
          
          mappedJobs = mappedJobs.map(job => ({
            ...job,
            matchScore: matchMap[job.id] || 0
          }));

          mappedJobs.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
        }
      }

      setJobs(mappedJobs);
    }
    setIsLoading(false);
  }

  useEffect(() => {
    async function fetchJobDetails() {
      setHasApplied(false);
      setIsSaved(false);

      if (selectedJob) {
        const companyRes = await supabase.from('companies').select('*').eq('id', selectedJob.company_id).maybeSingle();
        if (companyRes.data) setSelectedCompany(companyRes.data);

        if (currentUser && currentUser.id) {
          const appRes = await supabase.from('applications').select('*').eq('job_id', selectedJob.id).eq('applicant_id', currentUser.id).maybeSingle();
          if (appRes.data) setHasApplied(true);

          const savedRes = await supabase.from('saved_jobs').select('*').eq('job_id', selectedJob.id).eq('user_id', currentUser.id).maybeSingle();
          if (savedRes.data) setIsSaved(true);
        }
      } else {
        setSelectedCompany(null);
      }
    }
    fetchJobDetails();
  }, [selectedJob, currentUser]);

  async function handleApply() {
    if (!currentUser) {
      alert("Please sign in or create an account to apply for this position!");
      navigate('/login'); return;
    }
    if (['Pending', 'Rejected', 'pending_user', 'rejected_user'].includes(role)) {
      alert("Your account must be approved before applying."); return;
    }

    setIsApplying(true);
    const { error } = await supabase.from('applications').insert([{ job_id: selectedJob.id, applicant_id: currentUser.id }]);
    
    if (!error) {
      setHasApplied(true);
      await supabase.from('notifications').insert([{
        user_id: selectedJob.company_id,
        title: 'New Applicant 🎉',
        message: `A candidate just applied for your ${selectedJob.title} position.`,
        link: '/applicants'
      }]);
    } else {
      console.error(error);
    }
    setIsApplying(false);
  }

  async function handleSaveJob() {
    if (!currentUser) {
      alert("Please sign in to save jobs!");
      navigate('/login'); return;
    }

    setIsSaving(true);
    if (isSaved) {
      const { error } = await supabase.from('saved_jobs').delete().eq('job_id', selectedJob.id).eq('user_id', currentUser.id);
      if (!error) setIsSaved(false);
    } else {
      const { error } = await supabase.from('saved_jobs').insert([{ job_id: selectedJob.id, user_id: currentUser.id }]);
      if (!error) setIsSaved(true);
    }
    setIsSaving(false);
  }

  async function handleUpdateJob(formData) {
    setIsSubmitting(true);
    const { error } = await supabase.from('jobs').update(formData).eq('id', selectedJob.id);
    
    if (!error) { setIsEditingJob(false); fetchJobs(); } 
    else { alert("Failed to update job."); console.error(error); }
    setIsSubmitting(false);
  }

  async function handleDeleteJob() {
    if (!window.confirm("Are you sure you want to delete this job posting? This action cannot be undone.")) return;
    const { error } = await supabase.from('jobs').delete().eq('id', selectedJob.id);
    if (!error) {
      setJobs(jobs.filter(job => job.id !== selectedJob.id));
      setSelectedJobId(null);
    } else alert("Failed to delete job.");
  }

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) || job.company.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesModality = filterModality === 'All' || job.work_model === filterModality;
    const matchesType = filterType === 'All' || job.type === filterType;
    let matchesDate = true;
    if (filterDate !== 'All' && job.created_at) {
      const diffDays = Math.ceil(Math.abs(new Date() - new Date(job.created_at)) / (1000 * 60 * 60 * 24));
      if (filterDate === '24h') matchesDate = diffDays <= 1;
      else if (filterDate === '7d') matchesDate = diffDays <= 7;
      else if (filterDate === '30d') matchesDate = diffDays <= 30;
    }
    return matchesSearch && matchesModality && matchesType && matchesDate;
  });

  return (
    <div className="page-container-wide">
      
      <JobFormModal isOpen={isEditingJob} onClose={() => setIsEditingJob(false)} onSubmit={handleUpdateJob} initialData={selectedJob} isEditing={true} isSubmitting={isSubmitting} />

      <div className="search-box-wrapper mb-16 w-full">
        <span className="search-icon">🔍</span>
        <input type="text" placeholder="Search jobs or companies..." className="search-input" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
      </div>
      
      <div className="flex-between-start mb-32">
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
      </div>

      {!selectedJobId ? (
        <div>
          {isLoading ? <p className="text-center text-secondary p-20">Loading jobs...</p> : filteredJobs.length > 0 ? (
            <div className="flex-col">
              {filteredJobs.map(job => ( <JobCard key={job.id} job={job} isSelected={false} onClick={() => setSelectedJobId(job.id)} /> ))}
            </div>
          ) : (
            <div className="card text-center text-secondary p-32">
              <div className="text-3xl mb-16">📭</div><h3 className="mb-8">No jobs found</h3><p>Try adjusting your search or clearing some filters.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="jobs-split-layout active-split">
          <div className="jobs-list-column">
            <div className="flex-col gap-12">
              {filteredJobs.length > 0 ? filteredJobs.map(job => (
                <JobCard key={job.id} job={job} isSelected={job.id === selectedJobId} onClick={() => setSelectedJobId(job.id)} />
              )) : <p className="text-center text-secondary p-20">No matching jobs.</p>}
            </div>
          </div>

          <div className="job-details-column">
            {/* 🚨 REPLACED HUNDREDS OF LINES WITH OUR NEW COMPONENT */}
            <JobDetailsPane
              selectedJob={selectedJob}
              selectedCompany={selectedCompany}
              role={role}
              currentUser={currentUser}
              isApplying={isApplying}
              hasApplied={hasApplied}
              isSaved={isSaved}
              isSaving={isSaving}
              handleApply={handleApply}
              handleSaveJob={handleSaveJob}
              handleDeleteJob={handleDeleteJob}
              setIsEditingJob={setIsEditingJob}
              navigate={navigate}
            />
          </div>
        </div>
      )}
    </div>
  );
}