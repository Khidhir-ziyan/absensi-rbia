import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./migrations",
  dialect: "sqlite",
  dbCredentials: {
    // For local D1 development, use wrangler's local DB
    url: ".wrangler/state/v3/d1/miniflare-D1DatabaseObject/absensi-rbia.sqlite",
  },
});
