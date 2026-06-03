// Phone country data — covers Guidni's primary markets (MENA + Europe + North America)

export interface PhoneCountry {
  code: string;       // ISO 3166-1 alpha-2
  name: string;       // English name
  nameFr: string;     // French name
  nameAr: string;     // Arabic name
  flag: string;       // Emoji flag
  dialCode: string;   // e.g. "+216"
  placeholder: string; // local part only, e.g. "20 123 456"
  maxDigits: number;  // expected local digit count (without dial code)
  format: (digits: string) => string;
}

function grp(digits: string, ...sizes: number[]): string {
  let pos = 0;
  const parts: string[] = [];
  for (const size of sizes) {
    const chunk = digits.slice(pos, pos + size);
    if (chunk) parts.push(chunk);
    pos += size;
    if (pos >= digits.length) break;
  }
  return parts.join(" ");
}

export const PHONE_COUNTRIES: PhoneCountry[] = [
  // ─── Maghreb ─────────────────────────────────────────────
  {
    code: "TN", name: "Tunisia",      nameFr: "Tunisie",    nameAr: "تونس",
    flag: "🇹🇳", dialCode: "+216", placeholder: "20 123 456", maxDigits: 8,
    format: (d) => grp(d, 2, 3, 3),
  },
  {
    code: "DZ", name: "Algeria",      nameFr: "Algérie",    nameAr: "الجزائر",
    flag: "🇩🇿", dialCode: "+213", placeholder: "551 234 567", maxDigits: 9,
    format: (d) => grp(d, 3, 3, 3),
  },
  {
    code: "MA", name: "Morocco",      nameFr: "Maroc",      nameAr: "المغرب",
    flag: "🇲🇦", dialCode: "+212", placeholder: "612 345 678", maxDigits: 9,
    format: (d) => grp(d, 3, 3, 3),
  },
  {
    code: "LY", name: "Libya",        nameFr: "Libye",      nameAr: "ليبيا",
    flag: "🇱🇾", dialCode: "+218", placeholder: "91 123 4567", maxDigits: 9,
    format: (d) => grp(d, 2, 3, 4),
  },
  // ─── Middle East ─────────────────────────────────────────
  {
    code: "EG", name: "Egypt",        nameFr: "Égypte",     nameAr: "مصر",
    flag: "🇪🇬", dialCode: "+20",  placeholder: "100 123 4567", maxDigits: 10,
    format: (d) => grp(d, 3, 3, 4),
  },
  {
    code: "SA", name: "Saudi Arabia", nameFr: "Arabie Saoudite", nameAr: "السعودية",
    flag: "🇸🇦", dialCode: "+966", placeholder: "51 234 5678", maxDigits: 9,
    format: (d) => grp(d, 2, 3, 4),
  },
  {
    code: "AE", name: "UAE",          nameFr: "Émirats Arabes", nameAr: "الإمارات",
    flag: "🇦🇪", dialCode: "+971", placeholder: "50 123 4567", maxDigits: 9,
    format: (d) => grp(d, 2, 3, 4),
  },
  {
    code: "QA", name: "Qatar",        nameFr: "Qatar",      nameAr: "قطر",
    flag: "🇶🇦", dialCode: "+974", placeholder: "3312 3456", maxDigits: 8,
    format: (d) => grp(d, 4, 4),
  },
  {
    code: "KW", name: "Kuwait",       nameFr: "Koweït",     nameAr: "الكويت",
    flag: "🇰🇼", dialCode: "+965", placeholder: "5012 3456", maxDigits: 8,
    format: (d) => grp(d, 4, 4),
  },
  {
    code: "BH", name: "Bahrain",      nameFr: "Bahreïn",    nameAr: "البحرين",
    flag: "🇧🇭", dialCode: "+973", placeholder: "3600 1234", maxDigits: 8,
    format: (d) => grp(d, 4, 4),
  },
  {
    code: "OM", name: "Oman",         nameFr: "Oman",       nameAr: "عُمان",
    flag: "🇴🇲", dialCode: "+968", placeholder: "9212 3456", maxDigits: 8,
    format: (d) => grp(d, 4, 4),
  },
  {
    code: "JO", name: "Jordan",       nameFr: "Jordanie",   nameAr: "الأردن",
    flag: "🇯🇴", dialCode: "+962", placeholder: "79 012 3456", maxDigits: 9,
    format: (d) => grp(d, 2, 3, 4),
  },
  {
    code: "LB", name: "Lebanon",      nameFr: "Liban",      nameAr: "لبنان",
    flag: "🇱🇧", dialCode: "+961", placeholder: "71 123 456", maxDigits: 8,
    format: (d) => grp(d, 2, 3, 3),
  },
  // ─── Europe ──────────────────────────────────────────────
  {
    code: "FR", name: "France",       nameFr: "France",     nameAr: "فرنسا",
    flag: "🇫🇷", dialCode: "+33",  placeholder: "6 12 34 56 78", maxDigits: 9,
    format: (d) => grp(d, 1, 2, 2, 2, 2),
  },
  {
    code: "DE", name: "Germany",      nameFr: "Allemagne",  nameAr: "ألمانيا",
    flag: "🇩🇪", dialCode: "+49",  placeholder: "151 1234 5678", maxDigits: 11,
    format: (d) => grp(d, 3, 4, 4),
  },
  {
    code: "GB", name: "United Kingdom", nameFr: "Royaume-Uni", nameAr: "المملكة المتحدة",
    flag: "🇬🇧", dialCode: "+44",  placeholder: "7911 123456", maxDigits: 10,
    format: (d) => grp(d, 4, 6),
  },
  {
    code: "ES", name: "Spain",        nameFr: "Espagne",    nameAr: "إسبانيا",
    flag: "🇪🇸", dialCode: "+34",  placeholder: "612 345 678", maxDigits: 9,
    format: (d) => grp(d, 3, 3, 3),
  },
  {
    code: "IT", name: "Italy",        nameFr: "Italie",     nameAr: "إيطاليا",
    flag: "🇮🇹", dialCode: "+39",  placeholder: "312 345 6789", maxDigits: 10,
    format: (d) => grp(d, 3, 3, 4),
  },
  {
    code: "BE", name: "Belgium",      nameFr: "Belgique",   nameAr: "بلجيكا",
    flag: "🇧🇪", dialCode: "+32",  placeholder: "470 12 34 56", maxDigits: 9,
    format: (d) => grp(d, 3, 2, 2, 2),
  },
  {
    code: "NL", name: "Netherlands",  nameFr: "Pays-Bas",   nameAr: "هولندا",
    flag: "🇳🇱", dialCode: "+31",  placeholder: "6 1234 5678", maxDigits: 9,
    format: (d) => grp(d, 1, 4, 4),
  },
  {
    code: "CH", name: "Switzerland",  nameFr: "Suisse",     nameAr: "سويسرا",
    flag: "🇨🇭", dialCode: "+41",  placeholder: "78 123 45 67", maxDigits: 9,
    format: (d) => grp(d, 2, 3, 2, 2),
  },
  // ─── North America ───────────────────────────────────────
  {
    code: "US", name: "United States", nameFr: "États-Unis", nameAr: "الولايات المتحدة",
    flag: "🇺🇸", dialCode: "+1",   placeholder: "202 555 0123", maxDigits: 10,
    format: (d) => grp(d, 3, 3, 4),
  },
  {
    code: "CA", name: "Canada",       nameFr: "Canada",     nameAr: "كندا",
    flag: "🇨🇦", dialCode: "+1",   placeholder: "416 555 0123", maxDigits: 10,
    format: (d) => grp(d, 3, 3, 4),
  },
];

export const DEFAULT_COUNTRY_CODE = "TN";

export function getCountryByCode(code: string): PhoneCountry {
  return PHONE_COUNTRIES.find((c) => c.code === code) ?? PHONE_COUNTRIES[0];
}

/**
 * Given a full phone value like "+216 20 123 456", extract the country and local part.
 * Falls back to Tunisia if no matching dial code found.
 */
export function parsePhoneValue(value: string): { country: PhoneCountry; local: string } {
  if (!value) return { country: getCountryByCode(DEFAULT_COUNTRY_CODE), local: "" };

  // Try to match the longest dial code first (to avoid +1 matching +216)
  const sorted = [...PHONE_COUNTRIES].sort(
    (a, b) => b.dialCode.length - a.dialCode.length
  );

  const stripped = value.trim();
  for (const country of sorted) {
    if (stripped.startsWith(country.dialCode)) {
      const local = stripped.slice(country.dialCode.length).trim();
      return { country, local };
    }
  }

  // No dial code prefix — return raw as local with default country
  return { country: getCountryByCode(DEFAULT_COUNTRY_CODE), local: value };
}

/**
 * Strip non-digit characters from a string.
 */
export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Format local digits according to country format function, capped at maxDigits.
 */
export function formatLocal(country: PhoneCountry, digits: string): string {
  const capped = digits.slice(0, country.maxDigits);
  return country.format(capped);
}
