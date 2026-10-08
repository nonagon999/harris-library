import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { SCHOOL_NAME, LIBRARY_NAME } from "@/lib/constants";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  subtitle?: string;
  href?: string;
  className?: string;
  variant?: "light" | "dark";
}

const sizes = {
  sm: { img: 40, text: "text-sm" },
  md: { img: 56, text: "text-base" },
  lg: { img: 80, text: "text-lg" },
};

export function BrandLogo({
  size = "md",
  showText = true,
  subtitle,
  href,
  className,
  variant = "dark",
}: BrandLogoProps) {
  const s = sizes[size];
  const textPrimary = variant === "light" ? "text-white" : "text-[var(--hmc-blue)]";
  const textSecondary = variant === "light" ? "text-blue-100" : "text-slate-600";

  const content = (
    <div className={cn("flex items-center gap-3", className)}>
      <Image
        src="/hmc-logo.png"
        alt={`${SCHOOL_NAME} logo`}
        width={s.img}
        height={s.img}
        className="shrink-0 object-contain"
        priority
      />
      {showText && (
        <div className="min-w-0">
          <p className={cn("truncate font-bold leading-tight", textPrimary, s.text)}>
            {SCHOOL_NAME}
          </p>
          <p className={cn("truncate text-xs font-medium", textSecondary)}>
            {subtitle || LIBRARY_NAME}
          </p>
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="transition-opacity hover:opacity-90">
        {content}
      </Link>
    );
  }

  return content;
}
