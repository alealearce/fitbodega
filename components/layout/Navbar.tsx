"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, ChevronDown, User, LayoutDashboard } from "lucide-react";
import { SITE } from "@/lib/config/site";
import { cn } from "@/lib/utils/cn";
import { createClient } from "@/lib/supabase/client";
import { TOP100_LISTS } from "@/components/top100/lists";

const DIRECTORY_ITEMS = [
  { label: "Recovery",           href: "/recovery",           desc: "Saunas, cold plunge & bodywork studios" },
  { label: "Gyms & Studios",     href: "/gyms",               desc: "Training floors & fitness studios" },
  { label: "Coaches",            href: "/trainers",           desc: "Personal trainers & performance coaches" },
  { label: "Clubs",              href: "/clubs",              desc: "Run crews, ride groups & swim clubs" },
  { label: "Nutritionists",      href: "/nutritionists",      desc: "Sports dietitians & nutrition coaching" },
  { label: "Health Food Stores", href: "/health-food-stores", desc: "Supplements & whole-food fuel" },
  { label: "Youth Sports",       href: "/youth-sports",       desc: "Soccer clubs, academies & camps" },
];

const TOP100_ITEMS = TOP100_LISTS.map((l) => ({
  label: l.navLabel,
  href: l.slug,
  desc: l.desc,
}));

type DropdownItem = { label: string; href: string; desc: string };

function NavDropdown({
  label,
  items,
  open,
  setOpen,
  innerRef,
}: {
  label: string;
  items: DropdownItem[];
  open: boolean;
  setOpen: (v: boolean | ((v: boolean) => boolean)) => void;
  innerRef: React.RefObject<HTMLDivElement>;
}) {
  return (
    <div
      ref={innerRef}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 font-sans text-label-sm uppercase text-on-surface-variant hover:text-on-surface transition-colors duration-300"
      >
        {label}
        <ChevronDown
          size={13}
          className={cn("transition-transform duration-300", open && "rotate-180")}
        />
      </button>

      {/* Dropdown Panel — Level 2 tonal block, sharp. The gap between
          trigger and panel is padding (not margin) so the pointer
          never leaves the wrapper while crossing it. */}
      <div
        className={cn(
          "absolute top-full left-1/2 -translate-x-1/2 pt-4 w-72",
          "transition-all duration-300 origin-top",
          open ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
        )}
      >
        <div className="bg-surface-input overflow-hidden p-2 max-h-[70vh] overflow-y-auto">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="flex items-start gap-3 px-4 py-3 hover:bg-surface-bright transition-colors duration-200 group"
            >
              <div>
                <p className="font-sans text-sm font-bold text-on-surface group-hover:text-primary transition-colors">
                  {item.label}
                </p>
                <p className="font-sans text-xs text-on-surface-variant mt-0.5">
                  {item.desc}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Navbar() {
  const [scrolled,      setScrolled]      = useState(false);
  const [mobileOpen,    setMobileOpen]    = useState(false);
  const [directoryOpen, setDirectoryOpen] = useState(false);
  const [top100Open,    setTop100Open]    = useState(false);
  const [isAuthed,      setIsAuthed]      = useState(false);
  const directoryRef = useRef<HTMLDivElement>(null);
  const top100Ref    = useRef<HTMLDivElement>(null);

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

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (directoryRef.current && !directoryRef.current.contains(e.target as Node)) {
        setDirectoryOpen(false);
      }
      if (top100Ref.current && !top100Ref.current.contains(e.target as Node)) {
        setTop100Open(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
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
            <nav className="hidden lg:flex items-center gap-8">
              <NavDropdown
                label="Directory"
                items={DIRECTORY_ITEMS}
                open={directoryOpen}
                setOpen={setDirectoryOpen}
                innerRef={directoryRef}
              />
              <NavDropdown
                label="Top 100"
                items={TOP100_ITEMS}
                open={top100Open}
                setOpen={setTop100Open}
                innerRef={top100Ref}
              />
              <NavLink href="/community">Journal</NavLink>
              <NavLink href="/about">About</NavLink>
            </nav>

            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center gap-5">
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
                href="/submit"
                className="px-5 py-2.5 bg-primary text-primary-on font-sans text-label-sm uppercase transition-opacity duration-300 hover:opacity-90"
              >
                List Your Space
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
              {/* Directory Group */}
              <div className="pb-1">
                <p className="font-sans text-label-sm uppercase text-on-surface-variant px-3 mb-2">
                  Directory
                </p>
                {DIRECTORY_ITEMS.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 font-sans text-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-card transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>

              {/* Top 100 Group */}
              <div className="pt-4 pb-1">
                <p className="font-sans text-label-sm uppercase text-on-surface-variant px-3 mb-2">
                  Top 100
                </p>
                {TOP100_ITEMS.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 font-sans text-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-card transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>

              <div className="pt-4">
                <MobileNavLink href="/community" onClick={() => setMobileOpen(false)}>Journal</MobileNavLink>
                <MobileNavLink href="/about" onClick={() => setMobileOpen(false)}>About</MobileNavLink>
              </div>
            </nav>

            <div className="mt-auto flex flex-col gap-3 pt-6">
              <Link
                href={isAuthed ? "/dashboard" : "/login"}
                onClick={() => setMobileOpen(false)}
                className="text-center py-3.5 font-sans text-label-sm uppercase text-on-surface bg-surface-card hover:bg-surface-input transition-colors"
              >
                {isAuthed ? "Dashboard" : "Sign In"}
              </Link>
              <Link
                href="/submit"
                onClick={() => setMobileOpen(false)}
                className="text-center py-3.5 bg-primary text-primary-on font-sans text-label-sm uppercase transition-opacity hover:opacity-90"
              >
                List Your Space
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
