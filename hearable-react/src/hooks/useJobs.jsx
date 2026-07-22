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
        const { data: companiesData } = await supabase
          .from('companies')
          .select('*, locations(city, country)');
          
        if (companiesData) setCompanies(companiesData);

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
          const companyCity = company?.locations?.city || '';
          
          // 🚨 NEW LOGIC: Calculate accessibility based ONLY on the 4 checkboxes
          const hasDeafBadge = company?.has_interpreters || company?.has_trained_staff || company?.has_visual_alarms || company?.has_captioning;
          
          return {
            ...job,
            location: job.locations?.city || companyCity || 'Location not specified',
            company: company?.name || 'Unknown Company',
            
            // 🚨 STRICT FIX 1: Pass the dynamically calculated badge check instead of the broken database boolean
            is_deaf_accessible: hasDeafBadge || false,
            
            // 🚨 STRICT FIX 2: Attach the entire company object so our UI cards can read the 4 checkboxes!
            companies: company || null,
            
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