"use client";

import { useEffect, useState, use } from "react";
import { useSearchParams } from "next/navigation";
import { Pencil } from "lucide-react";
import { PageHeader, Card, LoadingSpinner, EmptyState } from "@/components/ui/Layout";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/FormFields";
import { StatusBadge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import { labelFor, ACADEMIC_LEVELS, BORROWER_TYPES } from "@/lib/constants";

const BORROWER_STATUSES = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "SUSPENDED", label: "Suspended" },
];

type BorrowerForm = {
  borrowerType: string;
  status: string;
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  studentId: string;
  employeeId: string;
  academicLevel: string;
  gradeLevel: string;
  yearLevel: string;
  section: string;
  department: string;
  position: string;
  email: string;
  contactNumber: string;
  address: string;
};

function toForm(data: Record<string, unknown>): BorrowerForm {
  return {
    borrowerType: (data.borrowerType as string) || "STUDENT",
    status: (data.status as string) || "ACTIVE",
    firstName: (data.firstName as string) || "",
    middleName: (data.middleName as string) || "",
    lastName: (data.lastName as string) || "",
    suffix: (data.suffix as string) || "",
    studentId: (data.studentId as string) || "",
    employeeId: (data.employeeId as string) || "",
    academicLevel: (data.academicLevel as string) || "COLLEGE",
    gradeLevel: (data.gradeLevel as string) || "",
    yearLevel: (data.yearLevel as string) || "",
    section: (data.section as string) || "",
    department: (data.department as string) || "",
    position: (data.position as string) || "",
    email: (data.email as string) || "",
    contactNumber: (data.contactNumber as string) || "",
    address: (data.address as string) || "",
  };
}

export default function BorrowerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [editing, setEditing] = useState(searchParams.get("edit") === "1");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<BorrowerForm | null>(null);

  function loadBorrower() {
    fetch(`/api/borrowers/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setData(d);
        setForm(toForm(d));
      })
      .catch(console.error);
  }

  useEffect(() => {
    loadBorrower();
  }, [id]);

  function update(field: keyof BorrowerForm, value: string) {
    setForm((prev) => (prev ? { ...prev, [field]: value } : prev));
  }

  function startEdit() {
    if (data) setForm(toForm(data));
    setEditing(true);
  }

  function cancelEdit() {
    if (data) setForm(toForm(data));
    setEditing(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/borrowers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to update borrower");
      setEditing(false);
      loadBorrower();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setSaving(false);
    }
  }

  if (!data || !form) return <LoadingSpinner />;

  const summary = data.summary as Record<string, number>;
  const transactions = (data.transactions as Record<string, unknown>[]) || [];
  const isStudent = form.borrowerType === "STUDENT";

  return (
    <div>
      <PageHeader
        title={data.fullName as string}
        description={`ID: ${data.displayId as string}`}
        actions={
          !editing ? (
            <Button size="sm" onClick={startEdit}>
              <Pencil className="h-4 w-4" /> Edit Information
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6 mb-6">
        {[
          { label: "Total Borrowed", value: summary.totalBorrowed },
          { label: "Currently Borrowed", value: summary.currentlyBorrowed },
          { label: "Returned", value: summary.returned },
          { label: "Overdue", value: summary.overdue },
          { label: "Lost", value: summary.lost },
          { label: "Damaged", value: summary.damaged },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border bg-white p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-blue-900">{s.value}</p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Borrower Information" className="lg:col-span-1">
          {editing ? (
            <form onSubmit={handleSave} className="space-y-3">
              <Select
                label="Borrower Type *"
                value={form.borrowerType}
                onChange={(e) => update("borrowerType", e.target.value)}
                options={[...BORROWER_TYPES]}
              />
              <Select
                label="Status *"
                value={form.status}
                onChange={(e) => update("status", e.target.value)}
                options={BORROWER_STATUSES}
              />
              <Input label="First Name *" value={form.firstName} onChange={(e) => update("firstName", e.target.value)} required />
              <Input label="Middle Name" value={form.middleName} onChange={(e) => update("middleName", e.target.value)} />
              <Input label="Last Name *" value={form.lastName} onChange={(e) => update("lastName", e.target.value)} required />
              <Input label="Suffix" value={form.suffix} onChange={(e) => update("suffix", e.target.value)} placeholder="Jr., Sr., III" />
              {isStudent ? (
                <>
                  <Input label="Student ID *" value={form.studentId} onChange={(e) => update("studentId", e.target.value)} required />
                  <Select label="Academic Level" value={form.academicLevel} onChange={(e) => update("academicLevel", e.target.value)} options={[...ACADEMIC_LEVELS]} />
                  <Input label="Grade Level" value={form.gradeLevel} onChange={(e) => update("gradeLevel", e.target.value)} />
                  <Input label="Year Level" value={form.yearLevel} onChange={(e) => update("yearLevel", e.target.value)} />
                  <Input label="Section" value={form.section} onChange={(e) => update("section", e.target.value)} />
                </>
              ) : (
                <>
                  <Input label="Employee ID *" value={form.employeeId} onChange={(e) => update("employeeId", e.target.value)} required />
                  <Input label="Department" value={form.department} onChange={(e) => update("department", e.target.value)} />
                  <Input label="Position" value={form.position} onChange={(e) => update("position", e.target.value)} />
                </>
              )}
              <Input label="Email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
              <Input label="Contact Number" value={form.contactNumber} onChange={(e) => update("contactNumber", e.target.value)} />
              <Textarea label="Address" value={form.address} onChange={(e) => update("address", e.target.value)} rows={2} />
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save Changes"}</Button>
                <Button type="button" variant="secondary" onClick={cancelEdit} disabled={saving}>Cancel</Button>
              </div>
            </form>
          ) : (
            <dl className="space-y-2 text-sm">
              <div><dt className="text-slate-500">Type</dt><dd>{labelFor(BORROWER_TYPES, data.borrowerType as string)}</dd></div>
              <div><dt className="text-slate-500">Name</dt><dd>{data.fullName as string}</dd></div>
              {isStudent ? (
                <>
                  <div><dt className="text-slate-500">Student ID</dt><dd>{(data.studentId as string) || "—"}</dd></div>
                  <div><dt className="text-slate-500">Level</dt><dd>{data.academicLevel ? labelFor(ACADEMIC_LEVELS, data.academicLevel as string) : "—"}</dd></div>
                  {(data.gradeLevel || data.yearLevel || data.section) && (
                    <div><dt className="text-slate-500">Grade / Year / Section</dt><dd>{[(data.gradeLevel as string), (data.yearLevel as string), (data.section as string)].filter(Boolean).join(" · ") || "—"}</dd></div>
                  )}
                </>
              ) : (
                <>
                  <div><dt className="text-slate-500">Employee ID</dt><dd>{(data.employeeId as string) || "—"}</dd></div>
                  <div><dt className="text-slate-500">Department</dt><dd>{(data.department as string) || "—"}</dd></div>
                  <div><dt className="text-slate-500">Position</dt><dd>{(data.position as string) || "—"}</dd></div>
                </>
              )}
              <div><dt className="text-slate-500">Email</dt><dd>{(data.email as string) || "—"}</dd></div>
              <div><dt className="text-slate-500">Contact</dt><dd>{(data.contactNumber as string) || "—"}</dd></div>
              <div><dt className="text-slate-500">Address</dt><dd>{(data.address as string) || "—"}</dd></div>
              <div><dt className="text-slate-500">Status</dt><dd><StatusBadge status={data.status as string} /></dd></div>
            </dl>
          )}
        </Card>

        <Card title="Borrowing History" className="lg:col-span-2">
          {transactions.length === 0 ? (
            <EmptyState message="No borrowing history yet." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left text-slate-500">
                  <th className="pb-2">Book</th><th className="pb-2">Borrowed</th><th className="pb-2">Due</th><th className="pb-2">Returned</th><th className="pb-2">Status</th>
                </tr></thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.id as string} className="border-b border-slate-50">
                      <td className="py-2">{(t.book as { title: string }).title}</td>
                      <td className="py-2">{formatDate(t.borrowDate as string)}</td>
                      <td className="py-2">{formatDate(t.dueDate as string)}</td>
                      <td className="py-2">{formatDate(t.returnDate as string)}</td>
                      <td className="py-2"><StatusBadge status={t.status as string} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
