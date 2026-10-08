"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, Card, LoadingSpinner } from "@/components/ui/Layout";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/FormFields";

interface LibrarySettings {
  schoolName: string;
  libraryName: string;
  logoUrl: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  academicYear: string;
  borrowingPeriodDays: number;
  maxBooksAllowed: number;
  renewalLimit: number;
  libraryRules: string | null;
}

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<LibrarySettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings", { credentials: "include" })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) {
          setLoadError(data.error || "Failed to load settings");
          return;
        }
        setSettings(data);
      })
      .catch(() => setLoadError("Failed to load settings"));
  }, []);

  function update(field: keyof LibrarySettings, value: string) {
    setSettings((current) => {
      if (!current) return current;
      if (field === "borrowingPeriodDays" || field === "maxBooksAllowed" || field === "renewalLimit") {
        return { ...current, [field]: value === "" ? 0 : Number(value) };
      }
      return { ...current, [field]: value };
    });
    setSaved(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;

    setLoading(true);
    setSaveError("");
    setSaved(false);

    const payload = {
      schoolName: settings.schoolName,
      libraryName: settings.libraryName,
      logoUrl: settings.logoUrl,
      contactEmail: settings.contactEmail,
      contactPhone: settings.contactPhone,
      address: settings.address,
      academicYear: settings.academicYear,
      borrowingPeriodDays: settings.borrowingPeriodDays,
      maxBooksAllowed: settings.maxBooksAllowed,
      renewalLimit: settings.renewalLimit,
      libraryRules: settings.libraryRules,
    };

    const res = await fetch("/api/settings", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (!res.ok) {
      setSaveError(data.error || "Failed to save settings");
      if (res.status === 401) {
        router.push("/login");
      }
    } else {
      setSettings(data);
      setSaved(true);
    }

    setLoading(false);
  }

  if (loadError) {
    return (
      <div>
        <PageHeader title="Library Settings" description="Configure library rules and contact information" />
        <p className="text-red-600">{loadError}</p>
      </div>
    );
  }

  if (!settings) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader title="Library Settings" description="Configure library rules and contact information" />
      {saveError && <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{saveError}</p>}
      {saved && <p className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">Settings saved successfully.</p>}
      <Card>
        <form onSubmit={handleSave} className="grid gap-4 md:grid-cols-2">
          <Input label="School Name" value={settings.schoolName} onChange={(e) => update("schoolName", e.target.value)} required />
          <Input label="Library Name" value={settings.libraryName} onChange={(e) => update("libraryName", e.target.value)} required />
          <Input label="Academic Year" value={settings.academicYear} onChange={(e) => update("academicYear", e.target.value)} required />
          <Input label="Contact Email" type="email" value={settings.contactEmail || ""} onChange={(e) => update("contactEmail", e.target.value)} />
          <Input label="Contact Phone" value={settings.contactPhone || ""} onChange={(e) => update("contactPhone", e.target.value)} />
          <Input label="Borrowing Period (days)" type="number" min={1} max={365} value={String(settings.borrowingPeriodDays)} onChange={(e) => update("borrowingPeriodDays", e.target.value)} required />
          <Input label="Max Books Allowed" type="number" min={1} max={50} value={String(settings.maxBooksAllowed)} onChange={(e) => update("maxBooksAllowed", e.target.value)} required />
          <Input label="Renewal Limit" type="number" min={0} max={20} value={String(settings.renewalLimit)} onChange={(e) => update("renewalLimit", e.target.value)} required />
          <div className="md:col-span-2">
            <Textarea label="Library Rules" value={settings.libraryRules || ""} onChange={(e) => update("libraryRules", e.target.value)} rows={4} />
          </div>
          <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save Settings"}</Button>
        </form>
      </Card>
    </div>
  );
}
