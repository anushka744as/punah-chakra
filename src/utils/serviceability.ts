// Fallback list used only if the `serviceable_pincodes` table can't be reached (e.g. the
// user is offline). The source of truth is the database — see AppDataContext's
// `serviceablePincodes` and src/services/api.ts's fetch/add/removeServiceablePincode.
export const FALLBACK_SERVICEABLE_PINCODE_LIST = [
  '201301',
  '201303',
  '110091',
  '110092',
  '110096',
];

export function isServiceablePincode(pincode: string, serviceablePincodes: string[]): boolean {
  if (!/^\d{6}$/.test(pincode)) return false;
  return serviceablePincodes.includes(pincode);
}
