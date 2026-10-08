import type { BookFormInput } from "@/lib/marc/validation";

export type BookFormState = {
  title: string;
  subtitle: string;
  author: string;
  editor: string;
  edition: string;
  placeOfPublication: string;
  publisher: string;
  copyright: string;
  pages: string;
  illustration: string;
  seriesName: string;
  seriesNumber: string;
  note: string;
  isbn: string;
  callNumber: string;
  accessionNumber: string;
  subject: string;
  ddc: string;
  lcClassification: string;
  categoryId: string;
  collectionType: string;
  academicLevel: string;
  locationId: string;
  coverImageUrl: string;
};

export const emptyBookForm = (): BookFormState => ({
  title: "",
  subtitle: "",
  author: "",
  editor: "",
  edition: "",
  placeOfPublication: "",
  publisher: "",
  copyright: "",
  pages: "",
  illustration: "",
  seriesName: "",
  seriesNumber: "",
  note: "",
  isbn: "",
  callNumber: "",
  accessionNumber: "",
  subject: "",
  ddc: "",
  lcClassification: "",
  categoryId: "",
  collectionType: "GENERAL_COLLECTION",
  academicLevel: "GENERAL",
  locationId: "",
  coverImageUrl: "",
});

export function bookRecordToForm(
  data: Record<string, unknown>,
  options?: { accessionNumber?: string }
): BookFormState {
  return {
    title: (data.title as string) || "",
    subtitle: (data.subtitle as string) || "",
    author: (data.author as string) || "",
    editor: (data.editor as string) || "",
    edition: (data.edition as string) || "",
    placeOfPublication: (data.placeOfPublication as string) || "",
    publisher: (data.publisher as string) || "",
    copyright: data.publicationYear ? String(data.publicationYear) : "",
    pages: data.numberOfPages ? String(data.numberOfPages) : "",
    illustration: (data.illustration as string) || "",
    seriesName: (data.seriesName as string) || "",
    seriesNumber: (data.seriesNumber as string) || "",
    note: (data.note as string) || "",
    isbn: (data.isbn as string) || "",
    callNumber: (data.callNumber as string) || "",
    accessionNumber: options?.accessionNumber || "",
    subject: (data.subject as string) || "",
    ddc: (data.ddc as string) || "",
    lcClassification: (data.lcClassification as string) || "",
    categoryId: (data.categoryId as string) || "",
    collectionType: (data.collectionType as string) || "GENERAL_COLLECTION",
    academicLevel: (data.academicLevel as string) || "GENERAL",
    locationId: "",
    coverImageUrl: (data.coverImageUrl as string) || "",
  };
}

export function formsEqual(a: BookFormState, b: BookFormState): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function toBookFormPayload(form: BookFormState): BookFormInput {
  return {
    title: form.title,
    subtitle: form.subtitle || null,
    author: form.author || null,
    editor: form.editor || null,
    edition: form.edition || null,
    placeOfPublication: form.placeOfPublication,
    publisher: form.publisher,
    copyright: Number(form.copyright) || new Date().getFullYear(),
    pages: Number(form.pages) || 1,
    illustration: form.illustration || null,
    seriesName: form.seriesName || null,
    seriesNumber: form.seriesNumber || null,
    note: form.note || null,
    isbn: form.isbn || null,
    callNumber: form.callNumber,
    accessionNumber: form.accessionNumber,
    subject: form.subject || null,
    ddc: form.ddc || null,
    lcClassification: form.lcClassification || null,
    categoryId: form.categoryId || null,
    collectionType: form.collectionType,
    academicLevel: form.academicLevel,
    description: form.note || null,
    locationId: form.locationId || null,
  };
}
