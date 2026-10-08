"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, Card } from "@/components/ui/Layout";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/FormFields";
import { BORROWER_TYPES, ACADEMIC_LEVELS } from "@/lib/constants";

export default function NewBorrowerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    borrowerType: "STUDENT", firstName: "", middleName: "", lastName: "",
    studentId: "", employeeId: "", academicLevel: "COLLEGE",
    gradeLevel: "", yearLevel: "", section: "", department: "", position: "",
    email: "", contactNumber: "", address: "",
  });

  function update(f: string, v: string) { setForm((p) => ({ ...p, [f]: v })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/borrowers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/portal/borrowers/${data.id}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  const isStudent = form.borrowerType === "STUDENT";

  return (
    <div>
      <PageHeader title="Add Borrower" />
      <Card>
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <Select label="Borrower Type *" value={form.borrowerType} onChange={(e) => update("borrowerType", e.target.value)} options={[...BORROWER_TYPES]} />
          <Input label="First Name *" value={form.firstName} onChange={(e) => update("firstName", e.target.value)} required />
          <Input label="Middle Name" value={form.middleName} onChange={(e) => update("middleName", e.target.value)} />
          <Input label="Last Name *" value={form.lastName} onChange={(e) => update("lastName", e.target.value)} required />
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
          <div className="md:col-span-2 flex gap-3">
            <Button type="submit" disabled={loading}>Save Borrower</Button>
            <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
