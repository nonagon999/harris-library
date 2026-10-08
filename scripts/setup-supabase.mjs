#!/usr/bin/env node
/**
 * Harris Library — Supabase setup helper
 * Run: npm run db:setup
 */
import { readFileSync, existsSync } from "fs";
import { execSync } from "child_process";

function loadEnv() {
  const loaded = {};
  const files = [".env", ".env.local"]; // .env.local wins (loaded last)

  for (const file of files) {
    if (!existsSync(file)) continue;
    const content = readFileSync(file, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      loaded[key] = val;
    }
  }

  // Always prefer project .env files over inherited shell env
  for (const [key, val] of Object.entries(loaded)) {
    process.env[key] = val;
  }
}

loadEnv();

const dbUrl = process.env.DATABASE_URL || "";

if (!dbUrl || dbUrl.includes("[YOUR-PASSWORD]")) {
  console.error("\n❌ Supabase not configured yet.\n");
  console.error("1. Open: https://supabase.com/dashboard/project/jtrquebhngbnwtqqypwv/settings/database");
  console.error("2. Copy your Database password");
  console.error("3. Edit .env.local — set DATABASE_URL and DIRECT_URL");
  console.error("   ⚠ If password contains # or @, URL-encode them (# → %23, @ → %40)");
  console.error("4. Run: npm run db:setup\n");
  process.exit(1);
}

if (!dbUrl.startsWith("postgresql://")) {
  console.error("❌ DATABASE_URL must be a PostgreSQL connection string.");
  process.exit(1);
}

console.log("✓ Environment loaded from .env.local / .env\n");

try {
  console.log("→ Generating Prisma client...");
  execSync("npx prisma generate", { stdio: "inherit", env: process.env });

  console.log("\n→ Pushing schema to Supabase...");
  execSync("npx prisma db push", { stdio: "inherit", env: process.env });

  console.log("\n→ Seeding sample library data...");
  execSync("npm run db:seed", { stdio: "inherit", env: process.env });

  console.log("\n✅ Supabase setup complete!");
  console.log("\nStart the app: npm run dev");
  console.log("Login: librarian@hmc.edu.ph / librarian123\n");
} catch {
  console.error("\n❌ Setup failed. Common fixes:");
  console.error("  • URL-encode special chars in password (# → %23)");
  console.error("  • Verify project ref in connection string matches your Supabase project");
  console.error("  • Check password at Supabase Dashboard → Settings → Database\n");
  process.exit(1);
}
