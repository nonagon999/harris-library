import type { MarcFieldData, MarcRecordData } from "./types";

function firstSubfield(fields: MarcFieldData[], tag: string, code: string): string | null {
  for (const field of fields) {
    if (field.tag !== tag) continue;
    const sub = field.subfields?.find((s) => s.code === code);
    if (sub?.value) return sub.value.trim();
  }
  return null;
}

function allSubfields(fields: MarcFieldData[], tag: string, code: string): string[] {
  const values: string[] = [];
  for (const field of fields) {
    if (field.tag !== tag) continue;
    for (const sub of field.subfields || []) {
      if (sub.code === code && sub.value.trim()) values.push(sub.value.trim());
    }
  }
  return values;
}

function controlField(fields: MarcFieldData[], tag: string): string | null {
  const field = fields.find((f) => f.tag === tag);
  return field?.controlValue?.trim() || null;
}

function parseIntSafe(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = value.match(/\d{4}/);
  return match ? parseInt(match[0], 10) : null;
}

function parsePages(extent: string | null): number | null {
  if (!extent) return null;
  const match = extent.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Koha exports branch codes in 952$a / 952$b (e.g. "HMC"), not unique item barcodes.
 * Prefer 952$p (item/barcode), then 952$6 (Koha item key), then 001, then legacy 949$a.
 */
function extractAccessionFromMarc(fields: MarcFieldData[], marc: MarcRecordData): string {
  const branchA = firstSubfield(fields, "952", "a");
  const kohaItemId = firstSubfield(fields, "952", "p");
  const kohaItemKey = firstSubfield(fields, "952", "6");
  const koha949 = firstSubfield(fields, "949", "a");
  const control001 = marc.controlNumber001 || controlField(fields, "001");

  const isBranchCode = (value: string | null) => {
    if (!value?.trim()) return false;
    const v = value.trim();
    if (branchA && v.toUpperCase() === branchA.toUpperCase()) return true;
    return v.length <= 4 && /^[A-Z]+$/i.test(v);
  };

  if (kohaItemId && !isBranchCode(kohaItemId)) return kohaItemId;
  if (kohaItemKey) return kohaItemKey;
  if (control001) return control001;
  if (koha949 && !isBranchCode(koha949)) return koha949;
  if (kohaItemId) return kohaItemId;

  return "";
}

/** Extract Harris simplified fields from a normalized MARC record (preserves unmapped tags separately). */
export function extractSimplifiedFromMarc(marc: MarcRecordData) {
  const fields = marc.fields;
  const title = firstSubfield(fields, "245", "a") || "";
  const subtitle = firstSubfield(fields, "245", "b");
  const statementOfResp = firstSubfield(fields, "245", "c");

  const author =
    firstSubfield(fields, "100", "a") ||
    firstSubfield(fields, "110", "a") ||
    firstSubfield(fields, "111", "a") ||
    "";

  const editors = [
    ...allSubfields(fields, "700", "a"),
    ...allSubfields(fields, "710", "a"),
  ];
  const editor = editors[0] || null;

  const edition = firstSubfield(fields, "250", "a");
  const isbn = firstSubfield(fields, "020", "a");

  const place =
    firstSubfield(fields, "264", "a") ||
    firstSubfield(fields, "260", "a") ||
    "";
  const publisher =
    firstSubfield(fields, "264", "b") ||
    firstSubfield(fields, "260", "b") ||
    "";
  const copyrightRaw =
    firstSubfield(fields, "264", "c") ||
    firstSubfield(fields, "260", "c") ||
    "";
  const copyright = parseIntSafe(copyrightRaw);

  const extent = firstSubfield(fields, "300", "a");
  const pages = parsePages(extent);
  const illustration = firstSubfield(fields, "300", "b");

  const seriesName = firstSubfield(fields, "490", "a") || firstSubfield(fields, "830", "a");
  const seriesNumber = firstSubfield(fields, "490", "v") || firstSubfield(fields, "830", "v");

  const notes = [...allSubfields(fields, "500", "a"), ...allSubfields(fields, "504", "a")];
  const note = notes.length ? notes.join(" ") : null;

  const subjects = allSubfields(fields, "650", "a");
  const subject = subjects.length ? subjects.join("; ") : null;

  const callNumber = firstSubfield(fields, "090", "a") || "";
  const ddc = firstSubfield(fields, "082", "a");
  const lcClassification = firstSubfield(fields, "050", "a");

  const accessionNumber = extractAccessionFromMarc(fields, marc);

  const controlNumber001 = marc.controlNumber001 || controlField(fields, "001");

  return {
    title,
    subtitle,
    author: author || statementOfResp || "",
    editor,
    edition,
    placeOfPublication: place,
    publisher,
    copyright,
    pages,
    illustration,
    seriesName,
    seriesNumber,
    note,
    isbn,
    callNumber,
    accessionNumber,
    subject,
    ddc,
    lcClassification,
    controlNumber001,
  };
}

export function toPreviewLines(marc: MarcRecordData) {
  return marc.fields.map((field) => {
    if (field.controlValue != null) {
      return { tag: field.tag, value: field.controlValue };
    }
    return {
      tag: field.tag,
      ind1: field.ind1 || " ",
      ind2: field.ind2 || " ",
      subfields: (field.subfields || []).map((s) => ({ code: s.code, value: s.value })),
    };
  });
}
