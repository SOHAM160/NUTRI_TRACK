/**
 * Format a date to a readable string
 */
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Format date for input fields
 */
export const formatDateForInput = (date) => {
  const d = new Date(date);
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().split('T')[0];
};

/**
 * Get greeting based on time of day
 */
export const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};

/**
 * Truncate text
 */
export const truncate = (str, length = 50) => {
  if (!str) return '';
  return str.length > length ? str.substring(0, length) + '...' : str;
};

/**
 * Get initials from name
 */
export const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

/**
 * Activity level labels
 */
export const activityLevelLabels = {
  sedentary: 'Sedentary (Little/No Exercise)',
  light: 'Lightly Active (1-3 days/week)',
  moderate: 'Moderately Active (3-5 days/week)',
  active: 'Active (6-7 days/week)',
  very_active: 'Very Active (Hard exercise daily)',
};

/**
 * Goal labels
 */
export const goalLabels = {
  lose_weight: 'Lose Weight',
  maintain: 'Maintain Weight',
  gain_muscle: 'Gain Muscle',
  improve_health: 'Improve Health',
};

/**
 * Meal type colors for charts/badges
 */
export const mealTypeColors = {
  Breakfast: '#f59e0b',
  Lunch: '#10b981',
  Dinner: '#3b82f6',
  Snack: '#8b5cf6',
};
