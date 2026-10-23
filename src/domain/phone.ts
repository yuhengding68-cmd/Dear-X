/** Default country code for DearX phone sign-in. Callers may pass another code. */
export const DEFAULT_COUNTRY_CODE = '+61';

export function normalizePhone(countryCode: string, nationalNumber: string): string | null {
  const code = countryCode.trim();
  if (!/^\+\d{1,4}$/.test(code)) return null;
  let digits = nationalNumber.replace(/\D/g, '');
  if (digits.startsWith('0')) digits = digits.replace(/^0+/, '');
  if (code === '+61') {
    if (!/^4\d{8}$/.test(digits)) return null;
    return `+61${digits}`;
  }
  if (digits.length < 8 || digits.length > 12) return null;
  return `${code}${digits}`;
}
