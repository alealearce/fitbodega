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

export const DEMO_BLOG_POSTS: BlogPost[] = (wpPosts as WpPost[]).map(p => ({
  id: `wp-${p.wp_id}`,
  created_at: p.date,
  updated_at: p.modified,
  title: p.title,
  slug: p.slug,
  excerpt: p.excerpt || null,
  content: p.content_html,
  author: "FitBodega",
  author_avatar: null,
  cover_image: p.cover_image,
  tags: [],
  is_published: true,
  reading_time_minutes: p.reading_time_minutes,
  category: null,
  city: null,
  meta_title: p.title,
  meta_description: p.excerpt || null,
  published_at: p.date,
  generated_by: "wordpress-import",
}));
