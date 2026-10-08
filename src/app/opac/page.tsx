"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import OpacPageContent from "./OpacPageContent";

function OpacFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--hmc-blue-soft)]">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--hmc-blue-border)] border-t-[var(--hmc-blue)]" />
    </div>
  );
}

function OpacPageContentWrapper() {
  const params = useSearchParams();
  const initialQ = params.get("q") || "";
  const initialSort = params.get("sort") || "";
  const initialAcademicLevel = params.get("academicLevel") || "";
  const initialCollectionType = params.get("collectionType") || "";
  const remountKey = `${initialQ}|${initialSort}|${initialAcademicLevel}|${initialCollectionType}`;

  return (
    <OpacPageContent
      key={remountKey}
      initialQ={initialQ}
      initialSort={initialSort}
      initialAcademicLevel={initialAcademicLevel}
      initialCollectionType={initialCollectionType}
    />
  );
}

export default function OpacPage() {
  return (
    <Suspense fallback={<OpacFallback />}>
      <OpacPageContentWrapper />
    </Suspense>
  );
}
