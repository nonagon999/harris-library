export type UserRole = "ADMIN" | "LIBRARIAN";
export type AcademicLevel = "PRESCHOOL" | "JHS" | "SHS" | "COLLEGE" | "FACULTY_STAFF" | "GENERAL";
export type CollectionType =
  | "GENERAL_COLLECTION" | "REFERENCE" | "FICTION" | "NON_FICTION" | "FILIPINIANA"
  | "CHILDRENS_COLLECTION" | "THESES" | "PERIODICALS" | "EDUCATIONAL_MATERIALS";
export type CopyStatus = "AVAILABLE" | "BORROWED" | "OVERDUE" | "LOST" | "DAMAGED" | "MISSING" | "FOR_REPAIR" | "ARCHIVED";
export type CopyCondition = "EXCELLENT" | "GOOD" | "FAIR" | "POOR";
export type BorrowerType = "STUDENT" | "FACULTY" | "STAFF" | "ADMINISTRATOR" | "OTHER";
export type BorrowerStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";
export type TransactionStatus = "BORROWED" | "RETURNED" | "OVERDUE" | "RENEWED" | "LOST" | "DAMAGED";
