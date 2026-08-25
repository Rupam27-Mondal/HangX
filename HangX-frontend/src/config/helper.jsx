/**
 * Returns a human-friendly relative time string, e.g. "3 minutes ago".
 * Falls back to a short timestamp for dates older than a week.
 * @param {string | Date} date
 * @returns {string}
 */
export function timeAgo(date) {
  if (!date) return "";
  const now = new Date();
  const past = new Date(date);
  const secondsAgo = Math.floor((now - past) / 1000);

  if (secondsAgo < 5)    return "just now";
  if (secondsAgo < 60)   return `${secondsAgo}s ago`;

  const minutesAgo = Math.floor(secondsAgo / 60);
  if (minutesAgo < 60)   return `${minutesAgo}m ago`;

  const hoursAgo = Math.floor(minutesAgo / 60);
  if (hoursAgo < 24)     return `${hoursAgo}h ago`;

  const daysAgo = Math.floor(hoursAgo / 24);
  if (daysAgo < 7)       return `${daysAgo}d ago`;

  // Older than a week — show a short date
  return past.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/**
 * Formats a full timestamp for the message tooltip.
 * @param {string | Date} date
 * @returns {string}
 */
export function formatTimestamp(date) {
  if (!date) return "";
  return new Date(date).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Generates a deterministic HSL color from a username string.
 * Used to color avatars and username labels consistently per user.
 * @param {string} name
 * @returns {string} HSL color string
 */
export function userColor(name) {
  if (!name) return "hsl(220, 60%, 60%)";
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  // Avoid red-ish hues (reserved for danger) and keep saturation/lightness pleasant
  const safehue = hue < 15 || hue > 345 ? (hue + 40) % 360 : hue;
  return `hsl(${safehue}, 65%, 62%)`;
}

/**
 * Returns an avatar URL from DiceBear using the username as seed.
 * @param {string} name
 * @returns {string}
 */
export function avatarUrl(name) {
  const seed = encodeURIComponent(name || "user");
  return `https://api.dicebear.com/9.x/adventurer/svg?seed=${seed}&backgroundColor=transparent`;
}
