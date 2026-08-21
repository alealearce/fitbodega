import Link from "next/link";
import Image from "next/image";
import { Instagram, Mail } from "lucide-react";
import { SITE, COPY } from "@/lib/config/site";
import { isNetworkOpen } from "@/lib/creators/network";
import NewsletterSignup from "@/components/newsletter/NewsletterSignup";

const FOOTER_LINKS = {
  directory: [
    { label: "Recovery",           href: "/recovery" },
    { label: "Gyms & Studios",     href: "/gyms" },
    { label: "Coaches & Trainers", href: "/trainers" },
    { label: "Clubs",              href: "/clubs" },
    { label: "Nutritionists",      href: "/nutritionists" },
    { label: "Health Food Stores", href: "/health-food-stores" },
    { label: "Youth Sports",       href: "/youth-sports" },
  ],
  network: [
    { label: "Deal Radar",          href: "/deals" },
    { label: "Join the Radar",      href: "/creators#join" },
    { label: "Post a Deal",         href: "/for-brands" },
    { label: "For Creators",        href: "/creators" },
    { label: "The FitBodega 100",   href: "/top-100" },
    { label: "The Journal",         href: "/community" },
    { label: "About",               href: "/about" },
    { label: "Managed Campaigns",   href: "/about#managed-campaigns" },
    { label: "List Your Space",     href: "/submit" },
    { label: "Sign In",             href: "/login" },
  ],
  legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Use",   href: "/terms" },
  ],
};

/**
 * Footer — Level 1 tonal shift from the page void. No divider lines;
 * whitespace and surface contrast do the sectioning.
 */
export default async function Footer() {
  // The creator browse is only linked once it holds real profiles.
  const networkOpen = await isNetworkOpen();
  const networkLinks = networkOpen
    ? [
        ...FOOTER_LINKS.network.slice(0, 4),
        { label: "The Creator Network", href: "/creators/network" },
        ...FOOTER_LINKS.network.slice(4),
      ]
    : FOOTER_LINKS.network;
  return (
    <footer className="bg-surface-low">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
        <div className="flex flex-col lg:flex-row lg:justify-between gap-14">

          {/* Brand */}
          <div className="lg:max-w-sm">
            <Link href="/" className="inline-block mb-5">
              <Image
                src={SITE.logo}
                alt={SITE.name}
                width={170}
                height={24}
                className="h-5 w-auto object-contain"
              />
            </Link>
            <p className="font-sans text-label-sm uppercase text-on-surface-variant mb-8">
              {COPY.footer.tagline}
            </p>
            {/* Newsletter */}
            <NewsletterSignup variant="compact" />
            <a
              href={`mailto:${SITE.email}`}
              className="mt-5 inline-flex items-center gap-2 font-sans text-xs text-on-surface-variant hover:text-on-surface transition-colors duration-300"
            >
              <Mail size={12} />
              {SITE.email}
            </a>
            {/* Social Links */}
            <div className="flex items-center gap-2 mt-7">
              <SocialLink href={SITE.social.instagram} aria="Instagram — FitBodega Shop">
                <Instagram size={15} />
              </SocialLink>
              <SocialLink href={SITE.social.tiktok} aria="TikTok — FitBodega Shop">
                {/* lucide has no TikTok glyph; inline SVG sized to match */}
                <svg
                  width={15}
                  height={15}
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden
                >
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                </svg>
              </SocialLink>
              <SocialLink href={SITE.social.instagramSports} aria="Instagram — FitBodega Vancouver FC">
                <Instagram size={15} />
              </SocialLink>
            </div>
          </div>

          {/* Link columns */}
          <div className="flex gap-20">
            <div>
              <h4 className="font-sans text-label-sm uppercase text-on-surface-variant mb-6">
                The Network
              </h4>
              <ul className="space-y-3.5">
                {networkLinks.map(link => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="font-sans text-sm text-on-surface-variant hover:text-on-surface transition-colors duration-300"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-sans text-label-sm uppercase text-on-surface-variant mb-6">
                <Link
                  href="/directory"
                  className="hover:text-on-surface transition-colors duration-300"
                >
                  Directory
                </Link>
              </h4>
              <ul className="space-y-3.5">
                {FOOTER_LINKS.directory.map(link => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="font-sans text-sm text-on-surface-variant hover:text-on-surface transition-colors duration-300"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar — deeper tonal step, no divider line */}
        <div className="mt-20 -mx-6 lg:-mx-8 px-6 lg:px-8 py-6 bg-bg flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-sans text-xs text-on-surface-variant/70">
            © {new Date().getFullYear()} FitBodega. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            {FOOTER_LINKS.legal.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="font-sans text-xs text-on-surface-variant/70 hover:text-on-surface transition-colors duration-300"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

function SocialLink({ href, aria, children }: { href: string; aria: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={aria}
      className="flex items-center justify-center w-9 h-9 bg-surface-card text-on-surface-variant hover:text-primary-on hover:bg-primary transition-all duration-300"
    >
      {children}
    </a>
  );
}
