import {
  BookMarked,
  BookOpen,
  GraduationCap,
  Library,
  ScrollText,
  Sparkles,
  School,
  type LucideIcon,
} from "lucide-react";

export type OpacBrowseFilter = {
  academicLevel?: string;
  collectionType?: string;
};

export type OpacBrowseCategory = {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  filter: OpacBrowseFilter;
  accent: string;
};

/** Browse tiles mapped to real database fields (academicLevel / collectionType). */
export const OPAC_BROWSE_CATEGORIES: OpacBrowseCategory[] = [
  {
    id: "preschool",
    label: "Preschool",
    description: "Early learning & children's materials",
    icon: Sparkles,
    filter: { academicLevel: "PRESCHOOL" },
    accent: "from-violet-500/10 to-violet-600/5",
  },
  {
    id: "elementary",
    label: "Elementary",
    description: "Primary school textbooks & readers",
    icon: School,
    filter: { academicLevel: "ELEMENTARY" },
    accent: "from-teal-500/10 to-teal-600/5",
  },
  {
    id: "jhs",
    label: "Junior High School",
    description: "Textbooks & references for JHS",
    icon: BookOpen,
    filter: { academicLevel: "JHS" },
    accent: "from-sky-500/10 to-sky-600/5",
  },
  {
    id: "shs",
    label: "Senior High School",
    description: "SHS curriculum resources",
    icon: GraduationCap,
    filter: { academicLevel: "SHS" },
    accent: "from-emerald-500/10 to-emerald-600/5",
  },
  {
    id: "college",
    label: "College",
    description: "Higher education & research",
    icon: Library,
    filter: { academicLevel: "COLLEGE" },
    accent: "from-[var(--hmc-blue)]/10 to-[var(--hmc-blue)]/5",
  },
  {
    id: "reference",
    label: "Reference Materials",
    description: "Encyclopedias, dictionaries & guides",
    icon: BookMarked,
    filter: { collectionType: "REFERENCE" },
    accent: "from-amber-500/10 to-amber-600/5",
  },
  {
    id: "fiction",
    label: "Fiction & Literature",
    description: "Novels, stories & creative works",
    icon: BookOpen,
    filter: { collectionType: "FICTION" },
    accent: "from-rose-500/10 to-rose-600/5",
  },
  {
    id: "filipiniana",
    label: "Filipiniana",
    description: "Philippine history, culture & heritage",
    icon: ScrollText,
    filter: { collectionType: "FILIPINIANA" },
    accent: "from-orange-500/10 to-orange-600/5",
  },
  {
    id: "theses",
    label: "Research & Theses",
    description: "Academic research & dissertations",
    icon: GraduationCap,
    filter: { collectionType: "THESES" },
    accent: "from-indigo-500/10 to-indigo-600/5",
  },
];

export const OPAC_SORT_OPTIONS = [
  { value: "title", label: "Title (A–Z)" },
  { value: "author", label: "Author (A–Z)" },
  { value: "newest", label: "Recently Added" },
] as const;

export type OpacSortValue = (typeof OPAC_SORT_OPTIONS)[number]["value"];
