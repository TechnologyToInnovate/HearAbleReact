import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import JobCard from './JobCard';

export default function MatchedJobsWidget({ jobs, onSelectJob }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const matchedJobs = jobs
    .filter(job => job.matchScore && job.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5); 

  return (
    <div className="mb-24">
      {/* 🚨 REMOVED THE "Top Matches For You" TITLE HEADER HERE */}
      
      {matchedJobs.length > 0 ? (
        <div className="flex-col gap-12">
          {matchedJobs.map(job => (
            <JobCard 
              key={job.id} 
              job={job} 
              isSelected={false}
              onClick={() => onSelectJob(job.id)} 
            />
          ))}
        </div>
      ) : (
        <div 
          className="card text-center p-32" 
          style={{ 
            border: '2px dashed var(--border-color)', 
            backgroundColor: 'transparent',
            boxShadow: 'none'
          }}
        >
          <h3 className="m-0 mb-8 text-xl">Unlock Your Top Matches</h3>
          <p className="text-secondary m-0 mb-24" style={{ maxWidth: '500px', margin: '0 auto 24px auto', lineHeight: '1.6' }}>
            We need to know a little more about you! Add more skills to your profile to get personalized job recommendations and increase your chances of finding the perfect match.
          </p>
          <button 
            className="btn-black" 
            style={{ padding: '12px 24px', fontSize: '1rem' }}
            onClick={() => navigate(`/user/${user?.id}`, { state: { openAddSkill: true } })}
          >
            Update My Skills
          </button>
        </div>
      )}
    </div>
  );
}