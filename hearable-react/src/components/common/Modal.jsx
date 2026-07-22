import React from 'react';

export default function Modal({ isOpen, onClose, title, children, maxWidth = '500px', height = 'auto' }) {
  if (!isOpen) return null;

  return (
    <div style={{ 
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', 
      display: 'flex', alignItems: 'center', justifyContent: 'center', 
      zIndex: 9999, padding: '20px' 
    }}>
      <div className="card p-0" style={{ 
        width: '100%', maxWidth: maxWidth, height: height, 
        background: 'var(--card-bg)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', 
        overflow: 'hidden', border: '1px solid var(--border-color)',
        display: 'flex', flexDirection: 'column'
      }}>
        
        {/* Modal Header */}
        <div style={{ 
          padding: '20px 24px', borderBottom: '1px solid var(--border-color)', 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 
        }}>
          <h3 className="m-0" style={{ fontSize: '1.25rem' }}>{title}</h3>
          <button 
            onClick={onClose} 
            style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-color)' }}
          >
            ✕
          </button>
        </div>
        
        {/* Modal Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {children}
        </div>
        
      </div>
    </div>
  );
}