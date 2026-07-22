import React from 'react';

export default function FormInput({ 
  label, 
  type = "text", 
  value, 
  onChange, 
  placeholder, 
  required = false, 
  accept, 
  rows, 
  className = "", 
  style = {} 
}) {
  return (
    <div className={className}>
      {label && <label className="text-sm block mb-8 font-bold">{label}</label>}
      
      {type === 'textarea' ? (
        <textarea 
          className="search-input w-full" 
          style={{ minHeight: '80px', resize: 'vertical', ...style }}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          rows={rows}
        />
      ) : (
        <input 
          type={type}
          accept={accept}
          className="search-input w-full"
          placeholder={placeholder}
          value={type !== 'file' ? value : undefined}
          onChange={onChange}
          required={required}
          style={{ ...(type === 'file' ? { padding: '8px', cursor: 'pointer' } : {}), ...style }}
        />
      )}
    </div>
  );
}