import React, { useState } from 'react';

export default function Avatar({ src, fallbackName = '', size = 'md', type = 'user', customStyle = {} }) {
  const [imgFailed, setImgFailed] = useState(false);

  // 🚨 SMART INITIALS EXTRACTOR
  const getInitials = (name) => {
    if (!name) return type === 'company' ? 'C' : 'U';
    
    // Split the name by spaces
    const words = name.trim().split(' ').filter(Boolean);
    
    if (words.length === 0) return type === 'company' ? 'C' : 'U';
    if (words.length === 1) return words[0].charAt(0).toUpperCase();
    
    // Grab the first letter of the first word AND the first letter of the last word
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  };

  const initials = getInitials(fallbackName);

  // Consistent sizes for all avatars across the app
  const sizeStyles = {
    sm: { width: '32px', height: '32px', fontSize: '0.85rem' },
    md: { width: '48px', height: '48px', fontSize: '1.2rem' },
    lg: { width: '80px', height: '80px', fontSize: '2.2rem' },
  };

  const dims = sizeStyles[size] || sizeStyles.md;
  
  // Companies get rounded squares, Users get perfect circles
  const radius = type === 'company' ? '12px' : '50%';

  // If there's an image and it hasn't failed to load, show it
  if (src && !imgFailed) {
    return (
      <img 
        src={src} 
        alt={fallbackName || 'Avatar'} 
        onError={() => setImgFailed(true)} // Falls back to initials if image link breaks
        style={{ 
          ...dims, 
          borderRadius: radius, 
          objectFit: 'cover', 
          border: '1px solid var(--border-color)',
          flexShrink: 0,
          ...customStyle 
        }} 
      />
    );
  }

  // Otherwise, render the signature initials badge
  return (
    <div 
      style={{ 
        ...dims, 
        borderRadius: radius, 
        backgroundColor: 'var(--primary-color)', 
        color: 'var(--card-bg)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        fontWeight: 'bold',
        flexShrink: 0,
        ...customStyle 
      }}
    >
      {initials}
    </div>
  );
}