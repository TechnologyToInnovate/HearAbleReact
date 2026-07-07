import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export const useCompanies = () => {
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCompanies = async () => {
    setIsLoading(true);

    // Fetch registered companies with their nested location data
    const { data: regData } = await supabase
      .from('companies')
      .select('*, locations(city, country)');
    const registered = regData || [];

    // Fetch pre-approved companies with their nested location data
    const { data: preData } = await supabase
      .from('pre_approved_companies')
      .select('*, locations(city, country)');
    const preApprovedList = preData || [];

    // Map existing names to avoid duplicating companies that have already completed registration
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