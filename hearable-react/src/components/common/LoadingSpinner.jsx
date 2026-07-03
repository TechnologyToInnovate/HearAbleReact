import React from 'react';

export default function LoadingSpinner({ message = "Loading..." }) {
  return (
    <div className="flex-col align-center gap-16" style={{ padding: '48px 24px', width: '100%', justifyContent: 'center' }}>
      <svg 
        width="40" height="40" viewBox="0 0 24 24" 
        fill="none" stroke="var(--primary-color)" 
        strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" 
        style={{ animation: 'spin 1s linear infinite' }}
      >
        <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
      </svg>
      <p className="text-secondary font-medium m-0">{message}</p>
    </div>
  );
}