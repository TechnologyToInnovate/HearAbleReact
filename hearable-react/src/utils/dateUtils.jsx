/**
 * Formats a date string into "Month Day, Year" (e.g., "Oct 24, 2023").
 */
export const formatStandardDate = (dateString) => {
  if (!dateString) return 'Unknown';
  return new Date(dateString).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
};

/**
 * Formats a date string into "MM/DD/YYYY" (e.g., "10/24/2023").
 */
export const formatShortDate = (dateString) => {
  if (!dateString) return 'Unknown';
  return new Date(dateString).toLocaleDateString();
};

/**
 * Calculates the number of days between today and a given date.
 */
export const calculateDaysSince = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  return Math.ceil(Math.abs(new Date() - date) / (1000 * 60 * 60 * 24));
};