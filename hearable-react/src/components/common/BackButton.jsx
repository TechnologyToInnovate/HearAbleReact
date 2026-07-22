import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function BackButton({ onClick, label = "Back", className = "mb-16" }) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onClick) {
      onClick(); // Run custom function if provided (like in Applicants.jsx)
    } else {
      navigate(-1); // Default behavior is to go to the previous page
    }
  };

  return (
    <div className={className}>
      <button 
        className="btn-outline btn-sm" 
        onClick={handleBack}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
      >
        &larr; {label}
      </button>
    </div>
  );
}