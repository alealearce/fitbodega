import { SITE } from "@/lib/config/site";
import OpengraphImage from "./opengraph-image";

// Twitter card image — same artwork as the default Open Graph image.
// Standalone module (not a re-export) so Next's metadata-route loader can
// statically pick up runtime/size/contentType.

export const runtime = "edge";

export const alt = `${SITE.name} — ${SITE.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default OpengraphImage;
