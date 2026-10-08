"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  ArrowLeftRight,
  RotateCcw,
  AlertTriangle,
  BarChart3,
  Settings,
  ClipboardList,
  LogOut,
  ExternalLink,
  Menu,
  FileStack,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/ui/BrandLogo";

const navItems = [
  { href: "/portal", label: "Dashboard", icon: LayoutDashboard },
  { href: "/portal/books", label: "Books", icon: BookOpen },
  { href: "/portal/marc/import", label: "MARC / Koha Migration", icon: FileStack },
  { href: "/portal/borrowers", label: "Borrowers", icon: Users },
  { href: "/portal/circulation/borrow", label: "Borrow Book", icon: ArrowLeftRight },
  { href: "/portal/circulation/return", label: "Return Book", icon: RotateCcw },
  { href: "/portal/circulation/overdue", label: "Overdue", icon: AlertTriangle },
  { href: "/portal/reports", label: "📊 Reports", icon: BarChart3 },
  { href: "/portal/audit", label: "Audit Log", icon: ClipboardList },
  { href: "/portal/settings", label: "Settings", icon: Settings },
];

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/login", { method: "DELETE" });
    router.push("/login");
  }

  return (
    <div className="flex min-h-screen bg-[var(--hmc-blue-muted)]">
      <aside
        className={cn(
          "no-print fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-[var(--hmc-blue)] text-white transition-transform lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="border-b border-white/15 p-4">
          <BrandLogo size="sm" subtitle="Librarian Portal" variant="light" />
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== "/portal" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  active ? "bg-white text-[var(--hmc-blue)] font-medium" : "text-blue-100 hover:bg-white/15 hover:text-white"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-1 border-t border-white/15 p-3">
          <Link
            href="/opac"
            target="_blank"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-blue-100 hover:bg-white/15"
          >
            <ExternalLink className="h-4 w-4" />
            Open OPAC
          </Link>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-blue-100 hover:bg-white/15"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="flex flex-1 flex-col">
        <header className="no-print sticky top-0 z-30 flex items-center gap-4 border-b border-[var(--hmc-blue-border)] bg-white px-4 py-3 lg:px-6">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-6 w-6 text-[var(--hmc-blue)]" />
          </button>
          <BrandLogo size="sm" subtitle="Library Management" className="hidden sm:flex" />
          <div className="flex-1" />
          <Link href="/opac" target="_blank" className="text-sm font-medium text-[var(--hmc-blue)] hover:underline">
            View OPAC
          </Link>
        </header>
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
