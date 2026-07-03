import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { formatStandardDate } from '../utils/dateUtils';

export const useJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchJobs = async () => {
    setIsLoading(true);
    
    const { data: jobsData } = await supabase
      .from('jobs')
      .select('*, job_skills(skills(id, name))')
      .order('created_at', { ascending: false });
      
    const { data: companiesData } = await supabase.from('companies').select('*');
    const { data: appsData } = await supabase.from('applications').select('job_id');

    if (jobsData) {
      const formattedJobs = jobsData.map(job => {
        const company = companiesData?.find(c => c.id === job.company_id);
        const applicantCount = appsData ? appsData.filter(app => app.job_id === job.id).length : 0;
        
        const mappedSkills = job.job_skills ? job.job_skills.map(js => ({
          id: js.skills.id,
          name: js.skills.name
        })) : [];
        
        return {
          ...job,
          skills: mappedSkills,
          company: company ? company.name : 'Unknown Company',
          is_deaf_accessible: company ? company.is_deaf_accessible : false,
          applicantCount: applicantCount,
          date: formatStandardDate(job.created_at)
        };
      });
      setJobs(formattedJobs);
      setCompanies(companiesData || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  return { jobs, companies, isLoading, setJobs };
};