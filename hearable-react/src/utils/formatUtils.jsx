/**
 * Joins a first and last name safely, falling back to a default if both are empty.
 */
export const formatFullName = (firstName, lastName, fallback = 'Incomplete Profile') => {
  const fullName = [firstName, lastName].filter(Boolean).join(' ');
  return fullName || fallback;
};

/**
 * Joins a city and country safely.
 */
export const formatLocation = (city, country, fallback = 'Location not specified') => {
  const location = [city, country].filter(Boolean).join(', ');
  return location || fallback;
};

/**
 * Gets the first initial of a name for avatars.
 */
export const getInitial = (name, fallback = 'U') => {
  if (!name || typeof name !== 'string') return fallback;
  return name.charAt(0).toUpperCase();
};