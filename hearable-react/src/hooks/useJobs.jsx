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
        // 1. Fetch Companies (Used for mapping company names and logos to the job cards)
        const { data: companiesData } = await supabase.from('companies').select('*');
        if (companiesData) setCompanies(companiesData);

        // 2. Build the Base Jobs Query (Includes the nested skills)
        let query = supabase
          .from('jobs')
          .select(`
            *,
            job_skills (
              skills (*)
            )
          `)
          .order('created_at', { ascending: false });

        // 🚨 THE FIX: Conditionally filter jobs based on role.
        // Regular users and guests only see Approved jobs. 
        // Admins (and Companies) bypass this, allowing them to see Pending and Rejected jobs.
        if (['guest', 'user', 'pending_user', 'rejected_user'].includes(role)) {
          query = query.eq('status', 'Approved');
        }

        const { data: jobsData, error: jobsError } = await query;
        if (jobsError) throw jobsError;

        let formattedJobs = jobsData || [];

        // 3. Attach Applicant Counts (Only for Admins and Companies)
        if (['admin', 'company'].includes(role)) {
          const { data: appsData } = await supabase.from('applications').select('job_id');
          if (appsData) {
            // Tally up the applications per job_id
            const appCounts = appsData.reduce((acc, app) => {
              acc[app.job_id] = (acc[app.job_id] || 0) + 1;
              return acc;
            }, {});
            
            // Inject the count into the job objects
            formattedJobs = formattedJobs.map(job => ({
              ...job,
              applicantCount: appCounts[job.id] || 0
            }));
          }
        }

        // 4. Attach Match Scores (Only for standard, logged-in Users)
        if (user && ['user', 'pending_user'].includes(role)) {
          // Trigger the PostgreSQL Database RPC function
          const { data: matchData, error: matchError } = await supabase.rpc('get_job_matches', {
            p_user_id: user.id
          });

          if (!matchError && matchData) {
            // Map the calculated scores to their respective job IDs
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

        // 5. Final Formatting (Flatten nested arrays and attach company names)
        formattedJobs = formattedJobs.map(job => {
          const company = companiesData?.find(c => c.id === job.company_id);
          
          return {
            ...job,
            company: company?.name || 'Unknown Company',
            // Inherit deaf accessibility from either the specific job posting OR the company profile
            is_deaf_accessible: job.is_deaf_accessible || company?.is_deaf_accessible || false,
            // Flatten the Supabase join into a clean array of skill objects
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
  }, [user, role]); // Re-run if the user logs in/out or their role changes

  // Export setJobs so we can instantly remove a job from the UI if an admin deletes it
  return { jobs, companies, isLoading, setJobs }; 
}