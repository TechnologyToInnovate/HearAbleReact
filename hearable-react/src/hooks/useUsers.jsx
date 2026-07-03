import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { formatFullName } from '../utils/formatUtils';
import { formatShortDate } from '../utils/dateUtils';

export const useUsers = (role) => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Only admins should fetch this data
    if (role !== 'admin') {
      setIsLoading(false);
      return;
    }

    async function fetchUsers() {
      setIsLoading(true);
      try {
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select(`*, degrees ( name, abbreviation ), batches ( batch_number )`);

        if (error) throw error;

        // Fetch IDs to filter out
        const { data: companies } = await supabase.from('companies').select('id');
        const companyIds = companies ? companies.map(c => c.id) : [];

        const { data: admins } = await supabase.from('admins').select('id');
        const adminIds = admins ? admins.map(a => a.id).filter(Boolean) : [];

        // Map and filter
        const mappedProfiles = profiles
          .filter(user => !companyIds.includes(user.id) && !adminIds.includes(user.id))
          .map(p => ({
            ...p,
            name: formatFullName(p.first_name, p.last_name), 
            degreeText: p.degrees ? (p.degrees.abbreviation ? `${p.degrees.abbreviation} - ${p.degrees.name}` : p.degrees.name) : null,
            batchText: p.batches ? String(p.batches.batch_number) : null,
            joinDate: p.created_at ? formatShortDate(p.created_at) : 'Unknown'
          }));

        setUsers(mappedProfiles);
      } catch (error) {
        console.error("Error fetching users:", error);
        alert("Error fetching users: " + error.message);
      }
      setIsLoading(false);
    }

    fetchUsers();
  }, [role]);

  // We return setUsers so the component can optimistically update state (e.g., when approving/archiving)
  return { users, isLoading, setUsers };
};