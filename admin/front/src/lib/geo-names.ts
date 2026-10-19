/** ISO 3166-2:TN governorate codes (as returned by GeoLite2) → names. */
const TN_GOVERNORATES: Record<string, [string, string]> = {
  '11': ['تونس', 'Tunis'],
  '12': ['أريانة', 'Ariana'],
  '13': ['بن عروس', 'Ben Arous'],
  '14': ['منوبة', 'Manouba'],
  '21': ['نابل', 'Nabeul'],
  '22': ['زغوان', 'Zaghouan'],
  '23': ['بنزرت', 'Bizerte'],
  '31': ['باجة', 'Béja'],
  '32': ['جندوبة', 'Jendouba'],
  '33': ['الكاف', 'Le Kef'],
  '34': ['سليانة', 'Siliana'],
  '41': ['القيروان', 'Kairouan'],
  '42': ['القصرين', 'Kasserine'],
  '43': ['سيدي بوزيد', 'Sidi Bouzid'],
  '51': ['سوسة', 'Sousse'],
  '52': ['المنستير', 'Monastir'],
  '53': ['المهدية', 'Mahdia'],
  '61': ['صفاقس', 'Sfax'],
  '71': ['قفصة', 'Gafsa'],
  '72': ['توزر', 'Tozeur'],
  '73': ['قبلي', 'Kébili'],
  '81': ['قابس', 'Gabès'],
  '82': ['مدنين', 'Médenine'],
  '83': ['تطاوين', 'Tataouine'],
};

export function governorateName(
  code: string | null,
  locale: 'ar' | 'fr',
): string | null {
  if (!code) return null;
  const names = TN_GOVERNORATES[code];
  return names ? names[locale === 'ar' ? 0 : 1] : code;
}

const displayNames = new Map<string, Intl.DisplayNames>();

export function countryName(
  code: string | null,
  locale: 'ar' | 'fr',
): string | null {
  if (!code) return null;
  try {
    let names = displayNames.get(locale);
    if (!names) {
      names = new Intl.DisplayNames([locale], { type: 'region' });
      displayNames.set(locale, names);
    }
    return names.of(code) ?? code;
  } catch {
    return code;
  }
}

export function flag(code: string | null): string {
  if (!code || !/^[A-Z]{2}$/.test(code)) return '🌐';
  return String.fromCodePoint(
    ...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65),
  );
}

/** Readable place: "Sfax, Tunisie" / governorate when the city is unknown. */
export function placeLabel(
  place: { country: string | null; region: string | null; city: string | null },
  locale: 'ar' | 'fr',
): string {
  const country = countryName(place.country, locale);
  if (!country) return locale === 'ar' ? 'غير معروف' : 'Inconnu';
  const local =
    place.city ??
    (place.country === 'TN' ? governorateName(place.region, locale) : null);
  return local ? [local, country].join(locale === 'ar' ? '، ' : ', ') : country;
}
