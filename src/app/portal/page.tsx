"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Copy,
  Users,
  AlertTriangle,
  Plus,
  ArrowLeftRight,
  BarChart3,
} from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { Card, PageHeader, LoadingSpinner, EmptyState } from "@/components/ui/Layout";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { formatDate, getBorrowerFullName, getBorrowerDisplayId } from "@/lib/utils";
import { labelFor, ACADEMIC_LEVELS } from "@/lib/constants";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#002094", "#0033cc", "#d97706", "#059669", "#7c3aed", "#dc2626"];

export default function DashboardPage() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!data) return <EmptyState message="Failed to load dashboard." />;

  const stats = data.stats as Record<string, number>;
  const levelData = ((data.booksByLevel as { academicLevel: string; _count: { id: number } }[]) || []).map(
    (l) => ({
      name: labelFor(ACADEMIC_LEVELS, l.academicLevel),
      count: l._count.id,
    })
  );

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Library overview and recent activity"
        actions={
          <>
            <Link href="/portal/books/new"><Button size="sm"><Plus className="h-4 w-4" /> Add Book</Button></Link>
            <Link href="/portal/circulation/borrow"><Button size="sm" variant="secondary"><ArrowLeftRight className="h-4 w-4" /> Borrow</Button></Link>
            <Link href="/portal/reports"><Button size="sm" variant="outline"><BarChart3 className="h-4 w-4" /> Reports</Button></Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Book Titles" value={stats.totalTitles} icon={<BookOpen className="h-5 w-5" />} />
        <StatCard title="Total Copies" value={stats.totalCopies} icon={<Copy className="h-5 w-5" />} />
        <StatCard title="Available Copies" value={stats.availableCopies} />
        <StatCard title="Borrowed Copies" value={stats.borrowedCopies} />
        <StatCard title="Overdue Books" value={stats.overdueCopies} icon={<AlertTriangle className="h-5 w-5" />} />
        <StatCard title="Total Borrowers" value={stats.totalBorrowers} icon={<Users className="h-5 w-5" />} />
        <StatCard title="Books Added This Month" value={stats.booksAddedThisMonth} />
        <StatCard title="Borrowed This Month" value={stats.borrowedThisMonth} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Books by Academic Level">
          {levelData.length ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={levelData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#002094" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="No data available." />
          )}
        </Card>

        <Card title="Collection Distribution">
          {levelData.length ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={levelData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {levelData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="No data available." />
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Recent Borrowing">
          {((data.recentTransactions as Record<string, unknown>[]) || []).length === 0 ? (
            <EmptyState message="No borrowing activity yet. Start by adding books and borrowers." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left text-slate-500">
                  <th className="pb-2">Book</th><th className="pb-2">Borrower</th><th className="pb-2">Date</th><th className="pb-2">Status</th>
                </tr></thead>
                <tbody>
                  {((data.recentTransactions as Record<string, unknown>[]) || []).map((t) => (
                    <tr key={t.id as string} className="border-b border-slate-50">
                      <td className="py-2">{(t.book as { title: string }).title}</td>
                      <td className="py-2">{getBorrowerFullName(t.borrower as Parameters<typeof getBorrowerFullName>[0])}</td>
                      <td className="py-2">{formatDate(t.borrowDate as string)}</td>
                      <td className="py-2"><StatusBadge status={t.status as string} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title="Overdue Books">
          {((data.overdueBooks as Record<string, unknown>[]) || []).length === 0 ? (
            <EmptyState message="No overdue books found." />
          ) : (
            <div className="space-y-3">
              {((data.overdueBooks as Record<string, unknown>[]) || []).map((t) => (
                <div key={t.id as string} className="flex items-center justify-between rounded-lg bg-red-50 px-4 py-3">
                  <div>
                    <p className="font-medium">{(t.book as { title: string }).title}</p>
                    <p className="text-xs text-slate-600">
                      {getBorrowerFullName(t.borrower as Parameters<typeof getBorrowerFullName>[0])} — Due {formatDate(t.dueDate as string)}
                    </p>
                  </div>
                  <StatusBadge status="OVERDUE" />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Most Borrowed Books">
          {((data.mostBorrowedBooks as { title?: string; borrowCount?: number }[]) || []).length === 0 ? (
            <EmptyState message="No borrowing history yet." />
          ) : (
            <div className="space-y-2">
              {((data.mostBorrowedBooks as { title?: string; borrowCount?: number }[]) || []).map((b, i) => (
                <div key={i} className="flex justify-between rounded-lg bg-slate-50 px-4 py-2">
                  <span>{i + 1}. {b.title}</span>
                  <span className="font-semibold text-[var(--hmc-blue)]">{b.borrowCount} borrows</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Most Active Borrowers">
          {((data.mostActiveBorrowers as { firstName?: string; lastName?: string; borrowCount?: number }[]) || []).length === 0 ? (
            <EmptyState message="No active borrowers yet." />
          ) : (
            <div className="space-y-2">
              {((data.mostActiveBorrowers as { firstName?: string; lastName?: string; borrowCount?: number }[]) || []).map((b, i) => (
                <div key={i} className="flex justify-between rounded-lg bg-slate-50 px-4 py-2">
                  <span>{i + 1}. {b.firstName} {b.lastName}</span>
                  <span className="font-semibold text-[var(--hmc-blue)]">{b.borrowCount} books</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
