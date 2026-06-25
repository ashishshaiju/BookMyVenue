/**
 * Parses a "HH:MM" string into minutes from midnight.
 * Example: "14:30" -> 870
 */
export function parseTimeToMinutes(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map((str) => parseInt(str, 10));
  if (isNaN(hours) || isNaN(minutes)) {
    throw new Error(`Invalid time format: ${timeString}`);
  }
  return hours * 60 + minutes;
}

/**
 * Formats minutes from midnight into "HH:MM".
 * Example: 870 -> "14:30"
 */
export function formatMinutesToTime(minutesFromMidnight: number): string {
  const h = Math.floor(minutesFromMidnight / 60);
  const m = minutesFromMidnight % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}
