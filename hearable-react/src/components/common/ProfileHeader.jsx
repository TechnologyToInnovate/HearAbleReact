import React from 'react';
import Avatar from './Avatar'; // 🚨 Both are now in the common folder

export default function ProfileHeader({ name, picUrl, type = 'user', children }) {
  return (
    <div className="flex-row align-center gap-24 mb-24">
      {/* 🚨 Automatically handles the Benilde green, sizes, shapes, and fallbacks */}
      <Avatar src={picUrl} fallbackName={name || (type === 'company' ? 'C' : 'U')} size="lg" type={type} />
      
      <div>
        <h1 className="m-0 mb-8">{name || 'Unknown Profile'}</h1>
        
        {/* Uses our utility classes for spacing */}
        <div className="flex-row-wrap gap-12 text-secondary">
          {children}
        </div>
      </div>
    </div>
  );
}