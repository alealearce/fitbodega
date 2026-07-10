/**
 * scripts/scrape-listing-heroes.mjs
 * Second-pass image hunt: fetch each site's homepage HTML and collect
 * candidate hero images (img src/srcset, preloads, inline background-image),
 * skip logo-ish URLs, download the largest candidate per site into
 * public/listings/candidates/<slug>-N.<ext> for manual review.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const OUT = path.join(process.cwd(), "public", "listings", "candidates");

const SITES = [
  { slug: "house-concepts",       url: "https://houseconcepts.com/" },
  { slug: "equinox-vancouver",    url: "https://www.equinox.com/clubs/canada/vancouver/westgeorgiast" },
  { slug: "aetherhaus",           url: "https://www.aetherhaus.ca/" },
  { slug: "regen-recovery",       url: "https://regen-recovery.ca/" },
  { slug: "the-program-fitness",  url: "https://theprogramfitness.com/" },
  { slug: "le-physique",          url: "https://www.lephysique.com/" },
  { slug: "flight-crew-run-club", url: "https://vanrunco.com/pages/flight-crew" },
  { slug: "lotus-cycling-club",   url: "https://www.lotuscyclingclub.com/" },
  { slug: "no-sweat-nutrition",   url: "https://nosweatnutrition.ca/" },
  { slug: "body-energy-club",     url: "https://www.bodyenergyclub.com/" },
  { slug: "vancouver-united-fc",  url: "https://vancouverunitedfc.com/" },
];

const UA = { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36" };
const BAD = /logo|icon|favicon|sprite|badge|avatar|placeholder|\.svg|\.gif/i;
const GOOD_EXT = /\.(jpe?g|png|webp|avif)(\?|$)/i;

function extractCandidates(html, baseUrl) {
  const urls = new Set();
  const push = (u) => {
    if (!u) return;
    try {
      const abs = new URL(u.replace(/&amp;/g, "&"), baseUrl).href;
      if (BAD.test(abs)) return;
      if (!GOOD_EXT.test(abs) && !/format=|\/cdn\.|image/i.test(abs)) return;
      urls.add(abs);
    } catch {}
  };

  for (const m of html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)) push(m[1]);
  for (const m of html.matchAll(/<img[^>]+srcset=["']([^"']+)["']/gi)) {
    const parts = m[1].split(",").map(s => s.trim().split(/\s+/));
    const widest = parts.sort((a, b) => (parseInt(b[1]) || 0) - (parseInt(a[1]) || 0))[0];
    push(widest?.[0]);
  }
  for (const m of html.matchAll(/<link[^>]+rel=["']preload["'][^>]+as=["']image["'][^>]+href=["']([^"']+)["']/gi)) push(m[1]);
  for (const m of html.matchAll(/background(?:-image)?\s*:\s*url\(["']?([^"')]+)["']?\)/gi)) push(m[1]);
  for (const m of html.matchAll(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/gi)) push(m[1]);
  return [...urls];
}

await mkdir(OUT, { recursive: true });

for (const site of SITES) {
  try {
    const res = await fetch(site.url, { headers: UA, redirect: "follow", signal: AbortSignal.timeout(20000) });
    if (!res.ok) { console.log(`${site.slug}: page ${res.status}`); continue; }
    const html = await res.text();
    const candidates = extractCandidates(html, site.url);

    // Download up to 5 candidates, keep the ones over 40KB (photo-sized)
    let kept = 0;
    for (const imgUrl of candidates.slice(0, 12)) {
      if (kept >= 3) break;
      try {
        const r = await fetch(imgUrl, { headers: UA, redirect: "follow", signal: AbortSignal.timeout(20000) });
        if (!r.ok) continue;
        const type = r.headers.get("content-type") ?? "";
        if (!type.startsWith("image/") || type.includes("svg")) continue;
        const buf = Buffer.from(await r.arrayBuffer());
        if (buf.length < 40000) continue; // skip small/logo-sized files
        const ext = type.includes("webp") ? "webp" : type.includes("png") ? "png" : type.includes("avif") ? "avif" : "jpg";
        kept++;
        await writeFile(path.join(OUT, `${site.slug}-${kept}.${ext}`), buf);
        console.log(`${site.slug}: saved #${kept} ${(buf.length / 1024).toFixed(0)}KB ${imgUrl.slice(0, 110)}`);
      } catch {}
    }
    if (!kept) console.log(`${site.slug}: no photo-sized candidates (${candidates.length} urls scanned)`);
  } catch (e) {
    console.log(`${site.slug}: ERR ${e.message}`);
  }
}
