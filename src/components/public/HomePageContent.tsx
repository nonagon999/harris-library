"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  BookOpen,
  GraduationCap,
  Clock,
  MapPin,
  Mail,
  Phone,
  ArrowRight,
  Library,
  Users,
  BookMarked,
} from "lucide-react";
import { PublicHeader, PublicFooter } from "@/components/public/PublicLayout";
import { FeaturedCarousel } from "@/components/public/FeaturedCarousel";
import { SectionHeading } from "@/components/public/SectionHeading";
import { OpacBookCard, type OpacBookSummary } from "@/components/public/OpacBookCard";

type LibraryInfo = {
  schoolName: string;
  libraryName: string;
  academicYear: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  address?: string | null;
  borrowingPeriodDays: number;
  maxBooksAllowed: number;
};

const COLLECTIONS = [
  { title: "Preschool", desc: "Children's collection & early learning resources", icon: BookMarked },
  { title: "Junior High", desc: "Textbooks & references for JHS students", icon: BookOpen },
  { title: "Senior High", desc: "SHS curriculum & specialized materials", icon: GraduationCap },
  { title: "College", desc: "Higher education & research resources", icon: Library },
];

const QUICK_LINKS = [
  { href: "/opac", label: "Search Catalog", desc: "Find books by title, author, or ISBN", icon: Search },
  { href: "/opac", label: "Browse Collections", desc: "Explore all academic levels", icon: BookOpen },
  { href: "/login", label: "Librarian Portal", desc: "Manage circulation & catalog", icon: Users },
];

export function HomePageContent() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [recentBooks, setRecentBooks] = useState<OpacBookSummary[]>([]);
  const [featuredBooks, setFeaturedBooks] = useState<OpacBookSummary[]>([]);
  const [libraryInfo, setLibraryInfo] = useState<LibraryInfo | null>(null);
  const [loadingBooks, setLoadingBooks] = useState(true);

  useEffect(() => {
    fetch("/api/opac/home")
      .then((r) => r.json())
      .then((d) => {
        setRecentBooks(d.recentBooks || []);
        setFeaturedBooks(d.featuredBooks || []);
        setLibraryInfo(d.libraryInfo || null);
      })
      .catch(console.error)
      .finally(() => setLoadingBooks(false));
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/opac?q=${encodeURIComponent(q)}` : "/opac");
  }

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />
      <FeaturedCarousel />

      {/* OPAC Search */}
      <section className="section-hmc bg-[var(--hmc-blue-soft)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            centered
            title="Search the Library Catalog"
            description="Use our Online Public Access Catalog (OPAC) to find books, check availability, and view call numbers."
          />
          <form onSubmit={handleSearch} className="mx-auto mt-8 max-w-3xl">
            <div className="relative">
              <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--hmc-blue)]" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by title, author, ISBN, subject, or accession number..."
                className="w-full rounded-2xl border border-[var(--hmc-blue-border)] bg-white py-4 pl-14 pr-36 text-base shadow-sm transition focus:border-[var(--hmc-blue)] focus:outline-none focus:ring-4 focus:ring-[var(--hmc-blue-muted)] sm:py-5 sm:text-lg"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-[var(--hmc-blue)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--hmc-blue-dark)] sm:px-6 sm:py-3"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Featured Books */}
      <section className="section-hmc">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading title="Featured Books" description="Available titles from our collection." />
            <Link
              href="/opac"
              className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--hmc-blue)] transition hover:text-[var(--hmc-blue-dark)]"
            >
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-8">
            {loadingBooks ? (
              <p className="text-center text-[var(--hmc-text-muted)]">Loading books...</p>
            ) : featuredBooks.length === 0 ? (
              <div className="card-hmc py-16 text-center">
                <BookOpen className="mx-auto h-10 w-10 text-[var(--hmc-blue)]/40" />
                <p className="mt-4 font-medium text-[var(--hmc-blue)]">No featured books yet</p>
                <p className="mt-1 text-sm text-[var(--hmc-text-muted)]">
                  New titles will appear here once added to the catalog.
                </p>
                <Link href="/opac" className="mt-4 inline-block text-sm font-semibold text-[var(--hmc-blue)] hover:underline">
                  Browse OPAC →
                </Link>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {featuredBooks.map((book) => (
                  <OpacBookCard key={book.id} book={book} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Recently Added */}
      <section className="section-hmc bg-[var(--hmc-blue-soft)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading title="Recently Added" description="The latest additions to our library catalog." />
            <Link
              href="/opac"
              className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--hmc-blue)] transition hover:text-[var(--hmc-blue-dark)]"
            >
              See more <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-8">
            {loadingBooks ? (
              <p className="text-center text-[var(--hmc-text-muted)]">Loading...</p>
            ) : recentBooks.length === 0 ? (
              <div className="card-hmc py-12 text-center text-sm text-[var(--hmc-text-muted)]">
                No books in the catalog yet.
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {recentBooks.map((book) => (
                  <OpacBookCard key={book.id} book={book} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Library Information */}
      <section className="section-hmc">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            centered
            title="Library Information"
            description="Everything you need to know about borrowing and using Harris Memorial College Library resources."
          />
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <div className="card-hmc p-6 sm:p-8">
              <h3 className="text-lg font-semibold text-[var(--hmc-blue)]">
                {libraryInfo?.libraryName || "Harris Memorial College Library"}
              </h3>
              <p className="mt-1 text-sm text-[var(--hmc-text-muted)]">
                {libraryInfo?.schoolName || "Harris Memorial College, Inc."}
              </p>
              {libraryInfo?.academicYear && (
                <p className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[var(--hmc-blue-muted)] px-3 py-1.5 text-sm font-medium text-[var(--hmc-blue)]">
                  <GraduationCap className="h-4 w-4" />
                  Academic Year {libraryInfo.academicYear}
                </p>
              )}
              <ul className="mt-6 space-y-3 text-sm text-[var(--hmc-text-muted)]">
                <li className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[var(--hmc-blue)]" />
                  Borrowing period: {libraryInfo?.borrowingPeriodDays ?? 7} days · Max {libraryInfo?.maxBooksAllowed ?? 3} books
                </li>
                {libraryInfo?.address && (
                  <li className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--hmc-blue)]" />
                    {libraryInfo.address}
                  </li>
                )}
                {libraryInfo?.contactEmail && (
                  <li className="flex items-start gap-3">
                    <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[var(--hmc-blue)]" />
                    {libraryInfo.contactEmail}
                  </li>
                )}
                {libraryInfo?.contactPhone && (
                  <li className="flex items-start gap-3">
                    <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[var(--hmc-blue)]" />
                    {libraryInfo.contactPhone}
                  </li>
                )}
              </ul>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {COLLECTIONS.map(({ title, desc, icon: Icon }) => (
                <div key={title} className="card-hmc p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--hmc-blue-muted)] text-[var(--hmc-blue)]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h4 className="mt-3 font-semibold text-[var(--hmc-blue)]">{title}</h4>
                  <p className="mt-1 text-sm text-[var(--hmc-text-muted)]">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="section-hmc bg-[var(--hmc-blue)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Quick Links</h2>
            <p className="mt-2 text-sm text-blue-100 sm:text-base">
              Jump to the most-used library services.
            </p>
            <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-white/80" />
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {QUICK_LINKS.map(({ href, label, desc, icon: Icon }) => (
              <Link
                key={label}
                href={href}
                className="group rounded-2xl border border-white/20 bg-white/10 p-6 text-white backdrop-blur-sm transition hover:border-white/40 hover:bg-white/15"
              >
                <Icon className="h-8 w-8 text-blue-200 transition group-hover:text-white" />
                <h3 className="mt-4 font-semibold">{label}</h3>
                <p className="mt-1 text-sm text-blue-100">{desc}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-blue-200 group-hover:text-white">
                  Go <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
