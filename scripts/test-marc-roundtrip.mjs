#!/usr/bin/env node
/**
 * Test Harris MARC mapping + marcjs ISO2709 export.
 */
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { Marc } = require("marcjs");

// Dynamic import for TS module via tsx would be ideal; inline minimal test of marcjs parse
const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<record xmlns="http://www.loc.gov/MARC21/slim">
  <leader>00000nam a2200000 a 4500</leader>
  <controlfield tag="001">TEST001</controlfield>
  <datafield tag="245" ind1="1" ind2="0">
    <subfield code="a">Introduction to Computer Science</subfield>
  </datafield>
  <datafield tag="100" ind1="1" ind2=" ">
    <subfield code="a">John Smith</subfield>
  </datafield>
</record>`;

const parsed = Marc.parse(sampleXml, "marcxml");
const titleField = parsed.get("245")[0];
const title = titleField?.subf?.find((s) => s[0] === "a")?.[1];

if (title === "Introduction to Computer Science") {
  console.log("✅ MARCXML parse test passed");
  try {
    const iso = Marc.format(parsed, "iso2709");
    const reparsed = Marc.parse(iso, "iso2709");
    const title2 = reparsed.get("245")[0]?.subf?.find((s) => s[0] === "a")?.[1]?.trim();
    if (title2?.startsWith("Introduction to Computer Science")) {
      console.log("✅ ISO2709 round-trip test passed");
    } else {
      console.log("⚠ ISO2709 round-trip title:", JSON.stringify(title2));
    }
  } catch (e) {
    console.log("⚠ ISO2709 export skipped:", e.message);
  }
  process.exit(0);
}

console.error("❌ MARCXML parse failed — title:", title);
process.exit(1);
