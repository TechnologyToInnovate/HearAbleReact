import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

export function useJobs() {
  const [jobs, setJobs] = useState([]);
  const [companies, setCompanies] = useState([]); 
  const [isLoading, setIsLoading] = useState(true);
  const { user, role } = useAuth(); 

  useEffect(() => {
    async function fetchJobsAndMatches() {
      setIsLoading(true);

      try {
        // 1. Fetch companies
        const { data: companiesData } = await supabase.from('companies').select('*');
        if (companiesData) setCompanies(companiesData);

        // 2. Fetch jobs, company status, AND nested skills!
        const { data: jobsData, error: jobsError } = await supabase
          .from('jobs')
          .select(`
            *,
            companies ( name, is_deaf_accessible ),
            job_skills (
              skills ( * )
            )
          `)
          .eq('status', 'Approved');

        if (jobsError) throw jobsError;

        let finalJobs = jobsData.map(job => ({
          ...job,
          company: job.companies?.name || 'Unknown Company',
          is_deaf_accessible: job.is_deaf_accessible || job.companies?.is_deaf_accessible,
          // 🚨 Flatten the nested skills array so JobDetailsPane can map it easily
          skills: job.job_skills ? job.job_skills.map(js => js.skills).filter(Boolean) : [],
          matchScore: 0 
        }));

        // 3. Fetch Match Scores
        if (user?.id && (role === 'user' || role === 'pending_user')) {
          const { data: matchScores, error: matchError } = await supabase
            .rpc('get_job_matches', { p_user_id: user.id });

          if (!matchError && matchScores) {
            finalJobs = finalJobs.map(job => {
              const matchedJob = matchScores.find(m => m.job_id === job.id);
              return {
                ...job,
                matchScore: matchedJob ? Math.min(matchedJob.match_score, 100) : 0 
              };
            });
          }
        }

        setJobs(finalJobs);
      } catch (error) {
        console.error("Error fetching jobs or match scores:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchJobsAndMatches();
  }, [user, role]);

  return { jobs, companies, isLoading, setJobs };
}