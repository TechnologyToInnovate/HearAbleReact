import React from 'react';
import Avatar from '../common/Avatar';

export default function ProfileBanner({ 
  avatarSrc, 
  fallbackName, 
  avatarType = "user", 
  title, 
  subtitle, 
  actionButton 
}) {
  return (
    <div className="card p-0 mb-24" style={{ overflow: 'hidden' }}>
      {/* Banner Background */}
      <div style={{ height: '120px', backgroundColor: 'var(--primary-color)', opacity: 0.9 }}></div>
      
      {/* Banner Content */}
      <div style={{ padding: '0 32px 32px 32px', position: 'relative' }}>
        <div className="flex-between-start" style={{ marginTop: '-40px' }}>
          
          <div className="flex-row gap-24 align-center">
            <Avatar src={avatarSrc} fallbackName={fallbackName} size="lg" type={avatarType} />
            <div style={{ marginTop: '40px' }}>
              <h1 style={{ margin: '0 0 8px 0', fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                {title}
              </h1>
              {subtitle && (
                <div className="text-lg m-0 flex-row-wrap gap-16 align-center">
                  {subtitle}
                </div>
              )}
            </div>
          </div>

          {/* Action Button Area (e.g., Edit Profile) */}
          {actionButton && (
            <div style={{ marginTop: '56px' }}>
              {actionButton}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}