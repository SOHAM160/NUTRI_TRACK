/**
 * Timezone-aware date utilities for production deployment.
 * 
 * On Render/cloud servers, new Date() returns UTC.
 * The frontend sends the user's timezone via the 'x-timezone' header
 * (e.g. 'Asia/Kolkata'). This utility computes the correct "today"
 * boundaries in UTC that correspond to the user's local day.
 */

/**
 * Get the start and end of "today" in UTC, adjusted for the user's timezone.
 * 
 * Example: If user is in Asia/Kolkata (UTC+5:30), and it's Jul 18 00:14 IST,
 * the UTC time is Jul 17 18:44 UTC. "Today" for the user (Jul 18 IST) is:
 *   start = Jul 17 18:30 UTC  (Jul 18 00:00 IST)
 *   end   = Jul 18 18:30 UTC  (Jul 19 00:00 IST)
 * 
 * @param {string} timezone - IANA timezone string, e.g. 'Asia/Kolkata'
 * @returns {{ today: Date, tomorrow: Date }}
 */
export const getTodayRange = (timezone) => {
  const now = new Date();
  
  if (!timezone) {
    // Fallback: use server time (UTC on cloud)
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return { today, tomorrow };
  }

  // Get the current date string in the user's timezone
  const localDateStr = now.toLocaleDateString('en-CA', { timeZone: timezone }); // 'YYYY-MM-DD'
  
  // Create midnight in the user's timezone by computing the UTC offset
  const localMidnight = new Date(`${localDateStr}T00:00:00`);
  
  // Get the timezone offset at that local midnight
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  
  // Parse the user's current time in their timezone to get offset
  const parts = formatter.formatToParts(now);
  const getPart = (type) => parts.find(p => p.type === type)?.value;
  
  const userLocalStr = `${getPart('year')}-${getPart('month')}-${getPart('day')}T${getPart('hour')}:${getPart('minute')}:${getPart('second')}`;
  const userLocalDate = new Date(userLocalStr);
  
  // Offset = UTC time - local time (in ms)
  const offsetMs = now.getTime() - userLocalDate.getTime();
  
  // Today midnight in the user's timezone, expressed in UTC
  const todayUTC = new Date(`${localDateStr}T00:00:00Z`);
  todayUTC.setTime(todayUTC.getTime() + offsetMs);
  
  const tomorrowUTC = new Date(todayUTC);
  tomorrowUTC.setTime(tomorrowUTC.getTime() + 24 * 60 * 60 * 1000);
  
  return { today: todayUTC, tomorrow: tomorrowUTC };
};

/**
 * Get start date for "last N days" queries, adjusted for timezone.
 * 
 * @param {string} timezone - IANA timezone string
 * @param {number} days - Number of days to go back
 * @returns {Date} - Start date in UTC
 */
export const getDaysAgoRange = (timezone, days) => {
  const { today } = getTodayRange(timezone);
  const start = new Date(today);
  start.setTime(start.getTime() - days * 24 * 60 * 60 * 1000);
  return start;
};

/**
 * Get local YYYY-MM-DD string for a date in a specific timezone.
 * 
 * @param {Date} date
 * @param {string} timezone - IANA timezone string (optional)
 * @returns {string} - 'YYYY-MM-DD'
 */
export const toLocalDateString = (date, timezone) => {
  if (timezone) {
    return date.toLocaleDateString('en-CA', { timeZone: timezone }); // 'YYYY-MM-DD'
  }
  // Fallback: server-local date
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
