"use client";

import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "green" | "blue" | "red" | "yellow" | "gray" | "orange" | "purple";
}

export function Badge({ children, variant = "gray" }: BadgeProps) {
  const colors = {
    green: "bg-green-100 text-green-800",
    blue: "bg-blue-100 text-blue-800",
    red: "bg-red-100 text-red-800",
    yellow: "bg-yellow-100 text-yellow-800",
    gray: "bg-slate-100 text-slate-700",
    orange: "bg-orange-100 text-orange-800",
    purple: "bg-purple-100 text-purple-800",
  };
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", colors[variant])}>
      {children}
    </span>
  );
}

export function statusBadgeVariant(status: string): BadgeProps["variant"] {
  const map: Record<string, BadgeProps["variant"]> = {
    AVAILABLE: "green",
    BORROWED: "blue",
    OVERDUE: "red",
    RETURNED: "green",
    LOST: "gray",
    DAMAGED: "orange",
    MISSING: "yellow",
    FOR_REPAIR: "purple",
    ARCHIVED: "gray",
    ACTIVE: "green",
    INACTIVE: "gray",
    SUSPENDED: "red",
    RENEWED: "blue",
  };
  return map[status] || "gray";
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={statusBadgeVariant(status)}>
      {status.replace(/_/g, " ")}
    </Badge>
  );
}
