/**
 * Parses a duration string (e.g., '60s', '30m', '24h', '7d') into milliseconds.
 * If the input is already a number or a pure numeric string, it is treated as milliseconds.
 *
 * Supports units:
 * - s: seconds
 * - m: minutes
 * - h: hours
 * - d: days
 */
export const parseDurationToMs = (duration: string | number): number => {
  if (typeof duration === 'number') {
    return duration;
  }
  if (/^\d+$/.test(duration)) {
    return parseInt(duration, 10);
  }

  const match = /^(\d+)([smhd])$/i.exec(duration);
  if (!match) {
    throw new Error(
      `Invalid duration format: "${duration}". Expected format like "60s", "30m", "24h", "7d".`
    );
  }

  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      return 0;
  }
};

// Converts "09:30" to 570
export const timeStringToMinutes = (timeString: string): number => {
  const [hours, minutes] = timeString.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) throw new Error(`Invalid time string: ${timeString}`);
  return hours * 60 + minutes;
};

// Converts 570 to "09:30"
export const minutesToTimeString = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

// Collision formula
export const checkOverlap = (
  slotStart: number,
  slotEnd: number,
  conflicts: { start: number; end: number }[]
): boolean => {
  return conflicts.some(
    (conflict) => slotStart < conflict.end && slotEnd > conflict.start
  );
};