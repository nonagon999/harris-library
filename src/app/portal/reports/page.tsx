"use client";

import { useEffect, useState } from "react";
import { PageHeader, Card, LoadingSpinner, EmptyState } from "@/components/ui/Layout";
import { StatCard } from "@/components/ui/StatCard";
import { DateRangeFilter, ExportButtons } from "@/components/reports/ReportFilters";
import { Select } from "@/components/ui/FormFields";
import { exportToCSV, exportToPDF } from "@/lib/export";
import { labelFor, ACADEMIC_LEVELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from "recharts";

const COLORS = ["#002094", "#0033cc", "#d97706", "#059669", "#7c3aed", "#dc2626", "#0891b2", "#be185d"];

export default function ReportsPage() {
  const [preset, setPreset] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [topLimit, setTopLimit] = useState("10");
  const [summary, setSummary] = useState<Record<string, unknown> | null>(null);
  const [mostBorrowed, setMostBorrowed] = useState<Record<string, unknown>[]>([]);
  const [mostActive, setMostActive] = useState<Record<string, unknown>[]>([]);
  const [overdue, setOverdue] = useState<Record<string, unknown>[]>([]);
  const [booksAdded, setBooksAdded] = useState<Record<string, unknown>[]>([]);
  const [monthlyBorrowing, setMonthlyBorrowing] = useState<{ month: string; count: number }[]>([]);
  const [monthlyAdded, setMonthlyAdded] = useState<{ month: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const params = () => {
    const p = new URLSearchParams({ preset });
    if (preset === "custom") {
      if (startDate) p.set("startDate", startDate);
      if (endDate) p.set("endDate", endDate);
    }
    return p.toString();
  };

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      setLoading(true);
      const q = params();
      Promise.all([
        fetch(`/api/reports?type=summary&${q}`).then((r) => r.json()),
        fetch(`/api/reports?type=most-borrowed&${q}&limit=${topLimit}`).then((r) => r.json()),
        fetch(`/api/reports?type=most-active-borrowers&${q}&limit=${topLimit}`).then((r) => r.json()),
        fetch(`/api/reports?type=overdue`).then((r) => r.json()),
        fetch(`/api/reports?type=books-added&${q}`).then((r) => r.json()),
        fetch(`/api/reports?type=monthly-borrowing&year=${year}`).then((r) => r.json()),
        fetch(`/api/reports?type=monthly-books-added&year=${year}`).then((r) => r.json()),
      ])
        .then(([s, mb, ma, od, ba, mbor, madd]) => {
          if (cancelled) return;
          setSummary(s);
          setMostBorrowed(mb.books || []);
          setMostActive(ma.borrowers || []);
          setOverdue(od.books || []);
          setBooksAdded(ba.books || []);
          setMonthlyBorrowing(mbor.data || []);
          setMonthlyAdded(madd.data || []);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [preset, startDate, endDate, year, topLimit]);

  const stats = (summary?.summary as Record<string, number>) || {};
  const booksByCategory = (summary?.booksByCategory as { category: string; count: number }[]) || [];
  const copyStatus = (summary?.copyStatusBreakdown as { status: string; _count: { id: number } }[]) || [];
  const copyChartData = copyStatus.map((c) => ({ name: c.status, value: c._count.id }));

  const filterLabel = preset === "custom" ? `${startDate} – ${endDate}` : preset;

  function exportMostBorrowedCSV() {
    exportToCSV(
      mostBorrowed.map((b) => ({
        Rank: b.rank,
        Title: b.title,
        Author: b.author,
        "Times Borrowed": b.timesBorrowed,
        "Available Copies": b.availableCopies,
      })),
      "most-borrowed-books",
      { reportTitle: "Most Borrowed Books", filters: filterLabel }
    );
  }

  function exportMostBorrowedPDF() {
    exportToPDF(
      [
        { header: "Rank", dataKey: "rank" },
        { header: "Title", dataKey: "title" },
        { header: "Author", dataKey: "author" },
        { header: "Times Borrowed", dataKey: "timesBorrowed" },
      ],
      mostBorrowed as Record<string, unknown>[],
      "most-borrowed-books",
      { reportTitle: "Most Borrowed Books", filters: filterLabel }
    );
  }

  if (loading && !summary) return <LoadingSpinner />;

  return (
    <div className="print-area">
      <div className="print-only mb-4 text-center">
        <h1 className="text-xl font-bold">HARRIS MEMORIAL COLLEGE, INC.</h1>
        <p>LIBRARY SERVICES — Librarian Reports</p>
        <p className="text-sm">Generated: {formatDate(new Date())}</p>
      </div>

      <PageHeader
        title="📊 Librarian Reports"
        description="Library statistics and activity reports"
        actions={
          <ExportButtons
            onExportCSV={exportMostBorrowedCSV}
            onExportPDF={exportMostBorrowedPDF}
            onPrint={() => window.print()}
          />
        }
      />

      <Card className="no-print mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <DateRangeFilter
            preset={preset}
            onPresetChange={setPreset}
            startDate={startDate}
            endDate={endDate}
            onStartChange={setStartDate}
            onEndChange={setEndDate}
          />
          <Select
            label="Top Results"
            value={topLimit}
            onChange={(e) => setTopLimit(e.target.value)}
            options={[
              { value: "5", label: "Top 5" },
              { value: "10", label: "Top 10" },
              { value: "20", label: "Top 20" },
              { value: "0", label: "All" },
            ]}
          />
          <Select
            label="Chart Year"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            options={[2024, 2025, 2026, 2027].map((y) => ({ value: String(y), label: String(y) }))}
          />
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard title="Total Books" value={stats.totalBooks ?? 0} />
        <StatCard title="Total Copies" value={stats.totalCopies ?? 0} />
        <StatCard title="Available" value={stats.availableCopies ?? 0} />
        <StatCard title="Borrowed" value={stats.borrowedCopies ?? 0} />
        <StatCard title="Overdue" value={stats.currentlyOverdue ?? 0} />
        <StatCard title="Total Borrowers" value={stats.totalBorrowers ?? 0} />
        <StatCard title="Total Returned" value={stats.totalReturned ?? 0} />
        <StatCard title="Lost/Damaged" value={(stats.lostCopies ?? 0) + (stats.damagedCopies ?? 0)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        <Card title="Available vs Borrowed vs Overdue">
          {copyChartData.length ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={copyChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {copyChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyState message="No copy data." />}
        </Card>

        <Card title="Books by Category">
          {booksByCategory.length ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={booksByCategory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" tick={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#002094" />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState message="No category data." />}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        <Card title={`Monthly Borrowing Activity (${year})`}>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={monthlyBorrowing}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card title={`Books Added Per Month (${year})`}>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyAdded}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#d97706" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card title="Most Borrowed Books" className="mb-6">
        {mostBorrowed.length === 0 ? (
          <EmptyState message="No borrowing records found for this date range." />
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-slate-500">
              <th className="pb-2">Rank</th><th className="pb-2">Book</th><th className="pb-2">Author</th><th className="pb-2">Times Borrowed</th><th className="pb-2">Available</th>
            </tr></thead>
            <tbody>
              {mostBorrowed.map((b) => (
                <tr key={b.rank as number} className="border-b border-slate-50">
                  <td className="py-2">{b.rank as number}</td>
                  <td className="py-2 font-medium">{b.title as string}</td>
                  <td className="py-2">{b.author as string}</td>
                  <td className="py-2 font-semibold">{b.timesBorrowed as number}</td>
                  <td className="py-2">{b.availableCopies as number}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card title="Most Active Borrowers" className="mb-6">
        {mostActive.length === 0 ? (
          <EmptyState message="No borrower activity found." />
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-slate-500">
              <th className="pb-2">Rank</th><th className="pb-2">Name</th><th className="pb-2">ID</th><th className="pb-2">Total</th><th className="pb-2">Current</th><th className="pb-2">Returned</th>
            </tr></thead>
            <tbody>
              {mostActive.map((b) => (
                <tr key={b.rank as number} className="border-b border-slate-50">
                  <td className="py-2">{b.rank as number}</td>
                  <td className="py-2">{b.name as string}</td>
                  <td className="py-2 font-mono text-xs">{b.borrowerId as string}</td>
                  <td className="py-2 font-semibold">{b.totalBorrowed as number}</td>
                  <td className="py-2">{b.currentlyBorrowed as number}</td>
                  <td className="py-2">{b.returned as number}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card title="Overdue Books">
        {overdue.length === 0 ? (
          <EmptyState message="No overdue books found." />
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-slate-500">
              <th className="pb-2">Book</th><th className="pb-2">Borrower</th><th className="pb-2">Due</th><th className="pb-2">Days Overdue</th>
            </tr></thead>
            <tbody>
              {overdue.map((b, i) => (
                <tr key={i} className="border-b border-slate-50">
                  <td className="py-2">{b.bookTitle as string}</td>
                  <td className="py-2">{b.borrowerName as string}</td>
                  <td className="py-2">{formatDate(b.dueDate as string)}</td>
                  <td className="py-2 text-red-600 font-semibold">{b.daysOverdue as number}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card title={`Books Added (${booksAdded.length})`} className="mt-6">
        {booksAdded.length === 0 ? (
          <EmptyState message="No books have been added during the selected period." />
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-slate-500">
              <th className="pb-2">Title</th><th className="pb-2">Author</th><th className="pb-2">ISBN</th><th className="pb-2">Category</th><th className="pb-2">Date Added</th><th className="pb-2">Copies</th>
            </tr></thead>
            <tbody>
              {booksAdded.map((b, i) => (
                <tr key={i} className="border-b border-slate-50">
                  <td className="py-2">{b.title as string}</td>
                  <td className="py-2">{b.author as string}</td>
                  <td className="py-2">{(b.isbn as string) || "—"}</td>
                  <td className="py-2">{(b.category as string) || "—"}</td>
                  <td className="py-2">{formatDate(b.dateAdded as string)}</td>
                  <td className="py-2">{b.copies as number}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
