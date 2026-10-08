"use client";

import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  subtitle?: string;
  className?: string;
}

export function StatCard({ title, value, icon, subtitle, className }: StatCardProps) {
  return (
    <div className={cn("rounded-xl border border-[var(--hmc-blue-border)] bg-white p-5 shadow-sm", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-[var(--hmc-text-muted)]">{title}</p>
          <p className="mt-2 text-3xl font-bold text-[var(--hmc-blue)]">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
        </div>
        {icon && <div className="rounded-lg bg-[var(--hmc-blue-muted)] p-3 text-[var(--hmc-blue)]">{icon}</div>}
      </div>
    </div>
  );
}
