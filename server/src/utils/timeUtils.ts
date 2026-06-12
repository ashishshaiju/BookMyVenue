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

  // If it's a pure number string, parse it as milliseconds
  if (/^\d+$/.test(duration)) {
    return parseInt(duration, 10);
  }

  const match = duration.match(/^(\d+)([smhd])$/i);
  if (!match) {
    throw new Error(`Invalid duration format: "${duration}". Expected format like "60s", "30m", "24h", "7d".`);
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
