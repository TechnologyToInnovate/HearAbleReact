import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import StatusBadge from '../components/StatusBadge';
import FilterButton from '../components/FilterButton'; // <-- NEW COMPONENT

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
    <div className="page-container-wide">

      <div className="search-box-wrapper mb-16" style={{ width: '100%' }}>
        <span className="search-icon">🔍</span>
        <input 
          type="text" 
          placeholder="Search by candidate name or job title..." 
          className="search-input" 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)} 
        />
      </div>

      <div className="mb-32">
        <FilterButton />
      </div>

      {isLoading && <p className="text-center text-secondary">Loading applications...</p>}
      
      {!isLoading && filteredApps.length === 0 && (
        <div className="card text-center text-secondary p-20" style={{ padding: '48px 24px' }}>
          <div className="text-3xl mb-16">📥</div>
          <h3 className="mb-8">No applications yet</h3>
          <p>When talent applies to your job postings, they will appear right here.</p>
        </div>
      )}

      <div className="flex-col">
        {filteredApps.map(app => (
          <div key={app.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
            
            <div className="flex-between-start" style={{ padding: '24px' }}>
              <div className="flex-row">
                <div className="avatar" style={{ width: '56px', height: '56px', background: 'var(--text-color)', color: 'white', flexShrink: 0, fontSize: '1.2rem' }}>
                  {app.applicant_name ? app.applicant_name.charAt(0).toUpperCase() : 'U'}
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

              <StatusBadge status={app.status || 'Pending'} />
            </div>

            <div className="flex-between" style={{ padding: '16px 24px', background: 'var(--bg-color)', borderTop: '1px solid var(--border-color)' }}>
              
              <div className="flex-row gap-8">
                <button 
                  className="btn-outline btn-sm" 
                  onClick={() => navigate(`/user/${app.applicant_id}`)}
                  style={{ background: 'white' }}
                >
                  👤 View Profile
                </button>
                <button 
                  className="btn-outline btn-sm" 
                  onClick={() => alert('Resume viewing feature coming soon!')}
                  style={{ background: 'white' }}
                >
                  📄 View Resume
                </button>
              </div>

              <div className="flex-row gap-8">
                {app.status !== 'Approved' && (
                  <button 
                    className="btn-sm" 
                    onClick={() => handleStatusChange(app.id, 'Approved')}
                    style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 16px', fontWeight: '500', cursor: 'pointer' }}
                  >
                    ✓ Approve
                  </button>
                )}
                
                {app.status !== 'Rejected' && (
                  <button 
                    className="btn-sm" 
                    onClick={() => handleStatusChange(app.id, 'Rejected')}
                    style={{ background: 'white', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', padding: '6px 16px', fontWeight: '500', cursor: 'pointer' }}
                  >
                    ✕ Reject
                  </button>
                )}
              </div>

            </div>
          </div>
        ))}
      </div>
    </div>
  );
}