import React from 'react';

export default function SkillBadge({ skill, onRemove, customStyle }) {
  // Gracefully handle both string arrays and object arrays { id, name }
  const skillName = typeof skill === 'string' ? skill : (skill?.name || 'Unknown Skill');
  
  return (
    <span 
      className="badge" 
      style={{ 
        background: 'var(--bg-color)', 
        border: '1px solid var(--border-color)', 
        color: 'var(--text-color)', 
        padding: '6px 12px', 
        fontSize: '0.9rem',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        borderRadius: '20px',
        ...customStyle
      }}
    >
      {skillName}
      
      {/* If an onRemove function is passed, show the 'X' button */}
      {onRemove && (
        <button 
          type="button" 
          onClick={(e) => { e.preventDefault(); onRemove(); }} 
          style={{ 
            background: 'none', border: 'none', color: 'inherit', 
            cursor: 'pointer', padding: 0, fontSize: '1rem', 
            display: 'flex', alignItems: 'center' 
          }}
          aria-label="Remove skill"
        >
          ✕
        </button>
      )}
    </span>
  );
}