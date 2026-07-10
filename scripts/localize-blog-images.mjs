/**
 * scripts/localize-blog-images.mjs
 * Downloads every in-content blog image into public/blog/content/ and
 * rewrites data/blog-posts.json to reference the local copies.
 *
 * Why: the WP export's <img src> attributes point at the host's dead
 * staging domain (fitbodega-18289a.ingress-alpha.ewp.live → 404), while
 * the srcset variants on fitbodega.com still resolve. Localizing also
 * removes the dependency on WordPress staying online after go-live.
 *
 * Idempotent — already-local (/blog/...) references are left alone.
 * Usage: node scripts/localize-blog-images.mjs
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const JSON_PATH = path.join(process.cwd(), "data", "blog-posts.json");
const OUT_DIR = path.join(process.cwd(), "public", "blog", "content");
const UA = { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36" };

const DEAD_HOST = /fitbodega-18289a\.ingress-alpha\.ewp\.live/g;

function candidatesFor(imgTag) {
  // Gather every URL in src + srcset, normalize the dead staging host to
  // fitbodega.com, and order by likely resolution (full-size first, then
  // the largest WxH variants).
  const urls = new Set();
  const src = imgTag.match(/\ssrc="([^"]+)"/)?.[1];
  if (src) urls.add(src);
  const srcset = imgTag.match(/\ssrcset="([^"]+)"/)?.[1];
  if (srcset) {
    for (const part of srcset.split(",")) {
      const u = part.trim().split(/\s+/)[0];
      if (u) urls.add(u);
    }
  }
  const normalized = [...urls]
    .filter(u => u.startsWith("http"))
    .map(u => u.replace(DEAD_HOST, "fitbodega.com"));

  const sizeOf = (u) => {
    const m = u.match(/-(\d+)x(\d+)\.\w+$/);
    return m ? parseInt(m[1]) : 1_000_000; // no suffix = original = biggest
  };
  return [...new Set(normalized)].sort((a, b) => sizeOf(b) - sizeOf(a));
}

async function download(url) {
  try {
    const res = await fetch(url, { headers: UA, redirect: "follow", signal: AbortSignal.timeout(20000) });
    if (!res.ok) return null;
    const type = res.headers.get("content-type") ?? "";
    if (!type.startsWith("image/")) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 3000) return null;
    return buf;
  } catch {
    return null;
  }
}

function localName(url) {
  const base = decodeURIComponent(new URL(url).pathname.split("/").pop() ?? "img")
    .replace(/-\d+x\d+(\.\w+)$/, "$1") // strip size suffix
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .slice(-80);
  return base;
}

const posts = JSON.parse(await readFile(JSON_PATH, "utf8"));
await mkdir(OUT_DIR, { recursive: true });

const cache = new Map(); // remote candidate list key -> local path
let saved = 0, failed = 0, rewritten = 0;

for (const post of posts) {
  let html = post.content_html;
  const imgTags = html.match(/<img[^>]+>/g) ?? [];

  for (const tag of imgTags) {
    const src = tag.match(/\ssrc="([^"]+)"/)?.[1];
    if (!src || src.startsWith("/blog/")) continue; // already local

    const candidates = candidatesFor(tag);
    if (candidates.length === 0) continue;
    const key = candidates[0];

    let localPath = cache.get(key);
    if (!localPath) {
      for (const url of candidates) {
        const buf = await download(url);
        if (buf) {
          const name = localName(url);
          await writeFile(path.join(OUT_DIR, name), buf);
          localPath = `/blog/content/${name}`;
          cache.set(key, localPath);
          saved++;
          console.log(`ok  ${post.slug.slice(0, 36)} <- ${name} (${(buf.length / 1024).toFixed(0)}KB)`);
          break;
        }
      }
      if (!localPath) {
        failed++;
        console.log(`FAIL ${post.slug.slice(0, 36)} <- ${key.slice(0, 90)}`);
        continue;
      }
    }

    // Rewrite the whole tag: local src, no srcset/sizes (single asset).
    const newTag = tag
      .replace(/\ssrc="[^"]+"/, ` src="${localPath}"`)
      .replace(/\ssrcset="[^"]*"/, "")
      .replace(/\ssizes="[^"]*"/, "");
    html = html.replace(tag, newTag);
    rewritten++;
  }

  post.content_html = html;

  // Covers: local ones (/blog/...) stay; remote ones get the same treatment.
  if (post.cover_image && post.cover_image.startsWith("http")) {
    const cand = [post.cover_image.replace(DEAD_HOST, "fitbodega.com")];
    const buf = await download(cand[0]);
    if (buf) {
      const name = localName(cand[0]);
      await writeFile(path.join(OUT_DIR, name), buf);
      post.cover_image = `/blog/content/${name}`;
      saved++;
    }
  }
}

await writeFile(JSON_PATH, JSON.stringify(posts, null, 2));
console.log(`\ndone: ${saved} images saved, ${rewritten} tags rewritten, ${failed} failed`);
