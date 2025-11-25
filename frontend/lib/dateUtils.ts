/**
 * Date utility functions
 * Centralized place for all date formatting and timezone conversions
 */

/**
 * Convert UTC time (HH:MM) to Polish time (Europe/Warsaw)
 */
export function utcToPolishTime(utcTime: string): string {
  if (!utcTime) return '09:00';
  
  const [hours, minutes] = utcTime.split(':').map(Number);
  
  // Create a date object for today with the UTC time
  const now = new Date();
  const utcDate = new Date(Date.UTC(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hours,
    minutes
  ));
  
  // Format to Polish timezone
  const polishTime = utcDate.toLocaleTimeString('pl-PL', {
    timeZone: 'Europe/Warsaw',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  
  return polishTime;
}

/**
 * Convert Polish time (HH:MM) to UTC time
 */
export function polishTimeToUtc(polishTime: string): string {
  if (!polishTime) return '08:00';
  
  const [hours, minutes] = polishTime.split(':').map(Number);
  
  // Create a date in Polish timezone
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${polishTime}:00`;
  
  // Parse as Polish time and get UTC
  const polishDate = new Date(dateStr);
  
  // Get the offset for Europe/Warsaw
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Warsaw',
    timeZoneName: 'shortOffset'
  });
  const parts = formatter.formatToParts(polishDate);
  const offsetPart = parts.find(p => p.type === 'timeZoneName');
  const offsetStr = offsetPart?.value || '+01';
  
  // Parse offset (e.g., "GMT+1" or "GMT+2")
  const offsetMatch = offsetStr.match(/([+-])(\d+)/);
  const offsetHours = offsetMatch ? parseInt(offsetMatch[2]) * (offsetMatch[1] === '+' ? 1 : -1) : 1;
  
  // Calculate UTC hours
  let utcHours = hours - offsetHours;
  if (utcHours < 0) utcHours += 24;
  if (utcHours >= 24) utcHours -= 24;
  
  return `${String(utcHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Format ISO date string to Polish full datetime format
 * Example: "25.11.2024, 14:30"
 */
export function formatDateTime(isoString: string | null): string {
  if (!isoString) return '-';
  const date = new Date(isoString);
  return date.toLocaleString('pl-PL', {
    timeZone: 'Europe/Warsaw',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format ISO date string to short Polish date format
 * Example: "25.11.24"
 */
export function formatDateShort(isoString: string | null): string {
  if (!isoString) return '-';
  const date = new Date(isoString);
  return date.toLocaleDateString('pl-PL', {
    timeZone: 'Europe/Warsaw',
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * Format ISO date string to chart-friendly format
 * Example: "25 lis"
 */
export function formatDateForChart(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pl-PL', { month: 'short', day: 'numeric' });
}

