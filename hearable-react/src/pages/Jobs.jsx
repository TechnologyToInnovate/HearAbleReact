import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import JobCard from '../components/JobCard';
import JobDetailsPane from '../components/JobDetailsPane';
import { useAuth } from '../context/AuthContext';
import './Jobs.css'; 

export default function Jobs() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: currentUser, role } = useAuth();

  const [jobs, setJobs] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState(null);

  const [savedJobs, setSavedJobs] = useState([]);
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterModality, setFilterModality] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [filterDate, setFilterDate] = useState('All');
  
  const [adminStatusFilter, setAdminStatusFilter] = useState('Approved'); 

  useEffect(() => {
    fetchJobs();
    if (currentUser) {
      fetchUserData();
    }
    if (location.state && location.state.selectedJobId) {
      setSelectedJobId(location.state.selectedJobId);
    }
  }, [currentUser, location.state]);

  useEffect(() => {
    if (!isLoading && jobs.length > 0 && !selectedJobId && window.innerWidth > 768) {
      const firstVisible = filteredJobs[0];
      if (firstVisible) setSelectedJobId(firstVisible.id);
    }
  }, [isLoading, jobs, selectedJobId, adminStatusFilter]);

  async function fetchJobs() {
    setIsLoading(true);
    
    // 🚨 UPDATED: Added job_skills relation to the query
    const { data: jobsData } = await supabase
      .from('jobs')
      .select('*, job_skills(skills(id, name))')
      .order('created_at', { ascending: false });
      
    const { data: companiesData } = await supabase.from('companies').select('*');
    const { data: appsData } = await supabase.from('applications').select('job_id');

    if (jobsData) {
      const formattedJobs = jobsData.map(job => {
        const company = companiesData?.find(c => c.id === job.company_id);
        const applicantCount = appsData ? appsData.filter(app => app.job_id === job.id).length : 0;
        
        // 🚨 UPDATED: Map the skills correctly
        const mappedSkills = job.job_skills ? job.job_skills.map(js => ({
          id: js.skills.id,
          name: js.skills.name
        })) : [];
        
        return {
          ...job,
          skills: mappedSkills,
          company: company ? company.name : 'Unknown Company',
          applicantCount: applicantCount,
          date: new Date(job.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        };
      });
      setJobs(formattedJobs);
      setCompanies(companiesData || []);
    }
    setIsLoading(false);
  }

  async function fetchUserData() {
    if (['guest', 'company', 'admin'].includes(role)) return;

    const { data: saved } = await supabase.from('saved_jobs').select('job_id').eq('user_id', currentUser.id);
    const { data: applied } = await supabase.from('applications').select('job_id').eq('user_id', currentUser.id);
    
    if (saved) setSavedJobs(saved.map(s => s.job_id));
    if (applied) setAppliedJobs(applied.map(a => a.job_id));
  }

  async function handleApply() {
    if (!currentUser) return navigate('/login');
    if (role !== 'user') return alert("Only approved standard users can apply for jobs.");
    
    setIsApplying(true);
    const { error } = await supabase.from('applications').insert([{ 
      user_id: currentUser.id, 
      job_id: selectedJobId,
      company_id: jobs.find(j => j.id === selectedJobId)?.company_id
    }]);

    if (!error) {
      setAppliedJobs([...appliedJobs, selectedJobId]);
      alert("Application sent successfully!");
    } else {
      alert("Failed to send application. Please try again.");
    }
    setIsApplying(false);
  }

  async function handleSaveJob() {
    if (!currentUser) return navigate('/login');
    if (!['user', 'pending_user', 'rejected_user'].includes(role)) return;
    
    setIsSaving(true);
    const isCurrentlySaved = savedJobs.includes(selectedJobId);

    if (isCurrentlySaved) {
      const { error } = await supabase.from('saved_jobs').delete().match({ user_id: currentUser.id, job_id: selectedJobId });
      if (!error) setSavedJobs(savedJobs.filter(id => id !== selectedJobId));
    } else {
      const { error } = await supabase.from('saved_jobs').insert([{ user_id: currentUser.id, job_id: selectedJobId }]);
      if (!error) setSavedJobs([...savedJobs, selectedJobId]);
    }
    setIsSaving(false);
  }

  async function handleUpdateJobStatus(jobId, newStatus) {
    if (role !== 'admin') return;
    
    const { error } = await supabase.from('jobs').update({ status: newStatus }).eq('id', jobId);
    
    if (!error) {
      setJobs(jobs.map(j => j.id === jobId ? { ...j, status: newStatus } : j));
      
      if (newStatus === 'Rejected' && adminStatusFilter === 'Pending') {
        setSelectedJobId(null);
      }
    } else {
      alert("Failed to update job status.");
    }
  }

  async function handleDeleteJob() {
    if (role !== 'admin') return;
    if (!window.confirm("Are you sure you want to delete this job posting? This action cannot be undone.")) return;
    
    const { error } = await supabase.from('jobs').delete().eq('id', selectedJobId);
    if (!error) { 
      setJobs(jobs.filter(job => job.id !== selectedJobId)); 
      setSelectedJobId(null); 
    } else {
      alert("Failed to delete job.");
    }
  }

  const filteredJobs = jobs.filter(job => {
    if (role !== 'admin') {
      if (job.status !== 'Approved') return false; 
    } else {
      if (adminStatusFilter !== 'All' && job.status !== adminStatusFilter) return false;
    }

    const matchesSearch = (job.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (job.company || '').toLowerCase().includes(searchQuery.toLowerCase());
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

  const selectedJobData = jobs.find(j => j.id === selectedJobId);
  const selectedCompanyData = selectedJobData ? companies.find(c => c.id === selectedJobData.company_id) : null;

  return (
    <div className="page-container-wide" style={{ paddingBottom: 0, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      <div style={{ flexShrink: 0 }}>
        
        {role === 'admin' && (
          <div className="flex-between align-center mb-16" style={{ flexWrap: 'wrap', gap: '16px' }}>
            <h1 className="m-0">Job Moderation</h1>
            <div className="flex-row gap-8" style={{ background: 'var(--bg-color)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              {['Pending', 'Approved', 'Rejected', 'All'].map(tab => (
                <button
                  key={tab}
                  onClick={() => { setAdminStatusFilter(tab); setSelectedJobId(null); }}
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
          </div>
        )}
        
        <div className="search-box-wrapper mb-16 w-full">
          <span className="search-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </span>
          <input 
            type="text" 
            placeholder="Search by job title or company..." 
            className="search-input" 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
          />
        </div>
        
        <div className="flex-row-wrap gap-8 mb-24">
          <select className="search-input text-sm" style={{ width: 'auto' }} value={filterModality} onChange={(e) => setFilterModality(e.target.value)}>
            <option value="All">Modalities</option>
            <option value="On-site">On-site</option>
            <option value="Hybrid">Hybrid</option>
            <option value="Remote">Remote</option>
          </select>
          <select className="search-input text-sm" style={{ width: 'auto' }} value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="All">Types</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Contract">Contract</option>
            <option value="Internship">Internship</option>
          </select>
          <select className="search-input text-sm" style={{ width: 'auto' }} value={filterDate} onChange={(e) => setFilterDate(e.target.value)}>
            <option value="All">Any Time</option>
            <option value="24h">Past 24 Hours</option>
            <option value="7d">Past Week</option>
            <option value="30d">Past Month</option>
          </select>
        </div>
      </div>

      <div className={`jobs-split-layout ${selectedJobId ? 'active-split' : ''}`} style={{ flex: 1, minHeight: 0, paddingBottom: '24px' }}>
        
        <div className="jobs-list-column" style={{ height: '100%' }}>
          {isLoading ? (
            <p className="text-center text-secondary p-20">Loading opportunities...</p>
          ) : filteredJobs.length > 0 ? (
            <div className="flex-col gap-12">
              {filteredJobs.map(job => (
                <div key={job.id} style={{ position: 'relative' }}>
                  
                  {role === 'admin' && job.applicantCount > 0 && (
                    <div className="badge badge-primary" style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 2, pointerEvents: 'none' }}>
                      {job.applicantCount} {job.applicantCount === 1 ? 'Applicant' : 'Applicants'}
                    </div>
                  )}

                  <JobCard 
                    job={job} 
                    isSelected={job.id === selectedJobId} 
                    onClick={() => setSelectedJobId(job.id)} 
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="card text-center text-secondary p-32">
              <h3 className="m-0 mb-8">{role === 'admin' && adminStatusFilter === 'Pending' ? 'All caught up!' : 'No jobs found'}</h3>
              <p className="m-0">{role === 'admin' && adminStatusFilter === 'Pending' ? 'There are no pending jobs requiring approval.' : 'Try adjusting your search or filters to find what you\'re looking for.'}</p>
            </div>
          )}
        </div>

        <div className="job-details-column" style={{ height: '100%' }}>
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