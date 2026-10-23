const CITY_PAIRS: Array<[string, string, number]> = [
  ['Sydney', 'Melbourne', 710],
  ['Sydney', 'Brisbane', 730],
  ['Sydney', 'Perth', 3290],
  ['Sydney', 'Adelaide', 1160],
  ['Sydney', 'Canberra', 250],
  ['Sydney', 'Hobart', 1050],
  ['Sydney', 'Gold Coast', 680],
  ['Melbourne', 'Brisbane', 1370],
  ['Melbourne', 'Perth', 2720],
  ['Melbourne', 'Adelaide', 650],
  ['Melbourne', 'Canberra', 470],
  ['Melbourne', 'Hobart', 560],
  ['Melbourne', 'Gold Coast', 1330],
  ['Brisbane', 'Perth', 3610],
  ['Brisbane', 'Adelaide', 1600],
  ['Brisbane', 'Canberra', 950],
  ['Brisbane', 'Hobart', 1790],
  ['Brisbane', 'Gold Coast', 70],
  ['Perth', 'Adelaide', 2130],
  ['Perth', 'Canberra', 3080],
  ['Perth', 'Hobart', 3010],
  ['Perth', 'Gold Coast', 3590],
  ['Adelaide', 'Canberra', 960],
  ['Adelaide', 'Hobart', 1160],
  ['Adelaide', 'Gold Coast', 1600],
  ['Canberra', 'Hobart', 850],
  ['Canberra', 'Gold Coast', 950],
  ['Hobart', 'Gold Coast', 1790],
];

const CITY_KM = new Map<string, number>();
for (const [from, to, km] of CITY_PAIRS) {
  CITY_KM.set(`${from}|${to}`, km);
  CITY_KM.set(`${to}|${from}`, km);
}

export interface DiscoverFilters {
  minAge: number;
  maxAge: number;
  maxDistanceKm: number;
  showGender: 'all' | 'man' | 'woman';
}

export function coarseCityKm(fromCity: string, toCity: string): number | null {
  if (!fromCity || !toCity) return null;
  if (fromCity === toCity) return 0;
  return CITY_KM.get(`${fromCity}|${toCity}`) ?? null;
}

export function normalizeDiscoverFilters(input: Partial<DiscoverFilters> | null | undefined): DiscoverFilters {
  const minRaw = Number(input?.minAge);
  const maxRaw = Number(input?.maxAge);
  let minAge = Number.isFinite(minRaw) ? Math.round(minRaw) : 18;
  let maxAge = Number.isFinite(maxRaw) ? Math.round(maxRaw) : 50;
  minAge = Math.min(100, Math.max(18, minAge));
  maxAge = Math.min(100, Math.max(18, maxAge));
  if (maxAge < minAge) maxAge = minAge;
  const distanceRaw = Number(input?.maxDistanceKm);
  const maxDistanceKm = Math.min(100, Math.max(1, Number.isFinite(distanceRaw) ? Math.round(distanceRaw) : 100));
  const showGender = input?.showGender === 'man' || input?.showGender === 'woman' ? input.showGender : 'all';
  return { minAge, maxAge, maxDistanceKm, showGender };
}

export function profileFitsDiscover(
  profile: { age: number; gender: string; city: string },
  viewerCity: string,
  filters: DiscoverFilters,
): { ok: boolean; distanceKm: number | null } {
  if (!Number.isFinite(profile.age) || profile.age < 18) return { ok: false, distanceKm: null };
  if (profile.age < filters.minAge || profile.age > filters.maxAge) return { ok: false, distanceKm: null };
  if (filters.showGender !== 'all' && profile.gender !== filters.showGender) return { ok: false, distanceKm: null };
  const distanceKm = coarseCityKm(viewerCity, profile.city);
  if (distanceKm === null || distanceKm > filters.maxDistanceKm) return { ok: false, distanceKm };
  return { ok: true, distanceKm };
}
