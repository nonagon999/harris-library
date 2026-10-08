"use client";

import { useState } from "react";
import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

type OpacBookCoverProps = {
  title: string;
  coverImageUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClasses = {
  sm: "aspect-[2/3]",
  md: "aspect-[2/3]",
  lg: "aspect-[2/3]",
};

export function OpacBookCover({ title, coverImageUrl, size = "md", className }: OpacBookCoverProps) {
  const [failed, setFailed] = useState(false);
  const showPlaceholder = !coverImageUrl || failed;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg bg-gradient-to-br from-[var(--hmc-blue-muted)] to-[var(--hmc-blue-soft)]",
        sizeClasses[size],
        className
      )}
    >
      {showPlaceholder ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center">
          <BookOpen className="h-10 w-10 text-[var(--hmc-blue)]/35" aria-hidden />
          <span className="line-clamp-3 text-xs font-medium leading-snug text-[var(--hmc-blue)]/50">
            {title}
          </span>
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coverImageUrl}
          alt={`Cover of ${title}`}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
