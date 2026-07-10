import { permanentRedirect } from "next/navigation";

/**
 * Journal posts live at root-level slugs (/:slug) to preserve the
 * WordPress-era URLs that already rank. Anything hitting the old
 * /community/:slug shape gets a 308 to the canonical location.
 */
export default async function LegacyCommunityPost({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  permanentRedirect(`/${slug}`);
}
