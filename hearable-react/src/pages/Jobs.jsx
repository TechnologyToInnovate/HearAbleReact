import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import JobCard from '../components/JobCard';
import JobFormModal from '../components/JobFormModal';

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

  const [showAddForm, setShowAddForm] = useState(false);
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

  async function handlePostJob(formData) {
    if (!currentUser) return;
    setIsSubmitting(true);
    const { error } = await supabase.from('jobs').insert([{ ...formData, company_id: currentUser.id, skills: formData.skills || [] }]);
    
    if (!error) { setShowAddForm(false); fetchJobs(); } 
    else { alert("Failed to post job."); console.error(error); }
    setIsSubmitting(false);
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
      
      <JobFormModal isOpen={showAddForm} onClose={() => setShowAddForm(false)} onSubmit={handlePostJob} isSubmitting={isSubmitting} />
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
        {role === 'company' && <button className="btn-black" onClick={() => setShowAddForm(true)}>+ Post a Job</button>}
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
            {selectedJob && (
              <>
                {(role === 'admin' || (role === 'company' && currentUser && selectedJob.company_id === currentUser.id)) && (
                  <div className="flex-row gap-8 mb-16">
                    {role === 'company' && <button onClick={() => setIsEditingJob(true)} className="btn-outline btn-sm">⚙️ Edit</button>}
                    <button onClick={handleDeleteJob} className="btn-danger btn-sm">🗑️ Delete</button>
                  </div>
                )}
                
                <div className="card p-24">
                  
                  {/* TITLE & DATE */}
                  <div className="flex-between-start mb-16">
                    <h2 className="m-0" style={{ paddingRight: '16px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      {selectedJob.title}
                      
                      {selectedJob.matchScore > 0 && (
                        <span style={{ 
                          background: '#fffbeb', 
                          color: '#b45309', 
                          border: '1px solid #fde68a',
                          padding: '4px 10px', 
                          borderRadius: '12px', 
                          fontSize: '0.85rem', 
                          fontWeight: 'bold', 
                          whiteSpace: 'nowrap'
                        }}>
                          🔥 {selectedJob.matchScore}% Match
                        </span>
                      )}
                    </h2>
                    
                    <div className="text-right" style={{ flexShrink: 0 }}>
                      <span className="text-sm text-secondary block" style={{ fontWeight: '500' }}>
                        📅 Posted: {selectedJob.date}
                      </span>
                    </div>
                  </div>
                  
                  {/* BADGES & COMPANY */}
                  <div className="flex-col gap-12 mb-24">
                    <div className="flex-row-wrap gap-12 align-center">
                      {selectedJob.location && (
                        <span className="text-secondary" style={{ fontWeight: '500' }}>
                          📍 {selectedJob.location}
                        </span>
                      )}
                      <span className="badge badge-info">
                        {selectedJob.work_model || 'On-site'}
                      </span>
                      <span className="badge badge-neutral">
                        {selectedJob.type}
                      </span>
                    </div>
                    
                    <div className="text-secondary" style={{ fontSize: '1.05rem', fontWeight: '500' }}>
                      🏢 {selectedJob.company}
                    </div>
                  </div>
                  
                  <h4 className="mb-8">Job Description</h4>
                  <p style={{ lineHeight: '1.6', whiteSpace: 'pre-wrap', margin: 0 }}>{selectedJob.description}</p>
                  
                  {/* 🚨 NEW: Displaying the required skills right under the description! */}
                  {selectedJob.skills && selectedJob.skills.length > 0 && (
                    <div className="mt-24">
                      <h4 className="mb-12">Required Skills</h4>
                      <div className="flex-row-wrap gap-8">
                        {selectedJob.skills.map((skill, index) => (
                          <span 
                            key={index} 
                            className="badge" 
                            style={{ 
                              background: 'var(--bg-color)', 
                              border: '1px solid var(--border-color)', 
                              color: 'var(--text-color)', 
                              padding: '6px 12px',
                              fontSize: '0.9rem' 
                            }}
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="divider m-0 mt-32 flex-col gap-8">
                    {role !== 'company' && role !== 'admin' && (
                      <>
                        <button 
                          className={`btn-apply ${hasApplied ? 'success' : ''}`}
                          onClick={handleApply} 
                          disabled={isApplying || hasApplied || ['pending_user', 'rejected_user'].includes(role)}
                        >
                          {isApplying ? 'Sending Application...' : hasApplied ? '✓ Application Sent' : (['pending_user', 'rejected_user'].includes(role)) ? 'Approval Required to Apply' : 'Apply Now'}
                        </button>

                        <button 
                          className="btn-outline w-full"
                          onClick={handleSaveJob}
                          disabled={isSaving}
                        >
                          {isSaving ? 'Processing...' : isSaved ? '⭐ Saved' : '☆ Save for Later'}
                        </button>
                      </>
                    )}
                  </div>

                  {selectedCompany && (
                    <div className="sub-card mt-24">
                      <div className="flex-row gap-16 align-center mb-16">
                        <div className="avatar" style={{ borderRadius: '8px', flexShrink: 0 }}>
                          {selectedCompany.logo_url ? (
                             <img src={selectedCompany.logo_url} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                          ) : '🏢'}
                        </div>
                        <div>
                          <h4 className="m-0 mb-8">About {selectedCompany.name}</h4>
                          <p className="text-sm text-secondary m-0">📍 {selectedCompany.address || "Location not specified"}</p>
                        </div>
                      </div>
                      <button className="btn-outline w-full" onClick={() => navigate(`/company/${selectedCompany.id}`)}>
                        View Full Company Profile
                      </button>
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