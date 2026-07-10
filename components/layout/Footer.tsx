import Link from "next/link";
import Image from "next/image";
import { Instagram, Mail } from "lucide-react";
import { SITE, COPY } from "@/lib/config/site";
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
    { label: "The Journal",     href: "/community" },
    { label: "About",           href: "/about" },
    { label: "List Your Space", href: "/submit" },
    { label: "Sign In",         href: "/login" },
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
export default function Footer() {
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
                {FOOTER_LINKS.network.map(link => (
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
                Directory
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
            © {new Date().getFullYear()} FitBodega. All rights reserved. Created by{' '}
            <a href="https://alejandroarce.com" target="_blank" rel="noopener noreferrer" className="hover:text-on-surface transition-colors underline underline-offset-2">
              Alejandro Arce
            </a>
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
