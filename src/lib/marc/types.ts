/** Normalized MARC21 field representation used inside the application. */
export type MarcSubfieldData = {
  code: string;
  value: string;
  subfieldOrder?: number;
};

export type MarcFieldData = {
  tag: string;
  ind1?: string;
  ind2?: string;
  controlValue?: string;
  subfields?: MarcSubfieldData[];
  fieldOrder?: number;
};

export type MarcRecordData = {
  leader?: string;
  controlNumber001?: string;
  recordStatus?: string;
  recordType?: string;
  bibliographicLevel?: string;
  encodingLevel?: string;
  catalogingForm?: string;
  fields: MarcFieldData[];
};

/** Simplified Harris bibliographic input (Add Book / import mapping). */
export type HarrisBibliographicInput = {
  title: string;
  author?: string | null;
  editor?: string | null;
  edition?: string | null;
  placeOfPublication: string;
  publisher: string;
  copyright?: number | null;
  pages?: number | null;
  illustration?: string | null;
  seriesName?: string | null;
  seriesNumber?: string | null;
  note?: string | null;
  isbn?: string | null;
  callNumber: string;
  accessionNumber: string;
  subtitle?: string | null;
  subject?: string | null;
  ddc?: string | null;
  lcClassification?: string | null;
  controlNumber001?: string | null;
};

export type ParsedMarcRecord = {
  index: number;
  marc: MarcRecordData;
  simplified: Partial<HarrisBibliographicInput> & { copyright?: number | null };
  errors: string[];
  rawPreview: MarcFieldPreview[];
};

export type MarcFieldPreview = {
  tag: string;
  ind1?: string;
  ind2?: string;
  subfields?: { code: string; value: string }[];
  value?: string;
};

export type DuplicateMatch = {
  bookId: string;
  title: string;
  reason: string;
};

export type ImportRecordStatus = "VALID" | "ERROR" | "DUPLICATE" | "IMPORTED" | "SKIPPED";

export const MARC_CONTROL_TAGS = new Set([
  "001", "003", "005", "006", "007", "008",
]);

export const MAX_MARC_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB
