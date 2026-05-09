const COUNTRY_DIAL_CODES: Record<string, string> = {
  AR: '54',
  US: '1',
  CL: '56',
  BR: '55',
  MX: '52',
  ES: '34',
  UY: '598',
};

/**
 * Normalize an arbitrary phone string (as stored in `propiedades.posting_id`) to E.164.
 * Strips spaces, dashes and parentheses; assumes the configured default country
 * when the input does not include a country prefix.
 *
 * Argentine quirk: WhatsApp expects mobile numbers WITHOUT the `9` (e.g. `+541155557777`,
 * not `+5491155557777`). We don't strip it here — Meta accepts both — but flag it for tweaks.
 */
export function toE164(raw: string, defaultCountryIso = 'AR'): string {
  if (!raw) throw new Error('Empty phone number');
  let digits = String(raw).trim().replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) {
    digits = '+' + digits.slice(1).replace(/\D/g, '');
    if (digits.length < 8) throw new Error(`Phone too short: ${raw}`);
    return digits;
  }
  digits = digits.replace(/\D/g, '');
  const dial = COUNTRY_DIAL_CODES[defaultCountryIso.toUpperCase()] ?? '54';
  if (digits.startsWith(dial)) return `+${digits}`;
  return `+${dial}${digits}`;
}

/** WhatsApp returns `wa_id` without the `+`. Mirror that for matching. */
export function toWaId(e164: string): string {
  return e164.replace(/^\+/, '');
}
