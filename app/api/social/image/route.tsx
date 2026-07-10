/**
 * GET /api/social/image — renders one 1080×1350 (4:5) branded social slide for
 * FitBodega. PUBLIC (no auth): Blotato fetches these URLs to ingest the
 * carousel images.
 *
 * Two post types, each a multi-slide carousel:
 *
 *   ?type=blog&slide=0..2
 *     0  hook   — display headline on dark ground (the editorial template)
 *     1  tldr   — "the 3-minute version", 3 numbered points
 *     2  cta    — read on The Journal + link
 *     params: title, points (a|b|c), category, url
 *
 *   ?type=showcase&slide=0..3
 *     0  hero   — listing photo, "FEATURED [TYPE]" pill, name, city
 *     1  why    — what makes them stand out (bold-sans template)
 *     2  detail — specialty / location facts
 *     3  cta    — discover on FitBodega + @handle
 *     params: name, kind, city, country, img, blurb, style, handle
 *
 * Fully param-driven so previews and the daily-social cron share one renderer.
 * Design language: "The Brutalist Sanctuary" — dark ground, electric lime
 * accent, extrabold uppercase Manrope headlines. No emojis, no icons — an
 * "FB" monogram square stands in for a logo mark.
 */

import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ── Brand tokens ("The Brutalist Sanctuary") ─────────────────────────────────
const BG = '#0e0e0e';
const SURFACE_LOW = '#131313';
const SURFACE_CARD = '#1a1a1a';
const LIME = '#d1fc00';
const LIME_TEXT = '#161900';
const WHITE = '#ffffff';
const MUTED = '#9a9a9a';
const W = 1080;
const H = 1350;

// ── Fonts (fetched once from jsDelivr/fontsource, cached in module scope) ─────
const FONT_FILES = {
  sans:      'https://cdn.jsdelivr.net/npm/@fontsource/manrope@5.0.18/files/manrope-latin-500-normal.woff',
  sansBold:  'https://cdn.jsdelivr.net/npm/@fontsource/manrope@5.0.18/files/manrope-latin-700-normal.woff',
  sansBlack: 'https://cdn.jsdelivr.net/npm/@fontsource/manrope@5.0.18/files/manrope-latin-800-normal.woff',
} as const;

let fontCache: { name: string; data: ArrayBuffer; weight: 400 | 500 | 700 | 800; style: 'normal' }[] | null = null;

async function loadFonts() {
  if (fontCache) return fontCache;
  const [sans, sansBold, sansBlack] = await Promise.all(
    Object.values(FONT_FILES).map((u) => fetch(u).then((r) => r.arrayBuffer()))
  );
  fontCache = [
    { name: 'Manrope', data: sans, weight: 500, style: 'normal' },
    { name: 'Manrope', data: sansBold, weight: 700, style: 'normal' },
    { name: 'Manrope', data: sansBlack, weight: 800, style: 'normal' },
  ];
  return fontCache;
}

// ── FB monogram mark (stands in for a logo file) ──────────────────────────────
function Mark({ size = 76, color = WHITE }: { size?: number; color?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        background: LIME,
        color: LIME_TEXT,
        fontFamily: 'Manrope',
        fontWeight: 800,
        fontSize: size * 0.42,
        letterSpacing: '-1px',
      }}
    >
      FB
    </div>
  );
}

function SendIcon({ size = 24, color }: { size?: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ display: 'flex' }}>
      <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z" fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function BookmarkIcon({ size = 24, color }: { size?: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ display: 'flex' }}>
      <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-5-7 5V4a1 1 0 0 1 1-1Z" fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// Logo lockup: mark + stacked wordmark, top-center, on every slide.
function Logo({ color = WHITE, compact = false }: { color?: string; compact?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
      <Mark size={compact ? 44 : 60} />
      <div style={{ display: 'flex', flexDirection: 'column', color, fontFamily: 'Manrope', fontWeight: 800, fontSize: compact ? '21px' : '25px', lineHeight: 1.12, letterSpacing: '1px', textTransform: 'uppercase' }}>
        <div style={{ display: 'flex' }}>FIT<span style={{ color: LIME }}>BODEGA</span></div>
      </div>
    </div>
  );
}

function ShareSave({ color = MUTED }: { color?: string }) {
  return (
    <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center', color, fontFamily: 'Manrope', fontWeight: 700, fontSize: '22px', letterSpacing: '2px', textTransform: 'uppercase' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><SendIcon color={color} /> Share</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>Save <BookmarkIcon color={color} /></div>
    </div>
  );
}

function SwipeChip({ label = 'SWIPE', color = WHITE }: { label?: string; color?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color, fontFamily: 'Manrope', fontWeight: 700, fontSize: '22px', letterSpacing: '2px' }}>
      {label} <span style={{ display: 'flex' }}>→</span>
    </div>
  );
}

function fit(text: string, big: number, mid: number, small: number): number {
  if (text.length > 78) return small;
  if (text.length > 44) return mid;
  return big;
}

// ════════════════════════ BLOG DIGEST (dark / lime) ═══════════════════════════

function BlogHook({ title, category }: { title: string; category: string }) {
  return (
    <div style={{ width: W, height: H, display: 'flex', flexDirection: 'column', background: BG, padding: '76px 78px' }}>
      <div style={{ display: 'flex', justifyContent: 'center' }}><Logo /></div>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
        <div style={{ display: 'flex', fontFamily: 'Manrope', fontWeight: 700, fontSize: '24px', letterSpacing: '4px', color: LIME, marginBottom: '26px', textTransform: 'uppercase' }}>
          The Journal · {category.toUpperCase()}
        </div>
        <div style={{ display: 'flex', fontFamily: 'Manrope', fontWeight: 800, fontSize: `${fit(title, 78, 66, 52)}px`, lineHeight: 1.06, color: WHITE, letterSpacing: '-2px', textTransform: 'uppercase' }}>
          {title}
        </div>
        <div style={{ display: 'flex', width: '72px', height: '3px', background: LIME, marginTop: '40px' }} />
        <div style={{ display: 'flex', fontFamily: 'Manrope', fontWeight: 500, fontSize: '32px', color: MUTED, marginTop: '26px' }}>
          The 3-minute version →
        </div>
      </div>
      <ShareSave />
    </div>
  );
}

function BlogTldr({ points }: { points: string[] }) {
  return (
    <div style={{ width: W, height: H, display: 'flex', flexDirection: 'column', background: SURFACE_LOW, padding: '76px 78px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Logo compact />
        <div style={{ display: 'flex', fontFamily: 'Manrope', fontWeight: 700, fontSize: '24px', letterSpacing: '3px', color: MUTED }}>TL;DR</div>
      </div>
      <div style={{ display: 'flex', fontFamily: 'Manrope', fontWeight: 800, fontSize: '46px', color: WHITE, marginTop: '40px', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '-1px' }}>
        The 3-minute version
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center', gap: '38px' }}>
        {points.map((p, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '28px' }}>
            <div style={{ display: 'flex', fontFamily: 'Manrope', fontWeight: 800, fontSize: '64px', lineHeight: 1, color: LIME, width: '70px' }}>{i + 1}</div>
            <div style={{ display: 'flex', flex: 1, fontFamily: 'Manrope', fontWeight: 500, fontSize: '36px', lineHeight: 1.34, color: WHITE }}>{p}</div>
          </div>
        ))}
      </div>
      <ShareSave />
    </div>
  );
}

function BlogCta({ title, url }: { title: string; url: string }) {
  return (
    <div style={{ width: W, height: H, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: BG, padding: '78px' }}>
      <Mark size={140} />
      <div style={{ display: 'flex', fontFamily: 'Manrope', fontWeight: 700, fontSize: '24px', letterSpacing: '4px', color: LIME, marginTop: '54px', textTransform: 'uppercase' }}>
        Keep Reading
      </div>
      <div style={{ display: 'flex', textAlign: 'center', fontFamily: 'Manrope', fontWeight: 800, fontSize: '48px', lineHeight: 1.14, color: WHITE, marginTop: '22px', maxWidth: '820px', textTransform: 'uppercase', letterSpacing: '-1px' }}>
        Read the full piece on The Journal
      </div>
      <div style={{ display: 'flex', textAlign: 'center', fontFamily: 'Manrope', fontWeight: 500, fontSize: '30px', color: MUTED, marginTop: '30px', maxWidth: '780px' }}>
        &ldquo;{title}&rdquo;
      </div>
      <div style={{ display: 'flex', alignItems: 'center', background: LIME, color: LIME_TEXT, fontFamily: 'Manrope', fontWeight: 800, fontSize: '28px', padding: '22px 44px', marginTop: '48px' }}>
        {url}
      </div>
    </div>
  );
}

// ════════════════════════ SHOWCASE (bold-sans / lime) ═════════════════════════

function LimePill({ label, fontSize = 34 }: { label: string; fontSize?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', background: LIME, color: LIME_TEXT, fontFamily: 'Manrope', fontWeight: 800, fontSize: `${fontSize}px`, letterSpacing: '1px', padding: '14px 30px', textTransform: 'uppercase' }}>
      {label}
    </div>
  );
}

function DottedBg() {
  // subtle dot-grid backdrop
  const dots = [];
  for (let y = 60; y < H; y += 56) {
    for (let x = 60; x < W; x += 56) {
      dots.push(<circle key={`${x}-${y}`} cx={x} cy={y} r={3} fill="#262626" />);
    }
  }
  return (
    <svg width={W} height={H} style={{ display: 'flex', position: 'absolute', top: 0, left: 0 }} xmlns="http://www.w3.org/2000/svg">{dots}</svg>
  );
}

function ShowcaseHero({ name, kind, city, country, img }: { name: string; kind: string; city: string; country: string; img: string }) {
  const loc = [city, country].filter(Boolean).join(', ');
  return (
    <div style={{ width: W, height: H, display: 'flex', flexDirection: 'column', position: 'relative', background: BG }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={img} alt="" width={W} height={H} style={{ position: 'absolute', top: 0, left: 0, width: W, height: H, objectFit: 'cover' }} />
      <div style={{ position: 'absolute', top: 0, left: 0, width: W, height: H, display: 'flex', background: 'linear-gradient(180deg, rgba(14,14,14,0.6) 0%, rgba(14,14,14,0.05) 38%, rgba(14,14,14,0.4) 66%, rgba(14,14,14,0.94) 100%)' }} />
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '70px', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}><Logo color="#ffffff" /></div>
        <div style={{ display: 'flex', flex: 1 }} />
        <div style={{ display: 'flex' }}><LimePill label={`Featured ${kind}`} /></div>
        <div style={{ display: 'flex', fontFamily: 'Manrope', fontWeight: 800, fontSize: `${fit(name, 90, 74, 56)}px`, lineHeight: 1.02, color: '#ffffff', marginTop: '24px', letterSpacing: '-2px', textTransform: 'uppercase' }}>
          {name}
        </div>
        {loc ? (
          <div style={{ display: 'flex', fontFamily: 'Manrope', fontWeight: 500, fontSize: '34px', color: 'rgba(255,255,255,0.86)', marginTop: '18px' }}>{loc}</div>
        ) : null}
        <div style={{ display: 'flex', marginTop: '34px' }}><SwipeChip color="#ffffff" /></div>
      </div>
    </div>
  );
}

function ShowcaseBody({ index, total, eyebrow, heading, body }: { index: number; total: number; eyebrow: string; heading: string; body: string }) {
  return (
    <div style={{ width: W, height: H, display: 'flex', flexDirection: 'column', position: 'relative', background: SURFACE_CARD, padding: '70px' }}>
      <DottedBg />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
        <Logo compact />
        <div style={{ display: 'flex', fontFamily: 'Manrope', fontWeight: 700, fontSize: '28px', color: MUTED }}>{index}/{total}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginTop: '64px', position: 'relative' }}>
        <div style={{ display: 'flex', fontFamily: 'Manrope', fontWeight: 800, fontSize: '92px', lineHeight: 1, color: LIME }}>{String(index).padStart(2, '0')}</div>
        <LimePill label={eyebrow} fontSize={38} />
      </div>
      <div style={{ display: 'flex', fontFamily: 'Manrope', fontWeight: 800, fontSize: '50px', lineHeight: 1.08, color: WHITE, marginTop: '40px', position: 'relative', maxWidth: '900px', textTransform: 'uppercase', letterSpacing: '-1px' }}>
        {heading}
      </div>
      <div style={{ display: 'flex', flex: 1, fontFamily: 'Manrope', fontWeight: 500, fontSize: '38px', lineHeight: 1.42, color: MUTED, marginTop: '30px', position: 'relative' }}>
        {body}
      </div>
      <div style={{ position: 'relative', display: 'flex', width: '100%' }}><ShareSave /></div>
    </div>
  );
}

function ShowcaseCta({ name, handle }: { name: string; handle: string }) {
  return (
    <div style={{ width: W, height: H, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: BG, padding: '78px' }}>
      <Mark size={140} />
      <div style={{ display: 'flex', fontFamily: 'Manrope', fontWeight: 700, fontSize: '24px', letterSpacing: '4px', color: LIME, marginTop: '50px', textTransform: 'uppercase' }}>
        Featured Today
      </div>
      <div style={{ display: 'flex', textAlign: 'center', fontFamily: 'Manrope', fontWeight: 800, fontSize: '56px', lineHeight: 1.08, color: '#ffffff', marginTop: '20px', maxWidth: '860px', textTransform: 'uppercase', letterSpacing: '-1px' }}>
        Discover {name} on FitBodega
      </div>
      <div style={{ display: 'flex', fontFamily: 'Manrope', fontWeight: 500, fontSize: '32px', color: MUTED, marginTop: '34px', textAlign: 'center', maxWidth: '760px' }}>
        The curated fitness and recovery network.
      </div>
      <div style={{ display: 'flex', alignItems: 'center', background: LIME, color: LIME_TEXT, fontFamily: 'Manrope', fontWeight: 800, fontSize: '30px', padding: '22px 46px', marginTop: '50px' }}>
        fitbodega.com
      </div>
      {handle ? (
        <div style={{ display: 'flex', fontFamily: 'Manrope', fontWeight: 500, fontSize: '26px', color: MUTED, marginTop: '26px' }}>in collaboration with {handle}</div>
      ) : null}
    </div>
  );
}

// ───────────────────────────── handler ──────────────────────────────────────

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const type = q.get('type') || 'blog';
  const slide = Number(q.get('slide') ?? 0);
  const fonts = await loadFonts();
  const opts = { width: W, height: H, fonts, headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=3600' } } as const;

  if (type === 'showcase') {
    const name = q.get('name') || 'Featured Listing';
    const kind = q.get('kind') || 'Gym';
    const city = q.get('city') || '';
    const country = q.get('country') || '';
    const img = q.get('img') || 'https://images.unsplash.com/photo-1545389336-cf090694435e?w=1080&h=1350&fit=crop&q=80';
    const blurb = q.get('blurb') || '';
    const style = q.get('style') || '';
    const handle = q.get('handle') || '';

    let node: JSX.Element;
    if (slide === 0) node = <ShowcaseHero name={name} kind={kind} city={city} country={country} img={img} />;
    else if (slide === 1) node = <ShowcaseBody index={2} total={4} eyebrow="Why it stands out" heading={`Meet ${name}`} body={blurb} />;
    else if (slide === 2) node = <ShowcaseBody index={3} total={4} eyebrow="The specialty" heading={style ? `${style} — and more` : 'A space worth finding'} body={[style && `Specialty: ${style}`, [city, country].filter(Boolean).join(', ') && `Based in ${[city, country].filter(Boolean).join(', ')}`, 'Verified on FitBodega.'].filter(Boolean).join('  ·  ')} />;
    else node = <ShowcaseCta name={name} handle={handle} />;
    return new ImageResponse(node, opts);
  }

  // type === 'blog'
  const title = q.get('title') || 'A fresh perspective from The Journal';
  const category = q.get('category') || 'finding training';
  const url = q.get('url') || 'fitbodega.com/community';
  const points = (q.get('points') || 'First key takeaway from the post.|Second insight worth saving.|Third practical tip you can use today.')
    .split('|').map((s) => s.trim()).filter(Boolean).slice(0, 3);

  let node: JSX.Element;
  if (slide === 0) node = <BlogHook title={title} category={category} />;
  else if (slide === 1) node = <BlogTldr points={points} />;
  else node = <BlogCta title={title} url={url} />;
  return new ImageResponse(node, opts);
}
