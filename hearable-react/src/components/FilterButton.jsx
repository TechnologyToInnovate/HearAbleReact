import React from 'react';

export default function FilterButton({ onClick }) {
  return (
    <button className="btn-outline" onClick={onClick}>
      ⚙️ Filters
    </button>
  );
}