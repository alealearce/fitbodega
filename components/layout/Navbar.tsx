"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, User, LayoutDashboard } from "lucide-react";
import { SITE } from "@/lib/config/site";
import { cn } from "@/lib/utils/cn";
import { createClient } from "@/lib/supabase/client";

// Primary nav, 2026-08-20: the network first, the directory last — one link to
// its landing page instead of the old mega-menu. Category pages stay live and
// indexed, reached from /directory and the footer.
const NAV_ITEMS = [
  { label: "Deals",        href: "/deals" },
  { label: "Top 100",      href: "/top-100" },
  { label: "For Brands",   href: "/for-brands" },
  { label: "For Creators", href: "/creators" },
  { label: "Journal",      href: "/community" },
  { label: "About",        href: "/about" },
  { label: "Directory",    href: "/directory" },
];

export default function Navbar() {
  const [scrolled,   setScrolled]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAuthed,   setIsAuthed]   = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }: { data: { user: unknown } }) => setIsAuthed(!!data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_event: string, session: { user?: unknown } | null) => {
      setIsAuthed(!!session?.user);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-400",
          scrolled
            ? "bg-bg/70 backdrop-blur-glass"
            : "bg-transparent"
        )}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">

            {/* Wordmark */}
            <Link href="/" className="flex items-center gap-3 flex-shrink-0">
              <Image
                src={SITE.logo}
                alt={SITE.name}
                width={170}
                height={24}
                sizes="170px"
                className="h-5 w-auto object-contain"
                priority
              />
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-5 xl:gap-7">
              {NAV_ITEMS.map((item) => (
                <NavLink key={item.href} href={item.href}>
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {/* Desktop Actions — creator signup is the dominant one */}
            <div className="hidden lg:flex items-center gap-3 xl:gap-4">
              {isAuthed ? (
                <Link
                  href="/dashboard"
                  className="flex items-center gap-1.5 font-sans text-label-sm uppercase text-on-surface-variant hover:text-on-surface transition-colors duration-300"
                >
                  <LayoutDashboard size={14} />
                  Dashboard
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 font-sans text-label-sm uppercase text-on-surface-variant hover:text-on-surface transition-colors duration-300"
                >
                  <User size={14} />
                  Sign In
                </Link>
              )}
              <Link
                href="/for-brands"
                className="px-4 py-2.5 font-sans text-label-sm uppercase text-on-surface hover:text-primary transition-colors duration-300"
                style={{ boxShadow: "inset 0 0 0 1px rgba(72,72,71,0.3)" }}
              >
                Post a Deal
              </Link>
              <Link
                href="/creators#join"
                className="px-6 py-2.5 bg-primary text-primary-on font-sans text-label-sm uppercase font-bold transition-opacity duration-300 hover:opacity-90"
              >
                Join the Radar
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileOpen(v => !v)}
              className="lg:hidden p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-low transition-colors"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <div
        className={cn(
          "fixed inset-0 z-40 lg:hidden transition-all duration-400",
          mobileOpen ? "visible" : "invisible"
        )}
      >
        {/* Backdrop */}
        <div
          onClick={() => setMobileOpen(false)}
          className={cn(
            "absolute inset-0 bg-bg/60 backdrop-blur-sm transition-opacity duration-400",
            mobileOpen ? "opacity-100" : "opacity-0"
          )}
        />

        {/* Panel — Level 1 tonal surface */}
        <div
          className={cn(
            "absolute top-0 right-0 h-full w-80 max-w-full bg-surface-low",
            "transition-transform duration-400",
            mobileOpen ? "translate-x-0" : "translate-x-full"
          )}
        >
          <div className="flex flex-col h-full pt-20 pb-8 px-6 overflow-y-auto">
            <nav className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => (
                <MobileNavLink key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
                  {item.label}
                </MobileNavLink>
              ))}
            </nav>

            <div className="mt-auto flex flex-col gap-3 pt-8">
              <Link
                href="/creators#join"
                onClick={() => setMobileOpen(false)}
                className="text-center py-3.5 bg-primary text-primary-on font-sans text-label-sm uppercase font-bold transition-opacity hover:opacity-90"
              >
                Join the Radar
              </Link>
              <Link
                href="/for-brands"
                onClick={() => setMobileOpen(false)}
                className="text-center py-3.5 font-sans text-label-sm uppercase text-on-surface bg-surface-card hover:bg-surface-input transition-colors"
              >
                Post a Deal
              </Link>
              <Link
                href={isAuthed ? "/dashboard" : "/login"}
                onClick={() => setMobileOpen(false)}
                className="text-center py-3.5 font-sans text-label-sm uppercase text-on-surface-variant hover:text-on-surface transition-colors"
              >
                {isAuthed ? "Dashboard" : "Sign In"}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="font-sans text-label-sm uppercase text-on-surface-variant hover:text-on-surface transition-colors duration-300"
    >
      {children}
    </Link>
  );
}

function MobileNavLink({ href, children, onClick }: { href: string; children: React.ReactNode; onClick: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="px-3 py-3 font-serif text-lg font-extrabold uppercase tracking-tight text-on-surface hover:text-primary transition-colors"
    >
      {children}
    </Link>
  );
}
