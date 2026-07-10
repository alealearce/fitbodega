import { ImageResponse } from "next/og";
import { SITE } from "@/lib/config/site";

// Default og:image for every route under [locale] that doesn't provide its
// own image (listing pages with photos keep their photo).
// NOTE: must live in [locale], not the app root — the [locale] layout's
// config-based openGraph would override a root-level file-convention image.
// Design: "The Brutalist Sanctuary" — dark ground, lime accent, extrabold uppercase wordmark.

export const runtime = "edge";

export const alt = `${SITE.name} — ${SITE.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Brutalist Sanctuary palette
const BG = "#0e0e0e";
const LIME = "#d1fc00";
const WHITE = "#ffffff";
const MUTED = "#9a9a9a";

const TAGLINE = SITE.tagline.toUpperCase();
const FOOTER = SITE.domain;

/**
 * Load a Google Font subset (TTF) for satori. Returns null on any failure so
 * the image still renders with the bundled default font instead of erroring.
 */
async function loadGoogleFont(
  family: string,
  weight: number,
  text: string
): Promise<ArrayBuffer | null> {
  try {
    const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
      family
    )}:wght@${weight}&text=${encodeURIComponent(text)}`;
    const css = await (await fetch(cssUrl)).text();
    const match = css.match(
      /src: url\((.+?)\) format\('(?:opentype|truetype)'\)/
    );
    if (!match) return null;
    const res = await fetch(match[1]);
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

export default async function OpengraphImage() {
  const allText = `FIT BODEGA ${TAGLINE} ${FOOTER}`;

  const [display] = await Promise.all([
    loadGoogleFont("Manrope", 800, allText),
  ]);

  const fonts = [
    ...(display ? [{ name: "Manrope", data: display, weight: 800 as const }] : []),
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: BG,
          padding: "64px 80px",
          fontFamily: display ? "Manrope" : "sans-serif",
        }}
      >
        {/* Lime top bar */}
        <div
          style={{
            display: "flex",
            width: 72,
            height: 3,
            backgroundColor: LIME,
            marginBottom: 48,
          }}
        />

        {/* Wordmark */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontWeight: 800,
            fontSize: 108,
            lineHeight: 1.02,
            letterSpacing: -2,
            textTransform: "uppercase",
            color: WHITE,
          }}
        >
          <span>FIT</span>
          <span style={{ color: LIME }}>BODEGA</span>
        </div>

        {/* Tagline */}
        <div
          style={{
            display: "flex",
            fontSize: 24,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: MUTED,
            marginTop: 32,
          }}
        >
          {TAGLINE}
        </div>

        {/* Footer brand row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginTop: "auto",
            paddingTop: 32,
          }}
        >
          <div
            style={{
              display: "flex",
              width: 16,
              height: 16,
              backgroundColor: LIME,
              marginRight: 16,
            }}
          />
          <div style={{ display: "flex", fontSize: 26, color: MUTED }}>
            {FOOTER}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      ...(fonts.length > 0 ? { fonts } : {}),
    }
  );
}
