import type { MarcRecordData, MarcFieldPreview } from "./types";
import { extractSimplifiedFromMarc, toPreviewLines } from "./extract";
import { normalizeMarcjsRecord } from "./mapping";

const RECORD_SEPARATOR = 0x1d;

function detectFormat(filename: string, content: string): "iso2709" | "marcxml" {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".xml") || content.trimStart().startsWith("<")) return "marcxml";
  return "iso2709";
}

function stripBom(buffer: Buffer): Buffer {
  if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
    return buffer.subarray(3);
  }
  return buffer;
}

function getMarcModule() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("marcjs") as {
    Marc: {
      parse: (raw: Buffer | string, type: string) => unknown;
    };
  };
}

function parseIso2709Buffer(buffer: Buffer): MarcRecordData[] {
  const { Marc } = getMarcModule();
  const records: MarcRecordData[] = [];
  let start = 0;

  for (let i = 0; i < buffer.length; i += 1) {
    if (buffer[i] === RECORD_SEPARATOR) {
      const slice = buffer.subarray(start, i + 1);
      if (slice.length > 24) {
        try {
          const parsed = Marc.parse(slice, "iso2709");
          records.push(normalizeMarcjsRecord(parsed as { leader?: string; fields: unknown[] }));
        } catch (err) {
          console.warn("[marc-import] Skipped malformed ISO2709 segment:", err instanceof Error ? err.message : err);
        }
      }
      start = i + 1;
    }
  }

  const remainder = buffer.subarray(start);
  if (remainder.length > 24) {
    try {
      const parsed = Marc.parse(remainder, "iso2709");
      records.push(normalizeMarcjsRecord(parsed as { leader?: string; fields: unknown[] }));
    } catch (err) {
      if (records.length === 0) {
        throw new Error(
          err instanceof Error
            ? `Unable to parse ISO2709/MARC binary file: ${err.message}`
            : "Unable to parse ISO2709/MARC binary file."
        );
      }
    }
  }

  return records;
}

function parseMarcxml(content: string): MarcRecordData[] {
  const { Marc } = getMarcModule();
  const records: MarcRecordData[] = [];

  const recordBlocks =
    content.match(/<record[\s>][\s\S]*?<\/record>/gi) ||
    content.match(/<marc:record[\s>][\s\S]*?<\/marc:record>/gi) ||
    [];

  const blocks = recordBlocks.length ? recordBlocks : content.trim() ? [content] : [];

  for (const block of blocks) {
    try {
      const parsed = Marc.parse(block, "marcxml");
      records.push(normalizeMarcjsRecord(parsed as { leader?: string; fields: unknown[] }));
    } catch (err) {
      console.warn("[marc-import] Skipped invalid MARCXML block:", err instanceof Error ? err.message : err);
    }
  }

  if (!records.length && content.trim()) {
    throw new Error("The uploaded file is not valid MARCXML.");
  }

  return records;
}

export type ParsedMarcRecord = {
  index: number;
  marc: MarcRecordData;
  simplified: ReturnType<typeof extractSimplifiedFromMarc>;
  errors: string[];
  rawPreview: MarcFieldPreview[];
};

function validateMarcStructure(marc: MarcRecordData): string[] {
  const errors: string[] = [];
  const title = marc.fields.find((f) => f.tag === "245");
  const hasTitle = title?.subfields?.some((s) => s.code === "a" && s.value.trim());
  if (!hasTitle) errors.push("245 $a Title is missing or malformed.");
  if (!marc.fields.length) errors.push("Record contains no MARC fields.");
  return errors;
}

export function parseMarcFile(
  filename: string,
  buffer: Buffer
): {
  format: "iso2709" | "marcxml";
  records: ParsedMarcRecord[];
} {
  if (!buffer.length) {
    throw new Error("The uploaded file is empty.");
  }

  const normalized = stripBom(buffer);
  const content = normalized.toString("utf8");
  const format = detectFormat(filename, content);

  let rawRecords: MarcRecordData[];
  try {
    rawRecords = format === "marcxml" ? parseMarcxml(content) : parseIso2709Buffer(normalized);
  } catch (err) {
    throw err instanceof Error ? err : new Error("Failed to parse MARC file.");
  }

  if (!rawRecords.length) {
    throw new Error(
      format === "marcxml"
        ? "No valid MARCXML records were found in the file."
        : "No valid ISO2709 MARC records were found. Ensure this is a Koha .mrc export."
    );
  }

  const records: ParsedMarcRecord[] = rawRecords.map((marc, index) => {
    const errors = validateMarcStructure(marc);
    const simplified = extractSimplifiedFromMarc(marc);
    return {
      index: index + 1,
      marc,
      simplified,
      errors,
      rawPreview: toPreviewLines(marc),
    };
  });

  return { format, records };
}
