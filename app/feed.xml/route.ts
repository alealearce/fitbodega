import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { SITE } from '@/lib/config/site';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

function escapeXml(str: string): string {
  return str
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&apos;');
}

export async function GET() {
  const supabase = createAdminClient();

  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select('title, slug, excerpt, author, cover_image, tags, created_at, updated_at')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('[feed.xml] db error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }

  const buildDate = new Date().toUTCString();
  const lastBuildDate = posts?.[0]?.updated_at
    ? new Date(posts[0].updated_at).toUTCString()
    : buildDate;

  const items = (posts ?? [])
    .map((post) => {
      const url        = `${SITE.url}/${post.slug}`;
      const pubDate    = new Date(post.created_at).toUTCString();
      const title      = escapeXml(post.title);
      const excerpt    = escapeXml(post.excerpt ?? '');
      const author     = escapeXml(post.author);
      const categories = (post.tags ?? [])
        .map((tag: string) => `<category>${escapeXml(tag)}</category>`)
        .join('\n        ');

      return `
    <item>
      <title>${title}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${excerpt}</description>
      <author>${escapeXml(SITE.email)} (${author})</author>
      <pubDate>${pubDate}</pubDate>
      ${categories}
      ${post.cover_image ? `<enclosure url="${escapeXml(post.cover_image)}" type="image/jpeg" length="0"/>` : ''}
    </item>`;
    })
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE.name)} — The Journal</title>
    <link>${SITE.url}/community</link>
    <description>${escapeXml(SITE.description)}</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <pubDate>${buildDate}</pubDate>
    <ttl>60</ttl>
    <atom:link href="${SITE.url}/feed.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${SITE.url}${SITE.logo}</url>
      <title>${escapeXml(SITE.name)}</title>
      <link>${SITE.url}</link>
    </image>
    ${items}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
