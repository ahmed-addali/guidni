/**
 * Generates a URL-friendly slug from a string.
 * Handles Latin, Arabic, and accented characters.
 * Example: "Djerba Camel Ride!" → "djerba-camel-ride"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")                    // decompose accented chars
    .replace(/[\u0300-\u036f]/g, "")     // strip accent marks
    .replace(/[\u0600-\u06FF\s]+/g, "-") // replace Arabic chars + whitespace with dash
    .replace(/[^a-z0-9]+/g, "-")         // replace non-alphanumeric with dash
    .replace(/^-+|-+$/g, "")             // trim leading/trailing dashes
    .replace(/-{2,}/g, "-");             // collapse multiple dashes
}

/**
 * Appends a short random suffix to guarantee uniqueness.
 * Example: "camel-ride" → "camel-ride-a3f2"
 */
export function uniqueSlug(base: string): string {
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${slugify(base)}-${suffix}`;
}
