/**
 * scripts/import-wp-blog.mjs
 * One-time migration: pull every published post from the old WordPress site
 * (fitbodega.com) via the public REST API, download featured images to
 * public/blog/, and write data/blog-posts.json.
 *
 * Posts live at root-level slugs on WP (fitbodega.com/<slug>/) — the Next.js
 * app serves them at the same URLs via app/[locale]/[slug] to preserve
 * existing Google rankings.
 *
 * Usage: node scripts/import-wp-blog.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const WP = "https://fitbodega.com/wp-json/wp/v2";
const OUT_JSON = path.join(process.cwd(), "data", "blog-posts.json");
const IMG_DIR = path.join(process.cwd(), "public", "blog");

function stripTags(html) {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#8217;/g, "’")
    .replace(/&#8216;/g, "‘")
    .replace(/&#8220;/g, "“")
    .replace(/&#8221;/g, "”")
    .replace(/&#8211;/g, "–")
    .replace(/&#8212;/g, "—")
    .replace(/&nbsp;/g, " ")
    .replace(/&hellip;/g, "…");
}

async function fetchAllPosts() {
  const posts = [];
  let page = 1;
  for (;;) {
    const res = await fetch(`${WP}/posts?per_page=100&page=${page}&_embed=wp:featuredmedia&status=publish`);
    if (res.status === 400) break; // past the last page
    if (!res.ok) throw new Error(`WP fetch failed p${page}: ${res.status}`);
    const batch = await res.json();
    posts.push(...batch);
    const totalPages = Number(res.headers.get("x-wp-totalpages") ?? 1);
    if (page >= totalPages) break;
    page++;
  }
  return posts;
}

async function downloadImage(url, slug) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const ext = (new URL(url).pathname.match(/\.(jpe?g|png|webp|gif|avif)$/i)?.[1] ?? "jpg").toLowerCase();
    const file = `${slug}.${ext}`;
    const buf = Buffer.from(await res.arrayBuffer());
    await writeFile(path.join(IMG_DIR, file), buf);
    return `/blog/${file}`;
  } catch {
    return null;
  }
}

/** Rewrite WP-internal upload URLs in post HTML to be absolute (they stay on
 *  the old host until go-live; the go-live script can localize them later). */
function absolutizeContent(html) {
  return html.replaceAll('src="/wp-content', 'src="https://fitbodega.com/wp-content');
}

const wpPosts = await fetchAllPosts();
console.log(`Fetched ${wpPosts.length} posts`);

await mkdir(path.dirname(OUT_JSON), { recursive: true });
await mkdir(IMG_DIR, { recursive: true });

const out = [];
for (const p of wpPosts) {
  const slug = p.slug;
  const media = p._embedded?.["wp:featuredmedia"]?.[0];
  const remoteCover = media?.source_url ?? null;
  const cover = remoteCover ? await downloadImage(remoteCover, slug) : null;

  const contentHtml = absolutizeContent(p.content?.rendered ?? "");
  const excerpt = decodeEntities(stripTags(p.excerpt?.rendered ?? "")).slice(0, 300);
  const plain = stripTags(contentHtml);
  const readingTime = Math.max(1, Math.round(plain.split(/\s+/).length / 220));

  out.push({
    slug,
    title: decodeEntities(p.title?.rendered ?? slug),
    date: p.date,
    modified: p.modified,
    excerpt,
    content_html: contentHtml,
    cover_image: cover,
    reading_time_minutes: readingTime,
    wp_id: p.id,
    original_url: p.link,
  });
  console.log(`  ok ${slug}${cover ? " (+cover)" : ""}`);
}

out.sort((a, b) => new Date(b.date) - new Date(a.date));
await writeFile(OUT_JSON, JSON.stringify(out, null, 2));
console.log(`Wrote ${out.length} posts -> ${OUT_JSON}`);
