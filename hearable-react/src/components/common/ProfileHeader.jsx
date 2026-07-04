import React from 'react';
import Avatar from './Avatar'; 

export default function ProfileHeader({ name, picUrl, type = 'user', children }) {
  return (
    <div className="flex-row align-center gap-24 mb-24 profile-header-mobile">
      
      <Avatar src={picUrl} fallbackName={name || (type === 'company' ? 'C' : 'U')} size="lg" type={type} />
      
      <div>
        <h1 className="m-0 mb-8">{name || 'Unknown Profile'}</h1>
        
        <div className="flex-row-wrap gap-12 text-secondary justify-center">
          {children}
        </div>
      </div>
    </div>
  );
}