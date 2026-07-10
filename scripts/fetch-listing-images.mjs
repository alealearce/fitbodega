/**
 * scripts/fetch-listing-images.mjs
 * Downloads each real listing's og:image (extracted live from its homepage,
 * falling back to a research-provided URL) into public/listings/<slug>.<ext>.
 * Skips svg (logos, not photos). Reports size so we can cull logo-ish covers.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const OUT = path.join(process.cwd(), "public", "listings");

const SITES = [
  { slug: "house-concepts",        url: "https://houseconcepts.com/" },
  { slug: "equinox-vancouver",     url: "https://www.equinox.com/clubs/canada/vancouver/westgeorgiast" },
  { slug: "circle-wellness",       url: "https://circlewellnessspas.com/", fallback: "https://circlewellnessspas.com/wp-content/uploads/2026/03/CW_Home-1-2560x1440-1.webp" },
  { slug: "aetherhaus",            url: "https://www.aetherhaus.ca/" },
  { slug: "regen-recovery",        url: "https://regen-recovery.ca/" },
  { slug: "the-program-fitness",   url: "https://theprogramfitness.com/" },
  { slug: "le-physique",           url: "https://www.lephysique.com/" },
  { slug: "flight-crew-run-club",  url: "https://vanrunco.com/pages/flight-crew" },
  { slug: "lotus-cycling-club",    url: "https://www.lotuscyclingclub.com/" },
  { slug: "vanguard-performance",  url: "https://www.vanguardperformance.ca/clinic/dietitian/", fallback: "https://www.vanguardperformance.ca/images/og/vanguard-clinic.jpg" },
  { slug: "no-sweat-nutrition",    url: "https://nosweatnutrition.ca/", fallback: "https://nosweatnutrition.ca/wp-content/uploads/2025/12/No-Sweat-Nutrition-1.jpg" },
  { slug: "body-energy-club",      url: "https://www.bodyenergyclub.com/" },
  { slug: "greens-market",         url: "https://greensmarket.ca/", fallback: "https://greensmarket.ca/2022/wp-content/uploads/2023/08/team-photo.webp" },
  { slug: "vancouver-united-fc",   url: "https://vancouverunitedfc.com/" },
  { slug: "klm-soccer-club",       url: "https://klmsoccer.ca/", fallback: "https://klmsoccer.ca/wp-content/uploads/2018/06/klm-landscape-preview-min.jpg" },
];

const UA = { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36" };

async function ogImageFrom(url) {
  try {
    const res = await fetch(url, { headers: UA, redirect: "follow", signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    const html = await res.text();
    const m =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ??
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i) ??
      html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
    if (!m) return null;
    return new URL(m[1].replace(/&amp;/g, "&"), url).href;
  } catch {
    return null;
  }
}

await mkdir(OUT, { recursive: true });

for (const site of SITES) {
  const candidates = [await ogImageFrom(site.url), site.fallback].filter(Boolean);
  let saved = false;
  for (const imgUrl of candidates) {
    try {
      if (/\.svg(\?|$)/i.test(imgUrl)) { console.log(`${site.slug}: SKIP svg ${imgUrl}`); continue; }
      const res = await fetch(imgUrl, { headers: UA, redirect: "follow", signal: AbortSignal.timeout(20000) });
      if (!res.ok) continue;
      const type = res.headers.get("content-type") ?? "";
      const ext = type.includes("webp") ? "webp" : type.includes("png") ? "png" : type.includes("avif") ? "avif" : "jpg";
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 5000) { console.log(`${site.slug}: SKIP tiny (${buf.length}B) ${imgUrl}`); continue; }
      await writeFile(path.join(OUT, `${site.slug}.${ext}`), buf);
      console.log(`${site.slug}: OK ${ext} ${(buf.length / 1024).toFixed(0)}KB <- ${imgUrl}`);
      saved = true;
      break;
    } catch (e) {
      console.log(`${site.slug}: ERR ${e.message}`);
    }
  }
  if (!saved) console.log(`${site.slug}: NO IMAGE`);
}
