import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SystemData({ role }) {
  const navigate = useNavigate();

  // Restrict access to admins only
  useEffect(() => {
    if (role !== 'admin') {
      navigate('/');
    }
  }, [role, navigate]);

  const managementModules = [
    {
      title: 'Skills Database',
      description: 'Add, edit, or remove the professional skills available for users to select on their profiles.',
      path: '/skills',
      buttonText: 'Manage Skills'
    },
    {
      title: 'Degree Programs',
      description: 'Update the list of academic degrees and abbreviations used during registration and profile creation.',
      path: '/degrees',
      buttonText: 'Manage Degrees'
    },
    {
      title: 'Batch Management',
      description: 'Control the cohort or batch numbers available for users to assign to their academic records.',
      path: '/batches',
      buttonText: 'Manage Batches'
    }
  ];

  return (
    <div className="page-container-wide">
      
      <div className="mb-32" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '24px' }}>
        <h1 style={{ margin: '0 0 8px 0' }}>System Data</h1>
        <p className="text-secondary m-0 text-lg">
          Centralized hub to manage standard dropdown options and platform-wide configurations.
        </p>
      </div>

      {/* Added alignItems: 'stretch' so all cards grow to match the tallest one */}
      <div className="flex-row-wrap gap-24" style={{ alignItems: 'stretch' }}>
        {managementModules.map((module, index) => (
          <div 
            key={index} 
            className="card p-24" 
            style={{ 
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between', // Pushes the button perfectly to the bottom
              flex: '1 1 300px', 
              border: '1px solid var(--border-color)',
              transition: 'transform 0.2s ease, border-color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.borderColor = 'var(--primary-color)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'var(--border-color)';
            }}
          >
            <div style={{ marginBottom: '24px' }}>
              <h3 className="m-0 mb-8" style={{ fontSize: '1.25rem' }}>{module.title}</h3>
              <p className="text-secondary m-0" style={{ lineHeight: '1.5' }}>
                {module.description}
              </p>
            </div>
            
            {/* Added a fixed height and flex centering to ensure uniform button sizes */}
            <button 
              className="btn-black w-full" 
              onClick={() => navigate(module.path)}
              style={{ height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {module.buttonText}
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}