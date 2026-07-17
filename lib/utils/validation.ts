/**
 * validation.ts — shared form-input normalization + friendly error copy.
 * Isomorphic: used by the client forms (normalize before sending) and the
 * API routes (normalize again defensively, and turn zod issues into
 * messages a person can act on).
 */

/**
 * Accept the way people actually type websites: "yourspace.com",
 * "www.yourspace.com/contact" — prepend https:// when the protocol is
 * missing. Empty stays empty; genuinely malformed values fall through
 * unchanged so validation can report them.
 */
export function normalizeUrl(raw: string | null | undefined): string {
  const t = (raw ?? '').trim();
  if (!t) return '';
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t.replace(/^\/+/, '')}`;
}

const FIELD_LABELS: Record<string, string> = {
  name: 'Name',
  type: 'Type',
  email: 'Email',
  phone: 'Phone',
  website: 'Website',
  address: 'Address',
  city: 'City',
  country: 'Country',
  tagline: 'Tagline',
  description: 'Description',
  social_instagram: 'Instagram link',
  social_facebook: 'Facebook link',
  social_youtube: 'YouTube link',
  social_tiktok: 'TikTok link',
  certification_id: 'Certification ID',
};

/** Turn a zod issue into copy that says which field and what to do. */
export function friendlyValidationError(field: string, message: string): string {
  const label = FIELD_LABELS[field] ?? field;
  if (/invalid url/i.test(message)) {
    return `${label}: please enter a full web address, e.g. https://yourspace.com`;
  }
  if (/invalid email/i.test(message)) {
    return `${label}: please enter a valid email address`;
  }
  if (/at least 2 character/i.test(message)) {
    return `${label}: this field is required`;
  }
  return `${label}: ${message}`;
}
