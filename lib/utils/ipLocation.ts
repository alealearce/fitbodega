import { headers } from 'next/headers';

export interface IpLocation {
  lat: number;
  lon: number;
  city: string | null;
}

/**
 * Resolve an approximate location from the request's edge-provider headers.
 * Works on Vercel (`x-vercel-ip-*`) and Cloudflare (`cf-iplatitude`).
 * Returns null in local dev / non-edge environments.
 */
export async function getIpLocation(): Promise<IpLocation | null> {
  const h = await headers();

  const lat =
    h.get('x-vercel-ip-latitude') ?? h.get('cf-iplatitude') ?? null;
  const lon =
    h.get('x-vercel-ip-longitude') ?? h.get('cf-iplongitude') ?? null;
  if (!lat || !lon) return null;

  const latNum = parseFloat(lat);
  const lonNum = parseFloat(lon);
  if (!Number.isFinite(latNum) || !Number.isFinite(lonNum)) return null;

  const cityRaw = h.get('x-vercel-ip-city') ?? h.get('cf-ipcity') ?? null;
  return {
    lat: latNum,
    lon: lonNum,
    city: cityRaw ? decodeURIComponent(cityRaw) : null,
  };
}
