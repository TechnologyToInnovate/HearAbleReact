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

  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [newTitle, setNewTitle] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newWorkModel, setNewWorkModel] = useState('On-site');
  const [newType, setNewType] = useState('Full-time');
  const [newDescription, setNewDescription] = useState('');
  const [newSkills, setNewSkills] = useState('');

  const [isEditingJob, setIsEditingJob] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editWorkModel, setEditWorkModel] = useState('On-site');
  const [editType, setEditType] = useState('Full-time');
  const [editDescription, setEditDescription] = useState('');
  const [editSkills, setEditSkills] = useState('');

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
    const { data } = await supabase.from('profiles').select('*').limit(1).maybeSingle();
    if (data) setCurrentUser(data);
  }

  useEffect(() => {
    async function fetchJobDetails() {
      setHasApplied(false);
      setIsEditingJob(false); 
      
      if (selectedJob) {
        setEditTitle(selectedJob.title);
        setEditCompany(selectedJob.company);
        setEditLocation(selectedJob.location);
        setEditWorkModel(selectedJob.work_model || 'On-site');
        setEditType(selectedJob.type);
        setEditDescription(selectedJob.description);
        setEditSkills(selectedJob.skills ? selectedJob.skills.join(', ') : '');

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
      alert("Please set up your profile on the Dashboard first before applying!");
      navigate('/edit-profile');
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

  async function handlePostJob(e) {
    e.preventDefault();
    setIsSubmitting(true);
    const skillsArray = newSkills.split(',').map(s => s.trim()).filter(s => s.length > 0);
    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const { error } = await supabase.from('jobs').insert([{
      title: newTitle, company: newCompany, location: newLocation, work_model: newWorkModel,
      type: newType, description: newDescription, skills: skillsArray, date: today
    }]);

    if (!error) {
      alert("Job posted successfully!");
      setNewTitle(''); setNewCompany(''); setNewLocation(''); setNewWorkModel('On-site'); setNewType('Full-time'); setNewDescription(''); setNewSkills('');
      setShowAddForm(false);
      fetchJobs();
    }
    setIsSubmitting(false);
  }

  async function handleUpdateJob(e) {
    e.preventDefault();
    setIsSubmitting(true);
    const skillsArray = editSkills.split(',').map(s => s.trim()).filter(s => s.length > 0);

    const updatedJobData = {
      title: editTitle, company: editCompany, location: editLocation, work_model: editWorkModel,
      type: editType, description: editDescription, skills: skillsArray
    };

    setJobs(jobs.map(job => job.id === selectedJob.id ? { ...job, ...updatedJobData } : job));

    const { error } = await supabase.from('jobs').update(updatedJobData).eq('id', selectedJob.id);

    if (!error) {
      alert("Job updated successfully!");
      setIsEditingJob(false);
    } else {
      alert("Failed to update job. Check console for details.");
      fetchJobs(); 
    }
    setIsSubmitting(false);
  }

  async function handleDeleteJob() {
    if (!window.confirm("Are you sure you want to delete this job posting? This action cannot be undone.")) return;

    const { error } = await supabase.from('jobs').delete().eq('id', selectedJob.id);
    
    if (!error) {
      alert("Job deleted successfully!");
      setJobs(jobs.filter(job => job.id !== selectedJob.id));
      setSelectedJobId(null);
    } else {
      alert("Failed to delete job.");
      console.error(error);
    }
  }

  // ==========================================
  // MASTER FILTER LOGIC
  // ==========================================
  const filteredJobs = jobs.filter(job => {
    // 1. Text Search
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          job.company.toLowerCase().includes(searchQuery.toLowerCase());
    
    // 2. Modality Dropdown
    const matchesModality = filterModality === 'All' || job.work_model === filterModality;
    
    // 3. Type Dropdown
    const matchesType = filterType === 'All' || job.type === filterType;
    
    // 4. Date Dropdown Math
    let matchesDate = true;
    if (filterDate !== 'All' && job.date) {
      const jobDate = new Date(job.date);
      const now = new Date();
      // Calculate difference in days
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
      
      {showAddForm ? (
        <section className="card p-20" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div className="flex-between mb-24" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
            <h3 style={{ margin: 0 }}>Create a New Job Posting</h3>
            <button className="btn-outline btn-sm" onClick={() => setShowAddForm(false)}>← Cancel</button>
          </div>
          <form onSubmit={handlePostJob} className="flex-col">
            <div className="form-grid-2">
              <div><label>Job Title *</label><input type="text" className="search-input" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required /></div>
              <div><label>Company Name *</label><input type="text" className="search-input" value={newCompany} onChange={(e) => setNewCompany(e.target.value)} required /></div>
            </div>
            <div className="form-grid-3">
              <div><label>City / Region *</label><input type="text" className="search-input" value={newLocation} onChange={(e) => setNewLocation(e.target.value)} required /></div>
              <div><label>Work Model *</label><select className="search-input" value={newWorkModel} onChange={(e) => setNewWorkModel(e.target.value)}><option value="On-site">On-site</option><option value="Hybrid">Hybrid</option><option value="Remote">Remote</option></select></div>
              <div><label>Employment Type *</label><select className="search-input" value={newType} onChange={(e) => setNewType(e.target.value)}><option value="Full-time">Full-time</option><option value="Part-time">Part-time</option><option value="Contract">Contract</option><option value="Internship">Internship</option></select></div>
            </div>
            <div><label>Job Description *</label><textarea className="search-input" style={{ height: '150px' }} value={newDescription} onChange={(e) => setNewDescription(e.target.value)} required /></div>
            <div><label>Required Skills (comma separated) *</label><input type="text" className="search-input" value={newSkills} onChange={(e) => setNewSkills(e.target.value)} required /></div>
            <button type="submit" className="btn-black w-full" disabled={isSubmitting}>{isSubmitting ? 'Publishing...' : 'Publish Job Posting'}</button>
          </form>
        </section>
      ) : (
        !selectedJobId ? (
          // ==========================================
          // FULL WIDTH VIEW
          // ==========================================
          <div>
            <div className="search-box-wrapper mb-16" style={{ width: '100%' }}>
              <span className="search-icon">🔍</span>
              <input type="text" placeholder="Search jobs or companies..." className="search-input" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            
            {/* --- NEW FUNCTIONAL FILTERS UI --- */}
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
                <button className="btn-black" onClick={() => setShowAddForm(true)}>+ Post a Job</button>
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

              {/* Condensed Filters for Split Layout */}
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
                      {role === 'company' && !isEditingJob ? (
                        <>
                          <button onClick={() => setIsEditingJob(true)} className="btn-outline btn-sm">⚙️ Edit Job</button>
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
                    {isEditingJob ? (
                      <form onSubmit={handleUpdateJob} className="flex-col">
                        <h3 className="mb-16" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>Edit Job Posting</h3>
                        <div className="form-grid-2">
                          <div><label>Job Title *</label><input type="text" className="search-input" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required /></div>
                          <div><label>Company Name *</label><input type="text" className="search-input" value={editCompany} onChange={(e) => setEditCompany(e.target.value)} required /></div>
                        </div>
                        <div className="form-grid-3">
                          <div><label>Location *</label><input type="text" className="search-input" value={editLocation} onChange={(e) => setEditLocation(e.target.value)} required /></div>
                          <div><label>Work Model *</label><select className="search-input" value={editWorkModel} onChange={(e) => setEditWorkModel(e.target.value)}><option value="On-site">On-site</option><option value="Hybrid">Hybrid</option><option value="Remote">Remote</option></select></div>
                          <div><label>Type *</label><select className="search-input" value={editType} onChange={(e) => setEditType(e.target.value)}><option value="Full-time">Full-time</option><option value="Part-time">Part-time</option><option value="Contract">Contract</option><option value="Internship">Internship</option></select></div>
                        </div>
                        <div><label>Job Description *</label><textarea className="search-input" style={{ height: '150px' }} value={editDescription} onChange={(e) => setEditDescription(e.target.value)} required /></div>
                        <div><label>Skills (comma separated) *</label><input type="text" className="search-input" value={editSkills} onChange={(e) => setEditSkills(e.target.value)} required /></div>
                        
                        <div className="flex-row-wrap mt-24">
                          <button type="submit" className="btn-black" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Changes'}</button>
                          <button type="button" className="btn-outline" onClick={() => setIsEditingJob(false)}>Cancel</button>
                        </div>
                      </form>
                    ) : (
                      <>
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
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )
      )}
    </div>
  );
}