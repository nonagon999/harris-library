export const SCHOOL_NAME = "Harris Memorial College, Inc.";
export const LIBRARY_NAME = "Harris Memorial College Library";
export const SCHOOL_TAGLINE = "Pioneer in Kindergarten Education in the Philippines";

export const ACADEMIC_LEVELS = [
  { value: "PRESCHOOL", label: "Preschool" },
  { value: "ELEMENTARY", label: "Elementary" },
  { value: "JHS", label: "Junior High School (JHS)" },
  { value: "SHS", label: "Senior High School (SHS)" },
  { value: "COLLEGE", label: "College" },
  { value: "FACULTY_STAFF", label: "Faculty/Staff" },
  { value: "GENERAL", label: "General" },
] as const;

export const COLLECTION_TYPES = [
  { value: "GENERAL_COLLECTION", label: "General Collection" },
  { value: "REFERENCE", label: "Reference" },
  { value: "FICTION", label: "Fiction" },
  { value: "NON_FICTION", label: "Non-Fiction" },
  { value: "FILIPINIANA", label: "Filipiniana" },
  { value: "CHILDRENS_COLLECTION", label: "Children's Collection" },
  { value: "THESES", label: "Theses" },
  { value: "PERIODICALS", label: "Periodicals" },
  { value: "EDUCATIONAL_MATERIALS", label: "Educational Materials" },
] as const;

export const COPY_STATUSES = [
  { value: "AVAILABLE", label: "Available", color: "green" },
  { value: "BORROWED", label: "Borrowed", color: "blue" },
  { value: "OVERDUE", label: "Overdue", color: "red" },
  { value: "LOST", label: "Lost", color: "gray" },
  { value: "DAMAGED", label: "Damaged", color: "orange" },
  { value: "MISSING", label: "Missing", color: "yellow" },
  { value: "FOR_REPAIR", label: "For Repair", color: "purple" },
  { value: "ARCHIVED", label: "Archived", color: "gray" },
] as const;

export const BORROWER_TYPES = [
  { value: "STUDENT", label: "Student" },
  { value: "FACULTY", label: "Faculty" },
  { value: "STAFF", label: "Staff" },
  { value: "ADMINISTRATOR", label: "Administrator" },
  { value: "OTHER", label: "Other" },
] as const;

export const TRANSACTION_STATUSES = [
  { value: "BORROWED", label: "Borrowed" },
  { value: "RETURNED", label: "Returned" },
  { value: "OVERDUE", label: "Overdue" },
  { value: "RENEWED", label: "Renewed" },
  { value: "LOST", label: "Lost" },
  { value: "DAMAGED", label: "Damaged" },
] as const;

export function labelFor<T extends { value: string; label: string }>(
  items: readonly T[],
  value: string
): string {
  return items.find((i) => i.value === value)?.label ?? value;
}
