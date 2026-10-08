"use client";

import { Input, Select, Textarea } from "@/components/ui/FormFields";
import { ACADEMIC_LEVELS, COLLECTION_TYPES } from "@/lib/constants";
import type { BookFormState } from "@/lib/books/form";

type BookFormFieldsProps = {
  form: BookFormState;
  errors: Record<string, string>;
  categories: { value: string; label: string }[];
  mode: "create" | "edit";
  onChange: (field: keyof BookFormState, value: string) => void;
};

export function BookFormFields({ form, errors, categories, mode, onChange }: BookFormFieldsProps) {
  function fieldError(name: string) {
    return errors[name];
  }

  return (
    <>
      <h3 className="md:col-span-2 text-sm font-semibold text-[var(--hmc-blue)]">Bibliographic Information</h3>

      <Input label="Title *" value={form.title} onChange={(e) => onChange("title", e.target.value)} error={fieldError("title")} required />
      <Input label="Subtitle" value={form.subtitle} onChange={(e) => onChange("subtitle", e.target.value)} />
      <Input label="Author" value={form.author} onChange={(e) => onChange("author", e.target.value)} />
      <Input label="Edition" value={form.edition} onChange={(e) => onChange("edition", e.target.value)} />
      <Input label="Editor" value={form.editor} onChange={(e) => onChange("editor", e.target.value)} />
      <Input label="Place of Publication *" value={form.placeOfPublication} onChange={(e) => onChange("placeOfPublication", e.target.value)} error={fieldError("placeOfPublication")} required />
      <Input label="Publisher *" value={form.publisher} onChange={(e) => onChange("publisher", e.target.value)} error={fieldError("publisher")} required />
      <Input label="Copyright *" type="number" value={form.copyright} onChange={(e) => onChange("copyright", e.target.value)} error={fieldError("copyright")} required />
      <Input label="Pages *" type="number" value={form.pages} onChange={(e) => onChange("pages", e.target.value)} error={fieldError("pages")} required />
      <Input label="Illustration" value={form.illustration} onChange={(e) => onChange("illustration", e.target.value)} placeholder="e.g. illustrations" />
      <Input label="Series Name" value={form.seriesName} onChange={(e) => onChange("seriesName", e.target.value)} />
      <Input label="Series Number" value={form.seriesNumber} onChange={(e) => onChange("seriesNumber", e.target.value)} />
      <Input label="ISBN" value={form.isbn} onChange={(e) => onChange("isbn", e.target.value)} />
      <Input label="Cover Image URL" value={form.coverImageUrl} onChange={(e) => onChange("coverImageUrl", e.target.value)} placeholder="https://..." />
      <div className="md:col-span-2">
        <Textarea label="Note" value={form.note} onChange={(e) => onChange("note", e.target.value)} rows={2} />
      </div>

      <h3 className="md:col-span-2 mt-2 text-sm font-semibold text-[var(--hmc-blue)]">Library Identification</h3>

      {mode === "create" && (
        <Input
          label="Accession Number *"
          value={form.accessionNumber}
          onChange={(e) => onChange("accessionNumber", e.target.value)}
          error={fieldError("accessionNumber")}
          placeholder="HMC-2001"
          required
        />
      )}
      <Input label="Call Number *" value={form.callNumber} onChange={(e) => onChange("callNumber", e.target.value)} error={fieldError("callNumber")} required />
      <Input label="DDC" value={form.ddc} onChange={(e) => onChange("ddc", e.target.value)} placeholder="e.g. 005.133" />
      <Input label="LC Classification" value={form.lcClassification} onChange={(e) => onChange("lcClassification", e.target.value)} placeholder="e.g., QA76.73.J38" />
      <Input label="Subject" value={form.subject} onChange={(e) => onChange("subject", e.target.value)} />
      <Select label="Category" value={form.categoryId} onChange={(e) => onChange("categoryId", e.target.value)} options={categories} />
      <Select label="Collection Type" value={form.collectionType} onChange={(e) => onChange("collectionType", e.target.value)} options={[...COLLECTION_TYPES]} />
      <Select label="Academic Level" value={form.academicLevel} onChange={(e) => onChange("academicLevel", e.target.value)} options={[...ACADEMIC_LEVELS]} />
    </>
  );
}
