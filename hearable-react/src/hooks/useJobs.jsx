import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

export function useJobs() {
  const { user, role } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchJobsData() {
      setIsLoading(true);

      try {
        // 🚨 FIX 1: Join the locations table to get the company headquarters!
        const { data: companiesData } = await supabase
          .from('companies')
          .select('*, locations(city, country)');
          
        if (companiesData) setCompanies(companiesData);

        // 2. Build the Base Jobs Query 
        let query = supabase
          .from('jobs')
          .select(`
            *,
            locations ( city ),
            job_skills (
              skills (*)
            )
          `)
          .order('created_at', { ascending: false });

        if (['guest', 'user', 'pending_user', 'rejected_user'].includes(role)) {
          query = query.eq('status', 'Approved');
        }

        const { data: jobsData, error: jobsError } = await query;
        if (jobsError) throw jobsError;

        let formattedJobs = jobsData || [];

        // 3. Attach Applicant Counts
        if (['admin', 'company'].includes(role)) {
          const { data: appsData } = await supabase.from('applications').select('job_id');
          if (appsData) {
            const appCounts = appsData.reduce((acc, app) => {
              acc[app.job_id] = (acc[app.job_id] || 0) + 1;
              return acc;
            }, {});
            
            formattedJobs = formattedJobs.map(job => ({
              ...job,
              applicantCount: appCounts[job.id] || 0
            }));
          }
        }

        // 4. Attach Match Scores
        if (user && ['user', 'pending_user'].includes(role)) {
          const { data: matchData, error: matchError } = await supabase.rpc('get_job_matches', {
            p_user_id: user.id
          });

          if (!matchError && matchData) {
            const scoreMap = matchData.reduce((acc, match) => {
              acc[match.job_id] = match.match_score;
              return acc;
            }, {});

            formattedJobs = formattedJobs.map(job => ({
              ...job,
              matchScore: scoreMap[job.id] || 0
            }));
          }
        }

        // 5. Final Formatting
        formattedJobs = formattedJobs.map(job => {
          const company = companiesData?.find(c => c.id === job.company_id);
          
          // 🚨 FIX 2: Safely extract company city to use as a fallback for old jobs
          const companyCity = company?.locations?.city || '';
          
          return {
            ...job,
            // 🚨 FIX 3: Fall back to the company's city if the job itself lacks a location_id
            location: job.locations?.city || companyCity || 'Location not specified',
            company: company?.name || 'Unknown Company',
            is_deaf_accessible: job.is_deaf_accessible || company?.is_deaf_accessible || false,
            skills: job.job_skills?.map(js => js.skills).filter(Boolean) || []
          };
        });

        setJobs(formattedJobs);
      } catch (error) {
        console.error("Error fetching jobs:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchJobsData();
  }, [user, role]);

  return { jobs, companies, isLoading, setJobs }; 
}