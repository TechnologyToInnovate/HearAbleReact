/**
 * Sorts an array of objects based on a standard naming convention (name_asc, date_desc, etc.).
 * 
 * @param {Array} array - The array of objects to sort.
 * @param {string} sortMode - The sort format (e.g., 'name_asc', 'date_desc').
 * @param {string} nameKey - The object key containing the string to alphabetize.
 * @param {string} dateKey - The object key containing the date string.
 */
export const sortData = (array, sortMode, nameKey = 'name', dateKey = 'created_at') => {
  // Create a shallow copy to avoid mutating the original array directly
  return [...array].sort((a, b) => {
    if (sortMode === 'name_asc') {
      return (a[nameKey] || '').localeCompare(b[nameKey] || '');
    }
    if (sortMode === 'name_desc') {
      return (b[nameKey] || '').localeCompare(a[nameKey] || '');
    }
    if (sortMode === 'date_asc') {
      return new Date(a[dateKey] || 0) - new Date(b[dateKey] || 0);
    }
    if (sortMode === 'date_desc') {
      return new Date(b[dateKey] || 0) - new Date(a[dateKey] || 0);
    }
    return 0;
  });
};