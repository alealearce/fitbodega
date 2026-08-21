// Creator network profile — the shared contract between the public form
// (components/creators/CreatorProfileForm.tsx), the API route
// (app/api/creators/profile/route.ts), and the browse page.
//
// A profile row exists only once a creator finishes step 2. Step 1 (the Deal
// Radar email) stands on its own: subscribers with no profile keep getting
// the weekly email, they just are not listed for brands.

export const AUDIENCE_RANGES = [
  'Under 5K',
  '5K–25K',
  '25K–100K',
  '100K–500K',
  '500K+',
] as const;

export const CREATOR_PLATFORMS = [
  'Instagram',
  'TikTok',
  'YouTube',
  'Other',
] as const;

export type AudienceRange = (typeof AUDIENCE_RANGES)[number];
export type CreatorPlatform = (typeof CREATOR_PLATFORMS)[number];

export interface CreatorProfile {
  id: string;
  created_at: string;
  updated_at: string;
  email: string;
  name: string;
  niche: string;
  location: string | null;
  audience_size: string;
  primary_platform: string;
  instagram: string | null;
  tiktok: string | null;
  youtube: string | null;
  website: string | null;
  content_examples: string[];
  note: string | null;
  status: 'live' | 'hidden';
  edit_token: string;
  subscriber_id: string | null;
}

// What the browse page and brand-facing views may read. Email and edit_token
// never leave the server.
export const PUBLIC_PROFILE_COLUMNS =
  'id, created_at, name, niche, location, audience_size, primary_platform, instagram, tiktok, youtube, website, content_examples, note';

export type PublicCreatorProfile = Pick<
  CreatorProfile,
  | 'id'
  | 'created_at'
  | 'name'
  | 'niche'
  | 'location'
  | 'audience_size'
  | 'primary_platform'
  | 'instagram'
  | 'tiktok'
  | 'youtube'
  | 'website'
  | 'content_examples'
  | 'note'
>;

// Handles arrive in every shape a creator types them: "@name", "name",
// "instagram.com/name", a full URL. Store the bare handle, build links here.
export function normalizeHandle(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let s = raw.trim();
  if (!s) return null;
  s = s.replace(/^https?:\/\//i, '').replace(/^www\./i, '');
  s = s.replace(/^(instagram|tiktok|youtube)\.com\//i, '');
  s = s.replace(/^@/, '').replace(/\/.*$/, '').trim();
  return s || null;
}

export function handleUrl(platform: 'instagram' | 'tiktok' | 'youtube', handle: string): string {
  if (platform === 'instagram') return `https://instagram.com/${handle}`;
  if (platform === 'tiktok') return `https://tiktok.com/@${handle}`;
  return `https://youtube.com/@${handle}`;
}
