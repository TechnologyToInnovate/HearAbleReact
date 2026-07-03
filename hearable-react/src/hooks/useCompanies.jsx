import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export const useCompanies = () => {
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCompanies = async () => {
    setIsLoading(true);

    const { data: regData } = await supabase.from('companies').select('*');
    const registered = regData || [];

    const { data: preData } = await supabase.from('pre_approved_companies').select('*');
    const preApprovedList = preData || [];

    const registeredNames = registered.map(c => c.name.toLowerCase());

    const pendingPreApproved = preApprovedList
      .filter(pc => !registeredNames.includes(pc.name.toLowerCase()))
      .map(pc => ({
        ...pc,
        id: pc.id || `pre-${pc.email}`,
        status: 'Pre-Approved',
        description: pc.description || 'Pre-approved account. Waiting for the company to sign up.',
        isPreApprovedOnly: true,
        created_at: pc.created_at || new Date().toISOString()
      }));

    setCompanies([...registered, ...pendingPreApproved]);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  return { companies, isLoading, setCompanies, refetch: fetchCompanies };
};