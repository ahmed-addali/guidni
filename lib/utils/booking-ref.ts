const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

/**
 * Generates a booking reference in the format GDN-YYYYMMDD-XXXX
 * where XXXX is 4 uppercase alphanumeric characters (A-Z, 0-9).
 * Example: GDN-20260322-A4B2
 */
export function generateBookingRef(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = Array.from(
    { length: 4 },
    () => CHARS[Math.floor(Math.random() * CHARS.length)]
  ).join("");
  return `GDN-${date}-${suffix}`;
}
