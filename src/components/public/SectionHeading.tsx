export function SectionHeading({
  title,
  description,
  centered = false,
}: {
  title: string;
  description?: string;
  centered?: boolean;
}) {
  return (
    <div className={centered ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <h2 className="text-2xl font-bold tracking-tight text-[var(--hmc-blue)] sm:text-3xl">{title}</h2>
      {description && (
        <p className="mt-2 text-sm leading-relaxed text-[var(--hmc-text-muted)] sm:text-base">{description}</p>
      )}
      <div className={`mt-4 h-1 w-16 rounded-full bg-[var(--hmc-blue)] ${centered ? "mx-auto" : ""}`} />
    </div>
  );
}
