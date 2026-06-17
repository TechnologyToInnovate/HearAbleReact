import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

// Import our new StatusBadge component!
import StatusBadge from '../components/StatusBadge';

export default function Applicants({ role }) {
  const navigate = useNavigate();
  
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [companyName, setCompanyName] = useState('');

  useEffect(() => {
    if (role === 'user') {
      navigate('/');
      return;
    }

    async function fetchApplicants() {
      setIsLoading(true);
      
      if (role === 'company') {
        const { data: compData } = await supabase.from('companies').select('*').limit(1).maybeSingle();
        if (compData) {
          setCompanyName(compData.name);
          const { data: appData } = await supabase
            .from('applications')
            .select('*')
            .eq('company', compData.name)
            .order('id', { ascending: false });
          if (appData) setApplications(appData);
        }
      } else if (role === 'admin') {
        const { data: allData } = await supabase
          .from('applications')
          .select('*')
          .order('id', { ascending: false });
        if (allData) setApplications(allData);
      }
      
      setIsLoading(false);
    }
    
    fetchApplicants();
  }, [role, navigate]);

  async function handleStatusChange(appId, newStatus) {
    setApplications(applications.map(app => 
      app.id === appId ? { ...app, status: newStatus } : app
    ));

    const { error } = await supabase
      .from('applications')
      .update({ status: newStatus })
      .eq('id', appId);

    if (error) {
      alert("Failed to update status.");
      console.error(error);
    }
  }

  const filteredApps = applications.filter(app => 
    app.applicant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.job_title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="page-container">
      
      <div className="flex-between-start mb-32">
        <div>
          <h2 className="text-3xl mb-8" style={{ margin: '0 0 8px 0' }}>Applicant Tracking</h2>
          <p className="text-secondary text-lg" style={{ margin: 0 }}>
            {role === 'admin' 
              ? 'Platform-wide overview of all submitted applications.' 
              : `Review and manage talent applying to ${companyName || 'your company'}.`}
          </p>
        </div>
      </div>

      <div className="search-box-wrapper mb-32" style={{ maxWidth: '500px' }}>
        <span className="search-icon">🔍</span>
        <input 
          type="text" 
          placeholder="Search by candidate name or job title..." 
          className="search-input" 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)} 
        />
      </div>

      {isLoading && <p className="text-center text-secondary">Loading applications...</p>}
      
      {!isLoading && filteredApps.length === 0 && (
        <div className="card text-center text-secondary p-20" style={{ padding: '48px 24px' }}>
          <div className="text-3xl mb-16">📥</div>
          <h3 className="mb-8">No applications yet</h3>
          <p>When talent applies to your job postings, they will appear right here.</p>
        </div>
      )}

      {/* REFACTORED APPLICANT LIST */}
      <div className="flex-col">
        {filteredApps.map(app => (
          <div key={app.id} className="card p-20">
            
            <div className="flex-between">
              
              {/* LEFT SIDE: Applicant Details */}
              <div className="flex-row">
                <div className="avatar" style={{ width: '48px', height: '48px', background: 'var(--text-color)', color: 'white', flexShrink: 0 }}>
                  {app.applicant_name ? app.applicant_name.charAt(0).toUpperCase() : 'C'}
                </div>
                <div>
                  <h3 className="text-lg" style={{ margin: '0 0 4px 0' }}>{app.applicant_name}</h3>
                  <p className="text-sm text-secondary" style={{ margin: 0 }}>
                    Applied for: <strong className="text-primary">{app.job_title}</strong>
                  </p>
                  {role === 'admin' && (
                    <p className="text-sm text-secondary" style={{ margin: '4px 0 0 0' }}>
                      🏢 To: {app.company}
                    </p>
                  )}
                </div>
              </div>

              {/* RIGHT SIDE: Pipeline Controls & Action Button */}
              <div className="flex-row-wrap">
                
                {/* Status Box */}
                <div className="flex-row gap-8" style={{ background: 'var(--bg-color)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  
                  {/* LOOK HOW CLEAN THIS IS NOW! */}
                  <StatusBadge status={app.status} />
                  
                  <select 
                    className="search-input text-sm" 
                    style={{ padding: '4px 8px', minWidth: '130px', background: 'white' }}
                    value={app.status || 'Under Review'}
                    onChange={(e) => handleStatusChange(app.id, e.target.value)}
                  >
                    <option value="Under Review">Under Review</option>
                    <option value="Interviewing">Interviewing</option>
                    <option value="Hired">Hired</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <button 
                  className="btn-outline btn-sm" 
                  onClick={() => navigate(`/user/${app.applicant_id}`)}
                  style={{ padding: '8px 16px' }}
                >
                  View Profile
                </button>
              </div>

            </div>
          </div>
        ))}
      </div>
    </div>
  );
}