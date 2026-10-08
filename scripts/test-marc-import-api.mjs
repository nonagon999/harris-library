import { createRequire } from "module";
import { writeFileSync, unlinkSync } from "fs";
import { join } from "path";

const require = createRequire(import.meta.url);
const { Marc, Record } = require("marcjs");

const BASE = process.env.TEST_BASE_URL || "http://localhost:3000";

async function main() {
  const login = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@hmc.edu.ph", password: "admin123" }),
  });
  const cookie = login.headers.get("set-cookie")?.split(";")[0] || "";
  if (!login.ok) throw new Error(`Login failed: ${login.status}`);

  const rec = new Record();
  rec.leader = "00000nam a2200000 a 4500";
  rec.append(["001", "TEST-IMPORT-001"]);
  rec.append(["245", "10", "a", "Koha Import Test Book"]);
  rec.append(["100", "1 ", "a", "Jane Doe"]);
  rec.append(["264", " 1", "a", "Manila", "b", "Test Pub", "c", "2024"]);
  rec.append(["082", "  ", "a", "005.133"]);
  rec.append(["050", " 4", "a", "QA76.73.J38"]);

  const buf = Buffer.from(Marc.format(rec, "iso2709"));
  const tmpPath = join(process.cwd(), "scripts", "_test-import.mrc");
  writeFileSync(tmpPath, buf);

  const fd = new FormData();
  fd.append("file", new Blob([buf]), "test-import.mrc");

  const res = await fetch(`${BASE}/api/marc/import`, { method: "POST", headers: { cookie }, body: fd });
  const contentType = res.headers.get("content-type") || "";
  const text = await res.text();

  console.log("Status:", res.status);
  console.log("Content-Type:", contentType);
  console.log("Body preview:", text.slice(0, 300));

  if (!contentType.includes("application/json")) {
    throw new Error("Response is not JSON — this is the root cause of frontend parse errors");
  }

  const data = JSON.parse(text);
  if (!res.ok) throw new Error(data.message || data.error || "Import failed");

  console.log("Import preview OK:", data);
  unlinkSync(tmpPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
