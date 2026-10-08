import { cn } from "@/lib/utils";
import type { OpacBrowseCategory } from "@/lib/opac-browse";

type OpacCategoryCardProps = {
  category: OpacBrowseCategory;
  onSelect: (category: OpacBrowseCategory) => void;
};

export function OpacCategoryCard({ category, onSelect }: OpacCategoryCardProps) {
  const Icon = category.icon;

  return (
    <button
      type="button"
      onClick={() => onSelect(category)}
      className={cn(
        "group flex flex-col items-start rounded-2xl border border-[var(--hmc-blue-border)] bg-white p-5 text-left shadow-sm",
        "transition hover:-translate-y-0.5 hover:border-[var(--hmc-blue)]/30 hover:shadow-md",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hmc-blue)]"
      )}
    >
      <div
        className={cn(
          "mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br",
          category.accent
        )}
      >
        <Icon className="h-6 w-6 text-[var(--hmc-blue)]" aria-hidden />
      </div>
      <h3 className="font-semibold text-[var(--hmc-blue)] group-hover:text-[var(--hmc-blue-dark)]">
        {category.label}
      </h3>
      <p className="mt-1 text-sm leading-relaxed text-[var(--hmc-text-muted)]">{category.description}</p>
    </button>
  );
}
