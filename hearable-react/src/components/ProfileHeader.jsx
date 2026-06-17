import React from 'react';

export default function ProfileHeader({ name, type = 'user', children }) {
  const isCompany = type === 'company';
  const defaultChar = isCompany ? 'C' : 'T';
  const radius = isCompany ? '16px' : '50%';

  return (
    <div className="profile-header-flex mb-24">
      <div 
        className="avatar-lg" 
        style={{ width: '100px', height: '100px', fontSize: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--primary-color)', color: 'white', flexShrink: 0, borderRadius: radius }}
      >
        {name ? name.charAt(0).toUpperCase() : defaultChar}
      </div>
      
      <div>
        <h1 className="mb-8">{name || 'Unknown Profile'}</h1>
        
        {/* Using our new flex-row-wrap class! */}
        <div className="flex-row-wrap text-secondary">
          {children}
        </div>
      </div>
    </div>
  );
}