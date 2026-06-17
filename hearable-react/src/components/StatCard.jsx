import React from 'react';

export default function StatCard({ value, label, isLoading }) {
  return (
    <div className="card p-20 text-center">
      <h2 className="text-2xl mb-8 text-primary" style={{ margin: 0 }}>
        {isLoading ? '...' : value}
      </h2>
      <p className="text-secondary font-medium text-sm" style={{ margin: 0 }}>
        {label}
      </p>
    </div>
  );
}