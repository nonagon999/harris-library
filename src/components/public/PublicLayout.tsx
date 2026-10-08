"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogIn, Menu, X } from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { cn } from "@/lib/utils";
import { SCHOOL_TAGLINE } from "@/lib/constants";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/opac", label: "Browse Books" },
  { href: "/opac?sort=newest", label: "New Arrivals" },
  { href: "/login", label: "Librarian Portal" },
];

export function PublicHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--hmc-blue-border)] bg-white/95 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <BrandLogo href="/" size="md" subtitle="Harris Library OPAC" />

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
          {navLinks.map((link) => {
            const active = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-[var(--hmc-blue-muted)] text-[var(--hmc-blue)]"
                    : "text-[var(--hmc-text-muted)] hover:bg-[var(--hmc-blue-soft)] hover:text-[var(--hmc-blue)]"
                )}
              >
                {link.label}
              </Link>
            );
          })}
          <Link
            href="/login"
            className="ml-2 inline-flex items-center gap-2 rounded-lg bg-[var(--hmc-blue)] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[var(--hmc-blue-dark)] hover:shadow-md"
          >
            <LogIn className="h-4 w-4" />
            Login
          </Link>
        </nav>

        <button
          type="button"
          className="rounded-lg p-2 text-[var(--hmc-blue)] transition hover:bg-[var(--hmc-blue-muted)] md:hidden"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-[var(--hmc-blue-border)] bg-white px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                    active
                      ? "bg-[var(--hmc-blue-muted)] text-[var(--hmc-blue)]"
                      : "text-[var(--hmc-text-muted)] hover:bg-[var(--hmc-blue-soft)]"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--hmc-blue)] px-4 py-3 text-sm font-medium text-white"
            >
              <LogIn className="h-4 w-4" />
              Librarian Login
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t border-[var(--hmc-blue-border)] bg-[var(--hmc-blue)] text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-3 lg:px-8">
        <div className="flex items-start gap-4">
          <Image
            src="/hmc-logo.png"
            alt="Harris Memorial College logo"
            width={64}
            height={64}
            className="shrink-0 object-contain"
          />
          <div>
            <p className="font-semibold">Harris Memorial College, Inc.</p>
            <p className="mt-1 text-sm text-blue-100">Library Services & Online Public Access Catalog</p>
            <p className="mt-2 text-xs leading-relaxed text-blue-200">{SCHOOL_TAGLINE} · Est. 1903</p>
          </div>
        </div>
        <div>
          <p className="font-semibold">Quick Links</p>
          <ul className="mt-3 space-y-2 text-sm text-blue-100">
            <li><Link href="/opac" className="transition hover:text-white">Search Catalog (OPAC)</Link></li>
            <li><Link href="/login" className="transition hover:text-white">Librarian Portal</Link></li>
            <li><Link href="/" className="transition hover:text-white">Library Home</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold">Collections</p>
          <ul className="mt-3 space-y-2 text-sm text-blue-100">
            <li>Preschool & Children&apos;s</li>
            <li>Junior & Senior High School</li>
            <li>College & Reference</li>
            <li>Filipiniana & Periodicals</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/15 py-4 text-center text-xs text-blue-200">
        © {new Date().getFullYear()} Harris Memorial College, Inc. — All rights reserved.
      </div>
    </footer>
  );
}
