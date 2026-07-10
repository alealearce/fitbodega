/**
 * lib/demo/blog.ts — FitBodega
 * Maps the migrated WordPress export (data/blog-posts.json) to BlogPost rows.
 * These are the site's real 57 ranked posts — served at their original
 * root-level slugs to preserve Google rankings. Used by the mock client in
 * demo mode and by the go-live seed script.
 */
import type { BlogPost } from "@/lib/supabase/types";
import wpPosts from "@/data/blog-posts.json";

interface WpPost {
  slug: string;
  title: string;
  date: string;
  modified: string;
  excerpt: string;
  content_html: string;
  cover_image: string | null;
  reading_time_minutes: number;
  wp_id: number;
  original_url: string;
}

/**
 * Every WP post embeds a hero image near the top of the body (a
 * wp-block-image figure right after the first heading). Posts that also
 * have a featured image would show the same picture twice — once as our
 * rendered cover, once inline. Normalize: pull the leading figure out of
 * the body, and when the post has no featured image, promote that inline
 * image to be the cover.
 */
function extractLeadingHero(p: WpPost): { content: string; cover: string | null } {
  const html = p.content_html;
  const figureRe = /<figure[^>]*wp-block-image[^>]*>[\s\S]*?<\/figure>/i;
  const match = html.match(figureRe);

  // Only treat it as the hero if it sits near the top of the post.
  if (!match || match.index === undefined || match.index > 800) {
    return { content: html, cover: p.cover_image };
  }

  const src = match[0].match(/<img[^>]+src="([^"]+)"/i)?.[1] ?? null;
  const content = html.replace(figureRe, "");
  return { content, cover: p.cover_image ?? src };
}

export const DEMO_BLOG_POSTS: BlogPost[] = (wpPosts as WpPost[]).map(p => {
  const { content, cover } = extractLeadingHero(p);
  return {
    id: `wp-${p.wp_id}`,
    created_at: p.date,
    updated_at: p.modified,
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt || null,
    content,
    author: "FitBodega",
    author_avatar: null,
    cover_image: cover,
    tags: [],
    is_published: true,
    reading_time_minutes: p.reading_time_minutes,
    category: null,
    city: null,
    meta_title: p.title,
    meta_description: p.excerpt || null,
    published_at: p.date,
    generated_by: "wordpress-import",
  };
});
