import React from 'react';

export default function FilterSelect({ 
  value, 
  onChange, 
  options, 
  className = "", 
  style = {} 
}) {
  return (
    <select 
      className={`search-input ${className}`} 
      style={{ width: 'auto', minWidth: '180px', padding: '10px 16px', ...style }} 
      value={value} 
      onChange={onChange}
    >
      {options.map((opt, index) => (
        <option key={index} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}