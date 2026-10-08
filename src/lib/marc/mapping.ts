import type { HarrisBibliographicInput, MarcFieldData, MarcRecordData } from "./types";
import { MARC_CONTROL_TAGS } from "./types";

const DEFAULT_LEADER = "00000nam a2200000 a 4500";

function dataField(
  tag: string,
  ind1: string,
  ind2: string,
  subfields: { code: string; value: string }[],
  fieldOrder: number
): MarcFieldData {
  return {
    tag,
    ind1: ind1.slice(0, 1).padEnd(1, " "),
    ind2: ind2.slice(0, 1).padEnd(1, " "),
    subfields: subfields
      .filter((s) => s.value.trim())
      .map((s, i) => ({ code: s.code, value: s.value.trim(), subfieldOrder: i })),
    fieldOrder,
  };
}

function controlField(tag: string, value: string, fieldOrder: number): MarcFieldData {
  return { tag, controlValue: value, fieldOrder };
}

/** Build MARC21 bibliographic record from Harris simplified input. */
export function buildMarcFromHarris(input: HarrisBibliographicInput): MarcRecordData {
  const fields: MarcFieldData[] = [];
  let order = 0;

  if (input.controlNumber001) {
    fields.push(controlField("001", input.controlNumber001, order++));
  }

  if (input.isbn?.trim()) {
    fields.push(dataField("020", " ", " ", [{ code: "a", value: input.isbn.trim() }], order++));
  }

  const author = input.author?.trim();
  if (author) {
    fields.push(dataField("100", "1", " ", [{ code: "a", value: author }], order++));
  }

  const titleSubfields: { code: string; value: string }[] = [{ code: "a", value: input.title.trim() }];
  if (input.subtitle?.trim()) titleSubfields.push({ code: "b", value: input.subtitle.trim() });
  fields.push(dataField("245", "1", "0", titleSubfields, order++));

  if (input.edition?.trim()) {
    fields.push(dataField("250", " ", " ", [{ code: "a", value: input.edition.trim() }], order++));
  }

  // RDA 264 field group — publication (ind2 = 1)
  const pubSubfields: { code: string; value: string }[] = [
    { code: "a", value: input.placeOfPublication.trim() },
    { code: "b", value: input.publisher.trim() },
    { code: "c", value: String(input.copyright) },
  ];
  fields.push(dataField("264", " ", "1", pubSubfields, order++));

  const extentParts: { code: string; value: string }[] = [
    { code: "a", value: `${input.pages} pages` },
  ];
  if (input.illustration?.trim()) {
    extentParts.push({ code: "b", value: input.illustration.trim() });
  }
  fields.push(dataField("300", " ", " ", extentParts, order++));

  if (input.seriesName?.trim()) {
    const seriesSubs: { code: string; value: string }[] = [{ code: "a", value: input.seriesName.trim() }];
    if (input.seriesNumber?.trim()) seriesSubs.push({ code: "v", value: input.seriesNumber.trim() });
    fields.push(dataField("490", "1", " ", seriesSubs, order++));
  }

  if (input.note?.trim()) {
    fields.push(dataField("500", " ", " ", [{ code: "a", value: input.note.trim() }], order++));
  }

  if (input.subject?.trim()) {
    fields.push(dataField("650", " ", " ", [{ code: "a", value: input.subject.trim() }], order++));
  }

  if (input.editor?.trim()) {
    fields.push(dataField("700", "1", " ", [{ code: "a", value: input.editor.trim() }], order++));
  }

  if (input.ddc?.trim()) {
    fields.push(dataField("082", " ", " ", [{ code: "a", value: input.ddc.trim() }], order++));
  }

  if (input.lcClassification?.trim()) {
    fields.push(dataField("050", " ", "4", [{ code: "a", value: input.lcClassification.trim() }], order++));
  }

  if (input.callNumber?.trim()) {
    fields.push(dataField("090", " ", " ", [{ code: "a", value: input.callNumber.trim() }], order++));
  }

  // Koha-compatible local item field — accession stored here for migration round-trip
  if (input.accessionNumber?.trim()) {
    fields.push(
      dataField("952", " ", " ", [{ code: "a", value: input.accessionNumber.trim() }], order++)
    );
  }

  return {
    leader: DEFAULT_LEADER,
    controlNumber001: input.controlNumber001 || undefined,
    recordType: "a",
    bibliographicLevel: "m",
    encodingLevel: "7",
    catalogingForm: "a",
    fields,
  };
}

/** Convert marcjs Record or internal structure to MarcRecordData */
export function normalizeMarcjsRecord(record: {
  leader?: string;
  fields: unknown[];
}): MarcRecordData {
  const fields: MarcFieldData[] = [];
  let order = 0;

  for (const raw of record.fields) {
    if (!Array.isArray(raw) || raw.length < 2) continue;
    const tag = String(raw[0]);
    if (raw.length === 2) {
      fields.push({ tag, controlValue: String(raw[1]), fieldOrder: order++ });
      continue;
    }
    const indicators = String(raw[1] ?? "  ").padEnd(2, " ");
    const subfields: { code: string; value: string; subfieldOrder: number }[] = [];
    for (let i = 2; i + 1 < raw.length; i += 2) {
      subfields.push({
        code: String(raw[i]),
        value: String(raw[i + 1] ?? ""),
        subfieldOrder: subfields.length,
      });
    }
    fields.push({
      tag,
      ind1: indicators[0] ?? " ",
      ind2: indicators[1] ?? " ",
      subfields,
      fieldOrder: order++,
    });
  }

  const control001 = fields.find((f) => f.tag === "001")?.controlValue;

  return {
    leader: record.leader || DEFAULT_LEADER,
    controlNumber001: control001 || undefined,
    fields,
  };
}

/** Convert MarcRecordData to marcjs-compatible field array */
export function toMarcjsFields(marc: MarcRecordData): unknown[] {
  const sorted = [...marc.fields].sort((a, b) => (a.fieldOrder ?? 0) - (b.fieldOrder ?? 0));
  return sorted.map((field) => {
    if (field.controlValue != null || MARC_CONTROL_TAGS.has(field.tag)) {
      return [field.tag, field.controlValue ?? ""];
    }
    const ind = `${(field.ind1 ?? " ").slice(0, 1)}${(field.ind2 ?? " ").slice(0, 1)}`;
    const arr: unknown[] = [field.tag, ind];
    for (const sub of field.subfields || []) {
      arr.push(sub.code, sub.value);
    }
    return arr;
  });
}

export function marcRecordToMarcjs(marc: MarcRecordData) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Record } = require("marcjs");
  const rec = new Record();
  rec.leader = marc.leader || DEFAULT_LEADER;
  rec.fields = toMarcjsFields(marc);
  return rec;
}
