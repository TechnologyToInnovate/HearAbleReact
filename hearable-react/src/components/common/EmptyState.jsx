import React from 'react';

export default function EmptyState({ 
  icon, 
  title, 
  message, 
  actionButton,
  className = "" 
}) {
  return (
    <div className={`card text-center text-secondary p-32 ${className}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      {icon && <div className="text-4xl mb-16">{icon}</div>}
      {title && <h3 className="m-0 mb-8">{title}</h3>}
      {message && <p className="m-0 text-secondary" style={{ maxWidth: '500px', lineHeight: '1.6' }}>{message}</p>}
      {actionButton && <div className="mt-24">{actionButton}</div>}
    </div>
  );
}