import React from 'react';

export default function TagList({ tags = [], max, emptyMessage = "---" }) {
  // If there are no tags, return the fallback message
  if (!tags || tags.length === 0) {
    return <span className="text-secondary text-sm">{emptyMessage}</span>;
  }

  // Calculate how many tags to show based on the 'max' prop
  const displayTags = max ? tags.slice(0, max) : tags;
  const remaining = max && tags.length > max ? tags.length - max : 0;

  return (
    <div className="flex-row-wrap gap-8">
      {displayTags.map((tag, idx) => (
        <span key={idx} className="tag bg-white border">
          {tag}
        </span>
      ))}
      
      {/* If there are hidden tags, show the "+X more" pill */}
      {remaining > 0 && (
        <span className="tag" style={{ background: 'var(--bg-color)' }}>
          +{remaining} more
        </span>
      )}
    </div>
  );
}
