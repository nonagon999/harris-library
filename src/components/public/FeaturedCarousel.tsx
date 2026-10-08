"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { SCHOOL_TAGLINE } from "@/lib/constants";

type Slide =
  | {
      type: "image";
      src: string;
      title: string;
      subtitle: string;
      objectPosition?: string;
      cta?: { label: string; href: string };
    }
  | {
      type: "brand";
      title: string;
      subtitle: string;
      cta?: { label: string; href: string };
    };

const SLIDES: Slide[] = [
  {
    type: "image",
    src: "/featured-library-1.png",
    title: "Welcome to Harris Memorial College Library",
    subtitle: "Your gateway to knowledge across all academic levels — Preschool through College.",
    objectPosition: "center center",
    cta: { label: "Search the Catalog", href: "/opac" },
  },
  {
    type: "image",
    src: "/featured-library-2.png",
    title: "Explore Our Collections",
    subtitle: "Browse textbooks, references, Filipiniana, and research materials for every learner.",
    objectPosition: "center center",
    cta: { label: "Browse OPAC", href: "/opac" },
  },
  {
    type: "image",
    src: "/featured-library-3.png",
    title: "Resources for Every Scholar",
    subtitle: "Discover history, literature, and academic references across our growing catalog.",
    objectPosition: "center center",
    cta: { label: "Start Searching", href: "/opac" },
  },
  {
    type: "image",
    src: "/featured-library-4.png",
    title: "Find Your Next Read",
    subtitle: "Search by title, author, ISBN, or call number through our Online Public Access Catalog.",
    objectPosition: "center center",
    cta: { label: "Search OPAC", href: "/opac" },
  },
  {
    type: "image",
    src: "/featured-library-5.png",
    title: "A Place for Learning & Discovery",
    subtitle: "Serving students, faculty, and staff with a welcoming space for research and reading.",
    objectPosition: "center center",
    cta: { label: "Visit the Catalog", href: "/opac" },
  },
  {
    type: "brand",
    title: "Harris Memorial College, Inc.",
    subtitle: `${SCHOOL_TAGLINE} — Est. 1903`,
    cta: { label: "Librarian Portal", href: "/login" },
  },
];

const AUTO_INTERVAL_MS = 5500;

export function FeaturedCarousel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = useCallback((index: number) => {
    setActive((index + SLIDES.length) % SLIDES.length);
  }, []);

  const next = useCallback(() => goTo(active + 1), [active, goTo]);
  const prev = useCallback(() => goTo(active - 1), [active, goTo]);

  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(() => {
      setActive((i) => (i + 1) % SLIDES.length);
    }, AUTO_INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused, active]);

  return (
    <section
      className="relative overflow-hidden bg-[var(--hmc-blue-dark)]"
      aria-label="Featured library photos"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="relative aspect-[16/7] min-h-[280px] w-full sm:min-h-[360px] lg:min-h-[440px]">
        {SLIDES.map((slide, index) => {
          const isActive = index === active;
          return (
            <div
              key={index}
              className={cn(
                "absolute inset-0 transition-opacity duration-700 ease-in-out",
                isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
              )}
              aria-hidden={!isActive}
            >
              {slide.type === "image" ? (
                <Image
                  src={slide.src}
                  alt={slide.title}
                  fill
                  priority={index === 0}
                  className="object-cover"
                  style={{ objectPosition: slide.objectPosition }}
                  sizes="100vw"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--hmc-blue)] via-[var(--hmc-blue-dark)] to-[#000d4d]" />
              )}

              <div className="absolute inset-0 bg-gradient-to-r from-[var(--hmc-blue-dark)]/85 via-[var(--hmc-blue)]/60 to-transparent" />

              <div className="relative z-20 flex h-full items-center">
                <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
                  <div className="max-w-2xl text-white">
                    {slide.type === "brand" && (
                      <Image
                        src="/hmc-logo.png"
                        alt="Harris Memorial College logo"
                        width={88}
                        height={88}
                        className="mb-6 object-contain drop-shadow-lg"
                      />
                    )}
                    <h2 className="text-2xl font-bold leading-tight tracking-tight drop-shadow-sm sm:text-4xl lg:text-5xl">
                      {slide.title}
                    </h2>
                    <p className="mt-3 max-w-xl text-sm leading-relaxed text-blue-100 sm:text-base lg:text-lg">
                      {slide.subtitle}
                    </p>
                    {slide.cta && (
                      <Link
                        href={slide.cta.href}
                        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-[var(--hmc-blue)] shadow-lg transition hover:bg-blue-50 hover:shadow-xl sm:text-base"
                      >
                        {slide.cta.label === "Search the Catalog" || slide.cta.label.includes("Search") || slide.cta.label.includes("Browse") ? (
                          <Search className="h-4 w-4" />
                        ) : null}
                        {slide.cta.label}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={prev}
        className="absolute left-3 top-1/2 z-30 -translate-y-1/2 rounded-full bg-white/90 p-2 text-[var(--hmc-blue)] shadow-md transition hover:bg-white hover:shadow-lg sm:left-5 sm:p-3"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
      </button>
      <button
        type="button"
        onClick={next}
        className="absolute right-3 top-1/2 z-30 -translate-y-1/2 rounded-full bg-white/90 p-2 text-[var(--hmc-blue)] shadow-md transition hover:bg-white hover:shadow-lg sm:right-5 sm:p-3"
        aria-label="Next slide"
      >
        <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
      </button>

      <div className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 gap-2">
        {SLIDES.map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => goTo(index)}
            className={cn(
              "h-2.5 rounded-full transition-all duration-300",
              index === active ? "w-8 bg-white" : "w-2.5 bg-white/50 hover:bg-white/80"
            )}
            aria-label={`Go to slide ${index + 1}`}
            aria-current={index === active ? "true" : undefined}
          />
        ))}
      </div>
    </section>
  );
}
