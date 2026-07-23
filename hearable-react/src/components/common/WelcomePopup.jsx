import React, { useState, useEffect } from 'react';

export default function WelcomePopup() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if the device has already seen the popup
    const hasSeenPopup = localStorage.getItem('hearable_welcome_seen');
    if (!hasSeenPopup) {
      setIsVisible(true);
    }
  }, []);

  const handleConfirm = () => {
    // Save to local storage so it never shows again on this device
    localStorage.setItem('hearable_welcome_seen', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div style={{ 
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', 
      display: 'flex', alignItems: 'center', justifyContent: 'center', 
      zIndex: 99999, padding: '20px' 
    }}>
      <div className="card text-center" style={{ 
        maxWidth: '450px', width: '100%', padding: '40px 32px', 
        background: 'var(--card-bg)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', 
        borderRadius: '16px', border: '1px solid var(--border-color)'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>👋</div>
        <h2 style={{ fontSize: '1.75rem', margin: '0 0 16px 0' }}>Welcome to HearAble</h2>
        <p className="text-secondary" style={{ fontSize: '1.05rem', lineHeight: '1.6', margin: '0 0 32px 0' }}>
          Please note that HearAble is a dedicated career platform designed specifically to support and empower the <strong>deaf and hard-of-hearing community</strong> in finding inclusive workplaces.
        </p>
        <button 
          className="btn-black w-full" 
          style={{ padding: '14px', fontSize: '1.1rem', fontWeight: 'bold' }} 
          onClick={handleConfirm}
        >
          I Understand
        </button>
      </div>
    </div>
  );
}