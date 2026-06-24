import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import JobCard from '../components/JobCard';
import TagList from '../components/TagList';

export default function Jobs({ role }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null); 
  
  // --- SEARCH & FILTER STATE ---
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModality, setFilterModality] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [filterDate, setFilterDate] = useState('All');
  
  const [currentUser, setCurrentUser] = useState(null);
  const [isApplying, setIsApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  // Form States
  const [showAddForm, setShowAddForm] = useState(false);
  const [isEditingJob, setIsEditingJob] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Job Input States
  const [jobTitle, setJobTitle] = useState('');
  const [jobLocation, setJobLocation] = useState('');
  const [jobWorkModel, setJobWorkModel] = useState('On-site');
  const [jobType, setJobType] = useState('Full-time');
  const [jobDescription, setJobDescription] = useState('');

  const selectedJob = jobs.find(job => job.id === selectedJobId);

  useEffect(() => {
    fetchJobs();
    fetchCurrentUser();
    if (location.state && location.state.selectedJobId) {
      setSelectedJobId(location.state.selectedJobId);
    }
  }, [location.state]);

  async function fetchJobs() {
    setIsLoading(true);
    const { data } = await supabase.from('jobs').select('*').order('id', { ascending: false });
    if (data) setJobs(data);
    setIsLoading(false);
  }

  async function fetchCurrentUser() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setCurrentUser(null);
      return;
    }

    // Try finding them in the profiles (Talent) table first
    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
    if (profileData) {
      setCurrentUser(profileData);
      return;
    }

    // If not Talent, try finding them in the companies table
    const { data: companyData } = await supabase.from('companies').select('*').eq('id', session.user.id).maybeSingle();
    if (companyData) {
      setCurrentUser(companyData);
    }
  }

  useEffect(() => {
    async function fetchJobDetails() {
      setHasApplied(false);
      
      if (selectedJob) {
        // Pre-fill the form states in case they click "Edit"
        setJobTitle(selectedJob.title);
        setJobLocation(selectedJob.location);
        setJobWorkModel(selectedJob.work_model || 'On-site');
        setJobType(selectedJob.type);
        setJobDescription(selectedJob.description);

        const companyRes = await supabase.from('companies').select('*').eq('name', selectedJob.company).maybeSingle();
        if (companyRes.data) setSelectedCompany(companyRes.data);

        if (currentUser) {
          const appRes = await supabase.from('applications').select('*').eq('job_id', selectedJob.id).eq('applicant_id', currentUser.id).maybeSingle();
          if (appRes.data) setHasApplied(true);
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
      navigate('/login');
      return;
    }
    setIsApplying(true);
    const { error } = await supabase.from('applications').insert([{
      job_id: selectedJob.id, job_title: selectedJob.title, company: selectedJob.company,
      applicant_id: currentUser.id, applicant_name: currentUser.name, status: 'Under Review'
    }]);

    if (!error) setHasApplied(true);
    setIsApplying(false);
  }

  // --- OPENERS FOR MODALS ---
  function openAddModal() {
    setJobTitle(''); setJobLocation(''); setJobWorkModel('On-site'); setJobType('Full-time'); setJobDescription('');
    setShowAddForm(true);
  }

  function openEditModal() {
    setIsEditingJob(true);
  }

  // --- SAVE / POST LOGIC ---
  async function handlePostJob(e) {
    e.preventDefault();
    if (!currentUser || !currentUser.name) {
      alert("Company profile not found. Please make sure your company name is set.");
      return;
    }

    setIsSubmitting(true);
    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const { error } = await supabase.from('jobs').insert([{
      title: jobTitle, 
      company: currentUser.name, // Automatically assigned!
      location: jobLocation, 
      work_model: jobWorkModel,
      type: jobType, 
      description: jobDescription, 
      skills: [], // Required skills removed
      date: today
    }]);

    if (!error) {
      alert("Job posted successfully!");
      setShowAddForm(false);
      fetchJobs();
    }
    setIsSubmitting(false);
  }

  async function handleUpdateJob(e) {
    e.preventDefault();
    setIsSubmitting(true);

    const updatedJobData = {
      title: jobTitle, 
      location: jobLocation, 
      work_model: jobWorkModel,
      type: jobType, 
      description: jobDescription
    };

    setJobs(jobs.map(job => job.id === selectedJob.id ? { ...job, ...updatedJobData } : job));

    const { error } = await supabase.from('jobs').update(updatedJobData).eq('id', selectedJob.id);

    if (!error) {
      setIsEditingJob(false);
    } else {
      alert("Failed to update job. Check console for details.");
      fetchJobs(); 
    }
    setIsSubmitting(false);
  }

  async function handleDeleteJob() {
    if (!window.confirm("Are you sure you want to delete this job posting? This action cannot be undone.")) return;

    await supabase.from('applications').delete().eq('job_id', selectedJob.id);
    const { error } = await supabase.from('jobs').delete().eq('id', selectedJob.id);
    
    if (!error) {
      setJobs(jobs.filter(job => job.id !== selectedJob.id));
      setSelectedJobId(null);
    } else {
      alert("Failed to delete job.");
      console.error(error);
    }
  }

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          job.company.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesModality = filterModality === 'All' || job.work_model === filterModality;
    const matchesType = filterType === 'All' || job.type === filterType;
    
    let matchesDate = true;
    if (filterDate !== 'All' && job.date) {
      const jobDate = new Date(job.date);
      const now = new Date();
      const diffTime = Math.abs(now - jobDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (filterDate === '24h') matchesDate = diffDays <= 1;
      else if (filterDate === '7d') matchesDate = diffDays <= 7;
      else if (filterDate === '30d') matchesDate = diffDays <= 30;
    }

    return matchesSearch && matchesModality && matchesType && matchesDate;
  });

  return (
    <div className="page-container-wide">
      
      {/* 1. ADD JOB MODAL OVERLAY */}
      {showAddForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div className="card p-0" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-color)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden' }}>
            <div className="flex-between" style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', background: 'var(--card-bg)' }}>
              <h2 style={{ margin: 0 }}>Create a New Job Posting</h2>
              <button onClick={() => setShowAddForm(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-color)' }}>✕</button>
            </div>
            <div style={{ padding: '24px', overflowY: 'auto' }}>
              <form onSubmit={handlePostJob} className="flex-col gap-20">
                <div><label>Job Title *</label><input type="text" className="search-input" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} required /></div>
                <div className="form-grid-3">
                  <div><label>City / Region *</label><input type="text" className="search-input" value={jobLocation} onChange={(e) => setJobLocation(e.target.value)} required /></div>
                  <div><label>Work Model *</label><select className="search-input" value={jobWorkModel} onChange={(e) => setJobWorkModel(e.target.value)}><option value="On-site">On-site</option><option value="Hybrid">Hybrid</option><option value="Remote">Remote</option></select></div>
                  <div><label>Employment Type *</label><select className="search-input" value={jobType} onChange={(e) => setJobType(e.target.value)}><option value="Full-time">Full-time</option><option value="Part-time">Part-time</option><option value="Contract">Contract</option><option value="Internship">Internship</option></select></div>
                </div>
                <div><label>Job Description *</label><textarea className="search-input" style={{ height: '150px', resize: 'vertical' }} value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} required /></div>
                <div style={{ marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
                  <button type="submit" className="btn-black w-full" disabled={isSubmitting}>{isSubmitting ? 'Publishing...' : 'Publish Job Posting'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 2. EDIT JOB MODAL OVERLAY */}
      {isEditingJob && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div className="card p-0" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-color)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden' }}>
            <div className="flex-between" style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', background: 'var(--card-bg)' }}>
              <h2 style={{ margin: 0 }}>Edit Job Posting</h2>
              <button onClick={() => setIsEditingJob(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-color)' }}>✕</button>
            </div>
            <div style={{ padding: '24px', overflowY: 'auto' }}>
              <form onSubmit={handleUpdateJob} className="flex-col gap-20">
                <div><label>Job Title *</label><input type="text" className="search-input" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} required /></div>
                <div className="form-grid-3">
                  <div><label>Location *</label><input type="text" className="search-input" value={jobLocation} onChange={(e) => setJobLocation(e.target.value)} required /></div>
                  <div><label>Work Model *</label><select className="search-input" value={jobWorkModel} onChange={(e) => setJobWorkModel(e.target.value)}><option value="On-site">On-site</option><option value="Hybrid">Hybrid</option><option value="Remote">Remote</option></select></div>
                  <div><label>Type *</label><select className="search-input" value={jobType} onChange={(e) => setJobType(e.target.value)}><option value="Full-time">Full-time</option><option value="Part-time">Part-time</option><option value="Contract">Contract</option><option value="Internship">Internship</option></select></div>
                </div>
                <div><label>Job Description *</label><textarea className="search-input" style={{ height: '150px', resize: 'vertical' }} value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} required /></div>
                <div style={{ marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
                  <button type="submit" className="btn-black w-full" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Changes'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* BASE PAGE RENDER */}
      {!selectedJobId ? (
        // ==========================================
        // FULL WIDTH VIEW
        // ==========================================
        <div>
          <div className="search-box-wrapper mb-16" style={{ width: '100%' }}>
            <span className="search-icon">🔍</span>
            <input type="text" placeholder="Search jobs or companies..." className="search-input" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          
          <div className="flex-between-start mb-32">
            <div className="flex-row-wrap gap-8">
              <select className="search-input text-sm" style={{ width: 'auto', padding: '8px 12px' }} value={filterModality} onChange={(e) => setFilterModality(e.target.value)}>
                <option value="All">🏢 All Modalities</option>
                <option value="On-site">On-site</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Remote">Remote</option>
              </select>
              
              <select className="search-input text-sm" style={{ width: 'auto', padding: '8px 12px' }} value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                <option value="All">💼 All Job Types</option>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
              </select>

              <select className="search-input text-sm" style={{ width: 'auto', padding: '8px 12px' }} value={filterDate} onChange={(e) => setFilterDate(e.target.value)}>
                <option value="All">📅 Any Time</option>
                <option value="24h">Past 24 Hours</option>
                <option value="7d">Past Week</option>
                <option value="30d">Past Month</option>
              </select>
            </div>

            {role === 'company' && (
              <button className="btn-black" onClick={openAddModal}>+ Post a Job</button>
            )}
          </div>
          
          {isLoading ? (
            <p className="text-center text-secondary p-20">Loading jobs...</p>
          ) : filteredJobs.length > 0 ? (
            <div className="flex-col">
              {filteredJobs.map(job => (
                <JobCard key={job.id} job={job} isSelected={false} onClick={() => setSelectedJobId(job.id)} />
              ))}
            </div>
          ) : (
            <div className="card text-center text-secondary p-20" style={{ padding: '48px 24px' }}>
              <div className="text-3xl mb-16">📭</div>
              <h3 className="mb-8">No jobs found</h3>
              <p>Try adjusting your search or clearing some filters.</p>
            </div>
          )}
        </div>
      ) : (
        // ==========================================
        // SPLIT VIEW (When a job is clicked)
        // ==========================================
        <div className="jobs-split-layout active-split">
          <div className="jobs-list-column">
            <div className="search-box-wrapper mb-16" style={{ width: '100%' }}>
              <span className="search-icon">🔍</span>
              <input type="text" placeholder="Search jobs..." className="search-input" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>

            <div className="flex-col gap-8 mb-24">
              <select className="search-input text-sm" style={{ padding: '8px 12px' }} value={filterModality} onChange={(e) => setFilterModality(e.target.value)}>
                <option value="All">🏢 All Modalities</option>
                <option value="On-site">On-site</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Remote">Remote</option>
              </select>
              <div className="flex-row gap-8">
                <select className="search-input text-sm w-full" style={{ padding: '8px 12px' }} value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                  <option value="All">💼 All Types</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                </select>
                <select className="search-input text-sm w-full" style={{ padding: '8px 12px' }} value={filterDate} onChange={(e) => setFilterDate(e.target.value)}>
                  <option value="All">📅 Any Time</option>
                  <option value="24h">Past 24h</option>
                  <option value="7d">Past 7d</option>
                  <option value="30d">Past 30d</option>
                </select>
              </div>
            </div>

            <div className="flex-col">
              {filteredJobs.length > 0 ? (
                filteredJobs.map(job => (
                  <JobCard key={job.id} job={job} isSelected={job.id === selectedJobId} onClick={() => setSelectedJobId(job.id)} />
                ))
              ) : (
                <p className="text-center text-secondary p-20">No matching jobs.</p>
              )}
            </div>
          </div>

          <div className="job-details-column">
            {selectedJob && (
              <>
                <div className="flex-between mb-8">
                  <div className="flex-row gap-8">
                    {(role === 'company' || role === 'admin') ? (
                      <>
                        {role === 'company' && (
                          <button onClick={openEditModal} className="btn-outline btn-sm">⚙️ Edit Job</button>
                        )}
                        <button 
                          onClick={handleDeleteJob} 
                          className="btn-sm" 
                          style={{ background: 'white', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', padding: '6px 12px', fontWeight: '500', cursor: 'pointer' }}
                        >
                          🗑️ Delete Job
                        </button>
                      </>
                    ) : <div></div>}
                  </div>

                  <button onClick={() => setSelectedJobId(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-color)', padding: '0 8px' }}>✕</button>
                </div>
                
                <div className="card p-20">
                  <div className="flex-between-start mb-16">
                    <h2 style={{ margin: 0 }}>{selectedJob.title}</h2>
                    <TagList tags={[selectedJob.work_model || 'On-site', selectedJob.type]} />
                  </div>
                  
                  <div className="flex-row-wrap text-secondary mb-24">
                    <span>🏢 {selectedJob.company}</span><span>📍 {selectedJob.location}</span>
                    <span style={{ fontSize: '0.85rem', background: 'var(--bg-color)', padding: '2px 8px', borderRadius: '4px' }}>📅 Posted: {selectedJob.date}</span>
                  </div>
                  
                  <h4 className="mb-8">Job Description</h4>
                  <p style={{ lineHeight: '1.6', marginBottom: '24px', whiteSpace: 'pre-wrap' }}>{selectedJob.description}</p>
                  
                  <div className="mt-32" style={{ paddingTop: '24px', borderTop: '1px solid var(--border-color)' }}>
                    {role !== 'company' && role !== 'admin' && (
                      <button 
                        className="w-full" 
                        onClick={handleApply}
                        disabled={isApplying || hasApplied}
                        style={{
                          padding: '12px 24px', borderRadius: '8px', fontSize: '1rem', fontWeight: '500', cursor: hasApplied ? 'default' : 'pointer', border: 'none',
                          backgroundColor: hasApplied ? '#10b981' : 'var(--text-color)',
                          color: 'white'
                        }}
                      >
                        {isApplying ? 'Sending Application...' : hasApplied ? '✓ Application Sent' : 'Apply Now'}
                      </button>
                    )}
                  </div>

                  {selectedCompany && (
                    <div className="mt-24 p-20" style={{ background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                      <div className="flex-row mb-16">
                        <div className="avatar-lg" style={{ width: '48px', height: '48px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--primary-color)', color: 'white' }}>🏢</div>
                        <div>
                          <h4 style={{ margin: '0 0 4px 0' }}>About {selectedCompany.name}</h4>
                          <p className="text-sm text-secondary" style={{ margin: 0 }}>📍 {selectedCompany.address}</p>
                        </div>
                      </div>
                      <button className="btn-outline w-full" onClick={() => navigate(`/company/${selectedCompany.id}`)}>View Full Company Profile</button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}