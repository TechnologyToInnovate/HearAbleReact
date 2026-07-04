import React from 'react';

export default function JobFilters({ 
  filterModality, setFilterModality, 
  filterType, setFilterType, 
  filterDate, setFilterDate 
}) {
  return (
    <div className="flex-row-wrap gap-8 filter-container">
      

      <select 
        className="search-input text-sm mobile-full-width" 
        style={{ width: 'auto' }} 
        value={filterModality} 
        onChange={(e) => setFilterModality(e.target.value)}
      >
        <option value="All">Modalities</option>
        <option value="On-site">On-site</option>
        <option value="Hybrid">Hybrid</option>
        <option value="Remote">Remote</option>
      </select>

      <select 
        className="search-input text-sm mobile-full-width" 
        style={{ width: 'auto' }} 
        value={filterType} 
        onChange={(e) => setFilterType(e.target.value)}
      >
        <option value="All">Types</option>
        <option value="Full-time">Full-time</option>
        <option value="Part-time">Part-time</option>
        <option value="Contract">Contract</option>
        <option value="Internship">Internship</option>
      </select>

      <select 
        className="search-input text-sm mobile-full-width" 
        style={{ width: 'auto' }} 
        value={filterDate} 
        onChange={(e) => setFilterDate(e.target.value)}
      >
        <option value="All">Any Time</option>
        <option value="24h">Past 24 Hours</option>
        <option value="7d">Past Week</option>
        <option value="30d">Past Month</option>
      </select>
      
    </div>
  );
}