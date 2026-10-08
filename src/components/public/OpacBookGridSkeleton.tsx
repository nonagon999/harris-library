export function OpacBookGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4" aria-busy="true" aria-label="Loading books">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-[var(--hmc-blue-border)] bg-white p-0">
          <div className="opac-skeleton aspect-[2/3] w-full rounded-none" />
          <div className="space-y-3 p-4">
            <div className="opac-skeleton h-4 w-full rounded" />
            <div className="opac-skeleton h-4 w-2/3 rounded" />
            <div className="opac-skeleton h-6 w-24 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
