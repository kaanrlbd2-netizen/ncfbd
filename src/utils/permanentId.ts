/**
 * Generates clean alphabetical permanent IDs:
 * 0 -> AA
 * 1 -> AB
 * ...
 * 25 -> AZ
 * 26 -> BA
 * ...
 * 675 -> ZZ
 * 676 -> AAA
 */
export function generatePermanentId(index: number): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  
  if (index < 676) {
    const first = Math.floor(index / 26);
    const second = index % 26;
    return `${letters[first]}${letters[second]}`;
  }

  // 3 letters AAA onwards
  const remaining = index - 676;
  const first = Math.floor(remaining / (26 * 26)) % 26;
  const second = Math.floor((remaining / 26)) % 26;
  const third = remaining % 26;
  return `${letters[first]}${letters[second]}${letters[third]}`;
}
