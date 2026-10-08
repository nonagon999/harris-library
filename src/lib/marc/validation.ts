import { z } from "zod";
import type { HarrisBibliographicInput } from "./types";

export const bookFormSchema = z.object({
  title: z.string().trim().min(1, "Title is required."),
  author: z.string().trim().optional().nullable(),
  editor: z.string().trim().optional().nullable(),
  edition: z.string().trim().optional().nullable(),
  placeOfPublication: z.string().trim().min(1, "Place of Publication is required."),
  publisher: z.string().trim().min(1, "Publisher is required."),
  copyright: z.coerce.number().int().min(1000, "Copyright year is required.").max(9999),
  pages: z.coerce.number().int().min(1, "Pages is required."),
  illustration: z.string().trim().optional().nullable(),
  seriesName: z.string().trim().optional().nullable(),
  seriesNumber: z.string().trim().optional().nullable(),
  note: z.string().trim().optional().nullable(),
  isbn: z.string().trim().optional().nullable(),
  callNumber: z.string().trim().min(1, "Call Number is required."),
  accessionNumber: z.string().trim().min(1, "Accession Number is required."),
  subtitle: z.string().trim().optional().nullable(),
  subject: z.string().trim().optional().nullable(),
  ddc: z.string().trim().optional().nullable(),
  lcClassification: z.string().trim().optional().nullable(),
  categoryId: z.string().trim().optional().nullable(),
  collectionType: z.string().optional(),
  academicLevel: z.string().optional(),
  description: z.string().trim().optional().nullable(),
  locationId: z.string().trim().optional().nullable(),
  coverImageUrl: z.string().trim().optional().nullable(),
});

export type BookFormInput = z.infer<typeof bookFormSchema>;

/** Edit form — accession number is managed on physical copies, not required here. */
export const bookEditFormSchema = bookFormSchema.omit({ accessionNumber: true, locationId: true });
export type BookEditFormInput = z.infer<typeof bookEditFormSchema>;

export function toHarrisBibliographicInput(data: BookFormInput): HarrisBibliographicInput {
  return {
    title: data.title,
    author: data.author || "",
    editor: data.editor,
    edition: data.edition,
    placeOfPublication: data.placeOfPublication,
    publisher: data.publisher,
    copyright: data.copyright,
    pages: data.pages,
    illustration: data.illustration,
    seriesName: data.seriesName,
    seriesNumber: data.seriesNumber,
    note: data.note,
    isbn: data.isbn,
    callNumber: data.callNumber,
    accessionNumber: data.accessionNumber,
    subtitle: data.subtitle,
    subject: data.subject,
    ddc: data.ddc,
    lcClassification: data.lcClassification,
  };
}

export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export function sanitizeMarcText(value: string): string {
  return value
    .replace(/\u0000/g, "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .trim()
    .slice(0, 4000);
}
