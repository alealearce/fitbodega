import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { BlogPost } from "@/lib/supabase/types";
import { SITE, COPY, DEFAULT_OG_IMAGE } from "@/lib/config/site";
import FMark from "@/components/ui/FMark";

// Ids must match the categories emitted by /api/admin/daily-blog.
const BLOG_CATEGORIES = [
  { id: "member_spotlight", label: "Member Spotlight" },
  { id: "mission",          label: "The Network" },
  { id: "finding_training", label: "Finding a Space" },
  { id: "gym_guides",       label: "Training Guides" },
  { id: "coach_guides",     label: "Coach Guides" },
  { id: "recovery_science", label: "Recovery Science" },
  { id: "nutrition",        label: "Nutrition" },
];

export const revalidate = 3600;

export const metadata: Metadata = {
  title: `The Journal — ${SITE.name}`,
  description: "Training, recovery, and nutrition intel — researched, tested, written straight. Guides for finding the right recovery studio, gym, or coach.",
  alternates: { canonical: `${SITE.url}/community` },
  openGraph: {
    title: `The Journal — ${SITE.name}`,
    description: "Training, recovery, and nutrition intel — researched, tested, written straight.",
    url: `${SITE.url}/community`,
    images: [DEFAULT_OG_IMAGE],
    siteName: SITE.name,
    locale: "en_US",
    type: "website",
  },
};

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const supabase = await createClient();

  let query = supabase
    .from("blog_posts")
    .select("*")
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(25);

  if (searchParams.category) {
    query = query.eq("category", searchParams.category);
  }

  const { data } = await query;

  const posts: BlogPost[] = data ?? [];
  const featured = posts[0] ?? null;
  const rest     = posts.slice(1);

  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-16 bg-bg">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-7 h-[3px] bg-primary" aria-hidden />
            <p className="font-sans text-label-md uppercase text-primary">
              {COPY.communitySection.kicker}
            </p>
          </div>
          <h1 className="font-serif text-display-md uppercase text-on-surface mb-4">
            {COPY.communitySection.title}
          </h1>
          <p className="font-sans text-lg text-on-surface-variant max-w-xl leading-relaxed">
            {COPY.communitySection.subtitle}
          </p>
        </div>
      </section>

      {/* Category filter */}
      <section className="pb-8 bg-bg">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-wrap gap-2">
            <Link
              href="/community"
              className={`px-4 py-2.5 font-sans text-label-sm uppercase transition-colors duration-300 ${
                !searchParams.category
                  ? "bg-primary text-primary-on"
                  : "bg-surface-input text-on-surface-variant hover:bg-surface-bright hover:text-on-surface"
              }`}
            >
              All
            </Link>
            {BLOG_CATEGORIES.map((cat) => (
              <Link
                key={cat.id}
                href={`/community?category=${cat.id}`}
                className={`px-4 py-2.5 font-sans text-label-sm uppercase transition-colors duration-300 ${
                  searchParams.category === cat.id
                    ? "bg-primary text-primary-on"
                    : "bg-surface-input text-on-surface-variant hover:bg-surface-bright hover:text-on-surface"
                }`}
              >
                {cat.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Post */}
      {featured ? (
        <section className="pb-16 bg-bg">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <Link
              href={`/${featured.slug}`}
              className="group grid lg:grid-cols-2 bg-surface-low hover:bg-surface-card transition-colors duration-400"
            >
              {featured.cover_image && (
                <div className="relative overflow-hidden bg-surface-card aspect-[16/10] lg:aspect-auto lg:order-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={featured.cover_image}
                    alt={featured.title}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-[800ms]"
                  />
                </div>
              )}
              <div className="max-w-3xl p-8 lg:p-12">
                <div className="flex flex-wrap items-center gap-3 mb-6">
                  <p className="font-sans text-label-md uppercase text-primary">
                    Featured Story
                  </p>
                  {featured.category && (
                    <span className="px-3 py-1 bg-surface-input font-sans text-label-sm uppercase text-on-surface-variant">
                      {featured.category.replace(/_/g, " ")}
                    </span>
                  )}
                </div>
                <h2 className="font-serif text-display-sm uppercase text-on-surface group-hover:text-primary transition-colors duration-300 leading-tight mb-4">
                  {featured.title}
                </h2>
                {featured.excerpt && (
                  <p className="font-sans text-base text-on-surface-variant leading-relaxed mb-6 line-clamp-3">
                    {featured.excerpt}
                  </p>
                )}
                <div className="flex items-center gap-3 font-sans text-sm text-on-surface-variant">
                  <span className="font-medium">{featured.author}</span>
                  {featured.reading_time_minutes && (
                    <>
                      <span>&middot;</span>
                      <span>{featured.reading_time_minutes} min read</span>
                    </>
                  )}
                  {featured.published_at && (
                    <>
                      <span>&middot;</span>
                      <span>
                        {new Date(featured.published_at).toLocaleDateString("en-US", {
                          month: "long", day: "numeric", year: "numeric",
                        })}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </Link>
          </div>
        </section>
      ) : (
        <section className="pb-16 bg-bg">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="bg-surface-low p-16 text-center">
              <FMark className="inline-block h-12 w-10 text-primary mb-4" />
              <h2 className="font-serif text-xl uppercase font-extrabold text-on-surface mb-2">
                Stories coming soon
              </h2>
              <p className="font-sans text-sm text-on-surface-variant max-w-sm mx-auto">
                We&apos;re gathering intel from the network. Check back soon.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Post Grid */}
      {rest.length > 0 && (
        <section className="pb-20 lg:pb-24 bg-bg">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rest.map(post => (
                <BlogPostCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

function BlogPostCard({ post }: { post: BlogPost }) {
  const date = post.published_at
    ? new Date(post.published_at).toLocaleDateString("en-US", {
        month: "long", day: "numeric", year: "numeric",
      })
    : "";

  return (
    <Link
      href={`/${post.slug}`}
      className="group block bg-surface-low hover:bg-surface-card transition-colors duration-300"
    >
      {post.cover_image && (
        <div className="relative aspect-[16/10] overflow-hidden bg-surface-card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.cover_image}
            alt={post.title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-[800ms]"
          />
        </div>
      )}
      <div className="p-5 pt-6">
        {post.category && (
          <span className="inline-block mb-3 px-2.5 py-1 bg-surface-input font-sans text-label-sm uppercase text-on-surface-variant">
            {post.category.replace(/_/g, " ")}
          </span>
        )}
        <h3 className="font-serif text-lg font-extrabold uppercase tracking-tight text-on-surface group-hover:text-primary transition-colors duration-300 leading-snug mb-2">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="font-sans text-sm text-on-surface-variant leading-relaxed line-clamp-2 mb-4">
            {post.excerpt}
          </p>
        )}
        <div className="flex items-center gap-2 font-sans text-xs text-on-surface-variant">
          <span className="font-medium">{post.author}</span>
          {post.reading_time_minutes && (
            <>
              <span>&middot;</span>
              <span>{post.reading_time_minutes} min read</span>
            </>
          )}
          {date && (
            <>
              <span>&middot;</span>
              <span>{date}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1.5 font-sans text-label-sm uppercase text-primary mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          Read
          <ArrowUpRight size={13} />
        </div>
      </div>
    </Link>
  );
}
