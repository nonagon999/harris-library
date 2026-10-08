/** Search variants for DDC/LC — tolerates spacing and case differences. */
export function classificationSearchVariants(search: string): string[] {
  const trimmed = search.trim();
  if (!trimmed) return [];

  const variants = new Set<string>([trimmed]);
  const collapsed = trimmed.replace(/\s+/g, "");
  if (collapsed) variants.add(collapsed);

  return [...variants];
}

/** Prisma OR filters for DDC and LC classification search. */
export function classificationSearchFilters(search: string) {
  return classificationSearchVariants(search).flatMap((variant) => [
    { ddc: { contains: variant, mode: "insensitive" as const } },
    { lcClassification: { contains: variant, mode: "insensitive" as const } },
  ]);
}
