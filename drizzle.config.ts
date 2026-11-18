import { defineConfig } from "drizzle-kit";

const url = process.env.TURSO_DATABASE_URL ?? "file:local.db";
const isTurso = url.startsWith("libsql://") || url.startsWith("https://");

export default defineConfig(isTurso ? {
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: { url, authToken: process.env.TURSO_AUTH_TOKEN },
} : {
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: { url },
});
