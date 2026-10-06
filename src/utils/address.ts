// DonateScreen appends raw GPS coordinates to a donation's address for internal/collector use
// (e.g. "123 Main St (Lat: 28.6139, Long: 77.2090)") — these helpers strip that suffix back out
// for anything shown to a donor/user, and recover the raw coordinates where a map still needs them.
const COORDS_SUFFIX = /\s*\(Lat:\s*([0-9.-]+),\s*Long:\s*([0-9.-]+)\)/i;

export const stripAddressMeta = (address?: string | null): string =>
  (address || '').replace(COORDS_SUFFIX, '').trim();

export const parseAddressCoords = (
  address?: string | null
): { latitude: number; longitude: number } | null => {
  const match = (address || '').match(COORDS_SUFFIX);
  if (!match) return null;
  return { latitude: parseFloat(match[1]), longitude: parseFloat(match[2]) };
};
