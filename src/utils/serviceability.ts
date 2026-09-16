// PunahChakra currently only operates in Delhi and Noida/Greater Noida (Gautam Buddh
// Nagar district). Pincode ranges below reflect India Post's allocation for those areas.
const SERVICEABLE_PINCODE_RANGES: Array<[number, number]> = [
  [110001, 110099], // Delhi
  [201301, 201318], // Noida / Greater Noida (Gautam Buddh Nagar)
];

export function isServiceablePincode(pincode: string): boolean {
  if (!/^\d{6}$/.test(pincode)) return false;
  const value = Number(pincode);
  return SERVICEABLE_PINCODE_RANGES.some(([min, max]) => value >= min && value <= max);
}
