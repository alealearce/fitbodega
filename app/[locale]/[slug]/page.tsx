import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import type { BlogPost, Listing } from "@/lib/supabase/types";
import { SITE, DEFAULT_OG_IMAGE } from "@/lib/config/site";
import { getListingUrl } from "@/lib/utils/listingUrl";
import { Clock, Calendar, ArrowLeft, ArrowUpRight } from "lucide-react";

/**
 * Root-level article route — /:slug
 *
 * SEO-critical: the 57 migrated WordPress posts already rank at
 * fitbodega.com/<slug>/ and MUST keep serving at those exact URLs.
 * All Journal posts (migrated + future) render here; /community is the index.
 */

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase  = await createClient();

  const { data } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (!data) return { title: "Post Not Found" };

  const metaTitle = data.meta_title ?? data.title;
  const metaDesc = data.meta_description ?? data.excerpt ?? `Read "${data.title}" on ${SITE.name}`;

  return {
    title: metaTitle,
    description: metaDesc,
    alternates: { canonical: `${SITE.url}/${slug}` },
    openGraph: {
      title: metaTitle,
      description: metaDesc,
      url: `${SITE.url}/${slug}`,
      siteName: SITE.name,
      locale: "en_US",
      type: "article",
      publishedTime: data.published_at ?? undefined,
      images: data.cover_image ? [{ url: data.cover_image }] : [DEFAULT_OG_IMAGE],
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const supabase  = await createClient();

  const [postRes, relatedRes] = await Promise.all([
    supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .eq("is_published", true)
      .single(),
    supabase
      .from("blog_posts")
      .select("*")
      .eq("is_published", true)
      .neq("slug", slug)
      .order("published_at", { ascending: false })
      .limit(3),
  ]);

  const post: BlogPost | null = postRes.data;
  if (!post) notFound();

  const related: BlogPost[] = relatedRes.data ?? [];

  // Member Spotlight cross-link: the featured member's listing, found via
  // listings.story_post_id (set when the spotlight was published).
  let member: Pick<Listing, "name" | "type" | "slug" | "tagline" | "city"> | null = null;
  if (post.category === "member_spotlight") {
    const { data: m } = await supabase
      .from("listings")
      .select("name, type, slug, tagline, city")
      .eq("story_post_id", post.id)
      .eq("status", "approved")
      .maybeSingle();
    member = m ?? null;
  }

  const date = new Date(post.published_at ?? post.created_at).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    datePublished: post.published_at ?? post.created_at,
    url: `${SITE.url}/${slug}`,
    inLanguage: "en",
    publisher: {
      "@type": "Organization",
      name: SITE.name,
      url: SITE.url,
      logo: { "@type": "ImageObject", url: `${SITE.url}${SITE.logo}` },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE.url}/${slug}`,
    },
    ...(post.cover_image ? { image: post.cover_image } : {}),
    ...(post.author ? { author: { "@type": "Person", name: post.author } } : {}),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE.url },
      { "@type": "ListItem", position: 2, name: "The Journal", item: `${SITE.url}/community` },
      { "@type": "ListItem", position: 3, name: post.title },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      {/* Back nav */}
      <div className="pt-28 pb-4 bg-bg">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <Link
            href="/community"
            className="inline-flex items-center gap-2 font-sans text-label-sm uppercase text-on-surface-variant hover:text-on-surface transition-colors duration-300"
          >
            <ArrowLeft size={13} />
            The Journal
          </Link>
        </div>
      </div>

      {/* Article */}
      <article className="bg-bg pb-24">
        <div className="max-w-3xl mx-auto px-6 lg:px-8 py-8">

          {/* Kicker */}
          <div className="flex items-center gap-3 mb-6">
            <span className="w-7 h-[3px] bg-primary" aria-hidden />
            <p className="font-sans text-label-md uppercase text-primary">
              {post.category ? post.category.replace(/_/g, " ") : "Bodega Labs"}
            </p>
          </div>

          {/* Title */}
          <h1 className="font-serif text-display-md text-on-surface leading-tight mb-8">
            {post.title}
          </h1>

          {/* Meta — whitespace-separated, no divider lines */}
          <div className="flex flex-wrap items-center gap-6 mb-10">
            <span className="font-sans text-label-sm uppercase text-on-surface">
              {post.author}
            </span>
            <span className="flex items-center gap-1.5 font-sans text-label-sm uppercase text-on-surface-variant">
              <Calendar size={12} />
              {date}
            </span>
            {post.reading_time_minutes && (
              <span className="flex items-center gap-1.5 font-sans text-label-sm uppercase text-on-surface-variant">
                <Clock size={12} />
                {post.reading_time_minutes} min
              </span>
            )}
          </div>

          {/* Cover Image — sharp, full width */}
          {post.cover_image && (
            <div className="relative w-full overflow-hidden mb-12" style={{ height: "clamp(200px, 35vw, 480px)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.cover_image}
                alt={post.title}
                decoding="async"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Body */}
          <div
            className="prose prose-lg prose-invert max-w-none font-sans text-on-surface-variant
              prose-headings:font-serif prose-headings:text-on-surface prose-headings:font-extrabold
              prose-h2:mt-12 prose-h2:mb-5 prose-h2:uppercase prose-h2:tracking-tight
              prose-h3:mt-9 prose-h3:mb-3
              prose-p:leading-relaxed prose-p:mb-5
              prose-ul:my-6 prose-ul:pl-6 prose-ol:my-6 prose-ol:pl-6 prose-li:my-2 prose-li:leading-relaxed
              prose-hr:border-outline-variant/20 prose-hr:my-10
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline
              prose-strong:text-on-surface prose-strong:font-semibold
              prose-img:w-full prose-blockquote:border-l-primary prose-blockquote:text-on-surface"
            dangerouslySetInnerHTML={{ __html: renderContent(post) }}
          />

          {/* CTA — the featured member's profile on spotlight posts,
              otherwise the generic directory block */}
          {member ? (
            <div className="mt-14 p-8 bg-surface-low">
              <p className="font-sans text-label-md uppercase text-primary mb-3">
                Now in the Directory
              </p>
              <p className="font-serif text-xl font-extrabold uppercase tracking-tight text-on-surface mb-2">
                {member.name}
              </p>
              <p className="font-sans text-sm text-on-surface-variant mb-6">
                {member.tagline || `Hours, contact, and how to train with them — live on ${SITE.name}${member.city ? ` in ${member.city}` : ""}.`}
              </p>
              <Link
                href={getListingUrl(member.type, member.slug)}
                className="inline-flex items-center gap-2 bg-primary text-primary-on font-sans text-label-sm uppercase px-6 py-3.5 hover:opacity-90 transition-opacity"
              >
                Visit Their Profile
                <ArrowUpRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="mt-14 p-8 bg-surface-low">
              <p className="font-sans text-label-md uppercase text-primary mb-3">
                The Directory
              </p>
              <p className="font-serif text-xl font-extrabold uppercase tracking-tight text-on-surface mb-2">
                Train it. Recover from it.
              </p>
              <p className="font-sans text-sm text-on-surface-variant mb-6">
                Find recovery studios, gyms, coaches, and nutritionists in the {SITE.name} network.
              </p>
              <Link
                href="/recovery"
                className="inline-flex items-center bg-primary text-primary-on font-sans text-label-sm uppercase px-6 py-3.5 hover:opacity-90 transition-opacity"
              >
                Explore the Network
              </Link>
            </div>
          )}
        </div>
      </article>

      {/* More from the Journal */}
      {related.length > 0 && (
        <section className="py-24 bg-surface-low">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <h2 className="font-serif text-display-sm uppercase text-on-surface mb-12">
              More from The Journal
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {related.map(p => (
                <Link key={p.id} href={`/${p.slug}`} className="group block">
                  <div className="relative aspect-[16/10] bg-surface-card overflow-hidden">
                    {p.cover_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.cover_image}
                        alt={p.title}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-[800ms]"
                      />
                    ) : (
                      <div className="w-full h-full flex items-end p-5">
                        <span className="font-serif text-5xl font-extrabold text-surface-bright select-none">
                          {p.title.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="pt-5">
                    <h3 className="font-serif text-lg font-extrabold tracking-tight text-on-surface group-hover:text-primary transition-colors duration-300 leading-snug">
                      {p.title}
                    </h3>
                    <p className="font-sans text-label-sm uppercase text-on-surface-variant mt-3">
                      {p.author}{p.reading_time_minutes ? ` / ${p.reading_time_minutes} min` : ""}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

/**
 * Content renderer — migrated WordPress posts store sanitized HTML
 * (generated_by === 'wordpress-import'); newer posts store markdown.
 */
function renderContent(post: BlogPost): string {
  const content = post.content ?? "";
  const isHtml = post.generated_by === "wordpress-import" || /^\s*</.test(content);
  if (isHtml) return sanitizeHtml(content);
  return markdownToHtml(content);
}

/** Allow-list sanitizer for our own migrated WP content. */
function sanitizeHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    .replace(/javascript:/gi, "");
}

// Lightweight markdown → HTML converter (XSS-safe) — for generated posts
function markdownToHtml(md: string): string {
  if (!md) return "";

  let text = md.replace(/<[^>]*>/g, "");

  const inline = (s: string): string =>
    s
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(
        /\[(.+?)\]\((https?:\/\/[^)\s]+)\)/g,
        '<a href="$2" rel="noopener noreferrer" target="_blank">$1</a>',
      )
      .replace(
        /\[(.+?)\]\(\/([^)\s]+)\)/g,
        '<a href="/$2">$1</a>',
      );

  const lines = text.split("\n");
  const output: string[] = [];
  let listType = "";
  const paraLines: string[] = [];

  const flushPara = () => {
    if (paraLines.length > 0) {
      output.push(`<p>${paraLines.join(" ")}</p>`);
      paraLines.length = 0;
    }
  };

  const closeList = () => {
    if (listType) {
      output.push(`</${listType}>`);
      listType = "";
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (/^---+$/.test(trimmed)) { flushPara(); closeList(); output.push("<hr>"); continue; }
    if (/^### /.test(trimmed)) { flushPara(); closeList(); output.push(`<h3>${inline(trimmed.slice(4))}</h3>`); continue; }
    if (/^## /.test(trimmed))  { flushPara(); closeList(); output.push(`<h2>${inline(trimmed.slice(3))}</h2>`); continue; }
    if (/^# /.test(trimmed))   { flushPara(); closeList(); output.push(`<h1>${inline(trimmed.slice(2))}</h1>`); continue; }

    if (/^[-*] /.test(trimmed)) {
      flushPara();
      if (listType !== "ul") { closeList(); output.push("<ul>"); listType = "ul"; }
      output.push(`<li>${inline(trimmed.slice(2))}</li>`);
      continue;
    }

    if (/^\d+\. /.test(trimmed)) {
      flushPara();
      if (listType !== "ol") { closeList(); output.push("<ol>"); listType = "ol"; }
      output.push(`<li>${inline(trimmed.replace(/^\d+\. /, ""))}</li>`);
      continue;
    }

    if (trimmed === "") { flushPara(); closeList(); continue; }

    if (listType) closeList();
    paraLines.push(inline(trimmed));
  }

  flushPara();
  closeList();

  return output.join("\n");
}
